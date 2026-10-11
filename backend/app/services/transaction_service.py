from typing import List, Optional
from datetime import datetime
from decimal import Decimal
from app.domain.transactions import Transaction, TransactionItem, TransactionStatus, ItemType
from app.domain.payments import Payment, PaymentMethod, PaymentStatus
from app.domain.inventory import InventoryAdjustmentReason
from app.schemas.transactions import TransactionCreate, TransactionItemCreate, PaymentRequest, RefundRequest, DiscountRequest, VoidRequest
from app.schemas.inventory import InventoryAdjustmentRequest
from app.repositories.memory.transactions import TransactionRepository
from app.repositories.memory.payments import PaymentRepository
from app.services.product_service import ProductService
from app.services.inventory_service import InventoryService
from app.core.exceptions import NotFoundException, ValidationException, BusinessRuleException
from app.domain.common import utc_now
from app.events.bus import event_bus
from app.events.events import TransactionCompletedEvent, RefundCreatedEvent, TransactionVoidedEvent
from app.core.ids import generate_id

class TransactionService:
    def __init__(
        self, 
        transaction_repo: TransactionRepository, 
        payment_repo: PaymentRepository,
        product_service: ProductService,
        inventory_service: InventoryService
    ):
        self.transaction_repo = transaction_repo
        self.payment_repo = payment_repo
        self.product_service = product_service
        self.inventory_service = inventory_service

    def create_transaction(self, organization_id: str, store_id: str, data: TransactionCreate) -> Transaction:
        tx = Transaction(
            organization_id=organization_id,
            store_id=store_id,
            **data.model_dump()
        )
        return self.transaction_repo.create(tx)

    def get_transaction(self, tx_id: str) -> Transaction:
        tx = self.transaction_repo.get(tx_id)
        if not tx:
            raise NotFoundException("Transaction", tx_id)
        return tx

    def add_item(self, tx_id: str, data: TransactionItemCreate) -> Transaction:
        tx = self.get_transaction(tx_id)
        if tx.status != TransactionStatus.PENDING:
            raise BusinessRuleException("Cannot modify a non-pending transaction")
            
        product = self.product_service.get_product(data.product_id)
        
        unit_price = product.bottle_price
        if data.item_type == ItemType.PACK and product.pack_price:
            unit_price = product.pack_price
        elif data.item_type == ItemType.CASE and product.case_price:
            unit_price = product.case_price
            
        item = TransactionItem(
            product_id=product.id,
            product_name=product.name,
            item_type=data.item_type,
            quantity=data.quantity,
            unit_price=unit_price,
            original_price=unit_price
        )
        tx.items.append(item)
        self._recalculate_totals(tx)
        return self.transaction_repo.update(tx)

    def remove_item(self, tx_id: str, item_id: str) -> Transaction:
        tx = self.get_transaction(tx_id)
        if tx.status != TransactionStatus.PENDING:
            raise BusinessRuleException("Cannot modify a non-pending transaction")
            
        initial_count = len(tx.items)
        tx.items = [item for item in tx.items if item.id != item_id]
        if len(tx.items) == initial_count:
            raise NotFoundException("TransactionItem", item_id)
            
        self._recalculate_totals(tx)
        return self.transaction_repo.update(tx)
        
    def void_item(self, tx_id: str, item_id: str, data: VoidRequest) -> Transaction:
        tx = self.get_transaction(tx_id)
        if tx.status != TransactionStatus.PENDING:
            raise BusinessRuleException("Cannot void items on a non-pending transaction")
            
        item = next((item for item in tx.items if item.id == item_id), None)
        if not item:
            raise NotFoundException("TransactionItem", item_id)
            
        if item.is_voided:
            raise BusinessRuleException("Item is already voided")
            
        item.is_voided = True
        self._recalculate_totals(tx)
        return self.transaction_repo.update(tx)

    def void_transaction(self, tx_id: str, data: VoidRequest) -> Transaction:
        tx = self.get_transaction(tx_id)
        if tx.status not in [TransactionStatus.PENDING]:
            raise BusinessRuleException("Cannot void this transaction")
            
        tx.status = TransactionStatus.VOIDED
        tx.void_reason = data.reason
        tx.cancelled_at = utc_now()
        for item in tx.items:
            item.is_voided = True
            
        self._recalculate_totals(tx)
        updated_tx = self.transaction_repo.update(tx)
        
        event_bus.publish(TransactionVoidedEvent(
            event_id=generate_id(),
            timestamp=utc_now(),
            organization_id=tx.organization_id,
            store_id=tx.store_id,
            employee_id=data.employee_id,
            transaction_id=tx.id,
            void_reason=data.reason
        ))
        return updated_tx

    def _recalculate_totals(self, tx: Transaction):
        subtotal = Decimal("0.00")
        tax_total = Decimal("0.00")
        
        for item in tx.items:
            if not item.is_voided and not item.is_refunded:
                item_total = (item.unit_price * item.quantity) - item.discount_amount
                subtotal += max(Decimal("0.00"), item_total)
                # Hardcoded 10% tax for simplicity unless a real tax category engine exists
                item.tax_amount = (item_total * Decimal("0.10")).quantize(Decimal("0.01"))
                tax_total += item.tax_amount
                
        tx.subtotal = subtotal
        tx.tax_total = tax_total
        tx.grand_total = max(Decimal("0.00"), tx.subtotal + tx.tax_total - tx.discount_total)
        tx.change_due = max(Decimal("0.00"), tx.amount_paid - tx.grand_total)

    def apply_discount(self, tx_id: str, data: DiscountRequest) -> Transaction:
        tx = self.get_transaction(tx_id)
        if tx.status != TransactionStatus.PENDING:
            raise BusinessRuleException("Cannot apply discount to a non-pending transaction")
            
        tx.discount_total = data.amount
        self._recalculate_totals(tx)
        return self.transaction_repo.update(tx)

    def add_payment(self, tx_id: str, data: PaymentRequest) -> Transaction:
        tx = self.get_transaction(tx_id)
        if tx.status != TransactionStatus.PENDING:
            raise BusinessRuleException("Cannot pay for a non-pending transaction")

        change_returned = Decimal("0.00")
        if data.method == PaymentMethod.CASH.value and data.amount_tendered and data.amount_tendered > data.amount:
            change_returned = data.amount_tendered - data.amount
            
        payment = Payment(
            transaction_id=tx_id,
            amount=data.amount,
            method=PaymentMethod(data.method),
            status=PaymentStatus.COMPLETED,
            amount_tendered=data.amount_tendered,
            change_returned=change_returned
        )
        self.payment_repo.create(payment)
        
        tx.amount_paid += data.amount
        self._recalculate_totals(tx)
        return self.transaction_repo.update(tx)

    def complete_transaction(self, tx_id: str) -> Transaction:
        tx = self.get_transaction(tx_id)
        if tx.status != TransactionStatus.PENDING:
            raise BusinessRuleException("Can only complete pending transactions")
            
        if tx.amount_paid < tx.grand_total:
            raise BusinessRuleException(f"Insufficient payment. Paid: {tx.amount_paid}, Due: {tx.grand_total}")
            
        tx.status = TransactionStatus.COMPLETED
        tx.completed_at = utc_now()
        
        for item in tx.items:
            if item.is_voided or item.is_refunded:
                continue
                
            qty_bottles = -item.quantity if item.item_type == ItemType.BOTTLE else 0
            qty_packs = -item.quantity if item.item_type == ItemType.PACK else 0
            qty_cases = -item.quantity if item.item_type == ItemType.CASE else 0
            
            adj_request = InventoryAdjustmentRequest(
                product_id=item.product_id,
                reason=InventoryAdjustmentReason.SALE,
                quantity_bottles_change=qty_bottles,
                quantity_packs_change=qty_packs,
                quantity_cases_change=qty_cases,
                employee_id=tx.employee_id,
                reference_id=tx.id
            )
            self.inventory_service.adjust_inventory(tx.organization_id, tx.store_id, adj_request)

        updated_tx = self.transaction_repo.update(tx)
        
        event_bus.publish(TransactionCompletedEvent(
            event_id=generate_id(),
            timestamp=utc_now(),
            organization_id=tx.organization_id,
            store_id=tx.store_id,
            employee_id=tx.employee_id,
            transaction_id=tx.id,
            grand_total=tx.grand_total,
            items=[{"product_id": i.product_id, "quantity": i.quantity} for i in tx.items if not i.is_voided and not i.is_refunded],
            discount_total=tx.discount_total
        ))
        
        return updated_tx
        
    def cancel_transaction(self, tx_id: str) -> Transaction:
        tx = self.get_transaction(tx_id)
        if tx.status != TransactionStatus.PENDING:
            raise BusinessRuleException("Can only cancel pending transactions")
            
        tx.status = TransactionStatus.CANCELLED
        tx.cancelled_at = utc_now()
        return self.transaction_repo.update(tx)
        
    def refund_transaction(self, tx_id: str, data: RefundRequest) -> Transaction:
        tx = self.get_transaction(tx_id)
        if tx.status not in [TransactionStatus.COMPLETED, TransactionStatus.REFUNDED]:
            raise BusinessRuleException("Can only refund completed transactions")
            
        all_refunded_before = all(item.is_refunded for item in tx.items if not item.is_voided)
        if all_refunded_before:
            raise BusinessRuleException("Transaction is already fully refunded")
        
        refund_count = 0
        refunded_amount = Decimal("0.00")
        items_refunded = []
        for item in tx.items:
            if item.is_voided or item.is_refunded:
                continue
            if data.items is None or item.id in data.items:
                item.is_refunded = True
                refund_count += 1
                item_total = (item.unit_price * item.quantity) - item.discount_amount
                item_tax = (item_total * Decimal("0.10")).quantize(Decimal("0.01"))
                refunded_amount += max(Decimal("0.00"), item_total + item_tax)
                items_refunded.append(item.id)
                
                qty_bottles = item.quantity if item.item_type == ItemType.BOTTLE else 0
                qty_packs = item.quantity if item.item_type == ItemType.PACK else 0
                qty_cases = item.quantity if item.item_type == ItemType.CASE else 0
                
                adj_request = InventoryAdjustmentRequest(
                    product_id=item.product_id,
                    reason=InventoryAdjustmentReason.RETURN,
                    quantity_bottles_change=qty_bottles,
                    quantity_packs_change=qty_packs,
                    quantity_cases_change=qty_cases,
                    employee_id=data.employee_id,
                    reference_id=tx.id
                )
                self.inventory_service.adjust_inventory(tx.organization_id, tx.store_id, adj_request)
        
        if refund_count == 0:
            raise BusinessRuleException("No valid items to refund")
            
        self._recalculate_totals(tx)
        
        # Determine if fully or partially refunded
        if all(item.is_refunded for item in tx.items if not item.is_voided):
            tx.status = TransactionStatus.REFUNDED
            
        updated_tx = self.transaction_repo.update(tx)
        
        event_bus.publish(RefundCreatedEvent(
            event_id=generate_id(),
            timestamp=utc_now(),
            organization_id=tx.organization_id,
            store_id=tx.store_id,
            employee_id=data.employee_id,
            transaction_id=tx.id,
            refund_amount=refunded_amount,
            items_refunded=items_refunded
        ))
        
        return updated_tx

    def list_transactions(self, organization_id: str, store_id: str) -> List[Transaction]:
        return self.transaction_repo.list(organization_id=organization_id, store_id=store_id)

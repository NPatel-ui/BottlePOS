import dataclasses
from app.domain.audit import AuditEvent
from app.repositories.memory.audit import AuditRepository
from app.events.bus import event_bus
from app.events.events import (
    TransactionCompletedEvent,
    TransactionVoidedEvent,
    RefundCreatedEvent,
    InventoryAdjustedEvent,
    CashVarianceDetectedEvent,
    ShiftClosedEvent,
    ReceivingDiscrepancyEvent
)
from app.core.ids import generate_id
from app.domain.common import utc_now

class AuditService:
    def __init__(self, repo: AuditRepository):
        self.repo = repo
        self._subscribe_to_events()

    def _subscribe_to_events(self):
        event_bus.subscribe(TransactionCompletedEvent, self._handle_tx_completed)
        event_bus.subscribe(TransactionVoidedEvent, self._handle_tx_voided)
        event_bus.subscribe(RefundCreatedEvent, self._handle_refund_created)
        event_bus.subscribe(InventoryAdjustedEvent, self._handle_inventory_adjusted)
        event_bus.subscribe(CashVarianceDetectedEvent, self._handle_cash_variance)
        event_bus.subscribe(ShiftClosedEvent, self._handle_shift_closed)
        event_bus.subscribe(ReceivingDiscrepancyEvent, self._handle_receiving_discrepancy)

    def _handle_tx_completed(self, event: TransactionCompletedEvent):
        self._log_event(
            event.organization_id, event.store_id, event.employee_id,
            "TRANSACTION_COMPLETED", "Transaction", event.transaction_id,
            metadata={"grand_total": str(event.grand_total), "discount_total": str(event.discount_total), "items_count": len(event.items)}
        )

    def _handle_tx_voided(self, event: TransactionVoidedEvent):
        self._log_event(
            event.organization_id, event.store_id, event.employee_id,
            "TRANSACTION_VOIDED", "Transaction", event.transaction_id,
            metadata={"void_reason": event.void_reason}
        )

    def _handle_refund_created(self, event: RefundCreatedEvent):
        self._log_event(
            event.organization_id, event.store_id, event.employee_id,
            "REFUND_CREATED", "Transaction", event.transaction_id,
            metadata={"refund_amount": str(event.refund_amount), "items_refunded": event.items_refunded}
        )

    def _handle_inventory_adjusted(self, event: InventoryAdjustedEvent):
        self._log_event(
            event.organization_id, event.store_id, event.employee_id,
            "INVENTORY_ADJUSTED", "Inventory", event.product_id,
            metadata={
                "reason": event.reason,
                "d_bottles": event.quantity_bottles_change,
                "d_packs": event.quantity_packs_change,
                "d_cases": event.quantity_cases_change
            }
        )

    def _handle_cash_variance(self, event: CashVarianceDetectedEvent):
        self._log_event(
            event.organization_id, event.store_id, event.employee_id,
            "CASH_VARIANCE_DETECTED", "Shift", event.shift_id,
            metadata={"variance_amount": str(event.variance_amount)}
        )

    def _handle_shift_closed(self, event: ShiftClosedEvent):
        self._log_event(
            event.organization_id, event.store_id, event.employee_id,
            "SHIFT_CLOSED", "Shift", event.shift_id,
            metadata={
                "closing_cash": str(event.closing_cash),
                "expected_cash": str(event.expected_cash),
                "variance": str(event.variance_amount)
            }
        )

    def _handle_receiving_discrepancy(self, event: ReceivingDiscrepancyEvent):
        self._log_event(
            event.organization_id, event.store_id, event.employee_id,
            "RECEIVING_DISCREPANCY", "PurchaseOrder", event.purchase_order_id,
            metadata={
                "product_id": event.product_id,
                "expected_qty": event.expected_quantity,
                "received_qty": event.received_quantity
            }
        )

    def _log_event(self, org_id: str, store_id: str, emp_id: str, evt_type: str, ent_type: str, ent_id: str, metadata: dict = None):
        audit_event = AuditEvent(
            organization_id=org_id,
            store_id=store_id,
            employee_id=emp_id or "SYSTEM",
            event_type=evt_type,
            entity_type=ent_type,
            entity_id=ent_id,
            metadata=metadata
        )
        self.repo.create(audit_event)

    def list_events(self, org_id: str, store_id: str, skip: int = 0, limit: int = 100, entity_type: str = None, entity_id: str = None):
        filters = {"organization_id": org_id, "store_id": store_id}
        if entity_type:
            filters["entity_type"] = entity_type
        if entity_id:
            filters["entity_id"] = entity_id
        return self.repo.list(skip=skip, limit=limit, **filters)

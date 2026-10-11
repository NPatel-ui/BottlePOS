from app.domain.inventory import Inventory, InventoryTransaction, InventoryAdjustmentReason
from app.schemas.inventory import InventoryAdjustmentRequest, CaseBreakRequest
from app.repositories.memory.inventory import InventoryRepository, InventoryTransactionRepository
from app.core.exceptions import ValidationException
from app.events.bus import event_bus
from app.events.events import InventoryAdjustedEvent
from app.domain.common import utc_now
from app.core.ids import generate_id

class InventoryService:
    def __init__(self, inventory_repo: InventoryRepository, transaction_repo: InventoryTransactionRepository):
        self.inventory_repo = inventory_repo
        self.transaction_repo = transaction_repo

    def get_inventory(self, organization_id: str, store_id: str, product_id: str) -> Inventory:
        inv = self.inventory_repo.get_by_product(organization_id, store_id, product_id)
        if not inv:
            inv = self.inventory_repo.create(Inventory(
                organization_id=organization_id,
                store_id=store_id,
                product_id=product_id
            ))
        return inv

    def adjust_inventory(self, organization_id: str, store_id: str, request: InventoryAdjustmentRequest) -> Inventory:
        inv = self.inventory_repo.adjust_quantities(
            organization_id=organization_id,
            store_id=store_id,
            product_id=request.product_id,
            d_bottles=request.quantity_bottles_change,
            d_packs=request.quantity_packs_change,
            d_cases=request.quantity_cases_change
        )
        
        transaction = InventoryTransaction(
            organization_id=organization_id,
            store_id=store_id,
            **request.model_dump()
        )
        self.transaction_repo.create(transaction)
        
        event_bus.publish(InventoryAdjustedEvent(
            event_id=generate_id(),
            timestamp=utc_now(),
            organization_id=organization_id,
            store_id=store_id,
            employee_id=request.employee_id,
            product_id=request.product_id,
            reason=request.reason.value,
            quantity_bottles_change=request.quantity_bottles_change,
            quantity_packs_change=request.quantity_packs_change,
            quantity_cases_change=request.quantity_cases_change
        ))
        
        return inv

    def break_case(self, organization_id: str, store_id: str, request: CaseBreakRequest) -> Inventory:
        inv = self.get_inventory(organization_id, store_id, request.product_id)
        if inv.quantity_cases < 1:
            raise ValidationException("Not enough cases to break")
            
        adjustment = InventoryAdjustmentRequest(
            product_id=request.product_id,
            reason=InventoryAdjustmentReason.CASE_BREAK,
            quantity_cases_change=-1,
            quantity_bottles_change=request.bottles_per_case,
            employee_id=request.employee_id,
            notes="Case break"
        )
        return self.adjust_inventory(organization_id, store_id, adjustment)

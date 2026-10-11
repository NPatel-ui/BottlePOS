from typing import List
from app.domain.purchasing import PurchaseOrder, PurchaseOrderItem, POStatus
from app.schemas.purchasing import POCreate, POReceiveRequest
from app.repositories.memory.purchasing import PORepository
from app.core.exceptions import NotFoundException, BusinessRuleException
from app.domain.common import utc_now
from app.events.bus import event_bus
from app.events.events import ReceivingDiscrepancyEvent
from app.core.ids import generate_id
from app.services.inventory_service import InventoryService
from app.schemas.inventory import InventoryAdjustmentRequest
from app.domain.inventory import InventoryAdjustmentReason

class PurchasingService:
    def __init__(self, repo: PORepository, inventory_service: InventoryService):
        self.repo = repo
        self.inventory_service = inventory_service

    def create_po(self, organization_id: str, store_id: str, data: POCreate) -> PurchaseOrder:
        items = [
            PurchaseOrderItem(
                product_id=i.product_id,
                expected_quantity=i.expected_quantity,
                expected_cost=i.expected_cost
            ) for i in data.items
        ]
        po = PurchaseOrder(
            organization_id=organization_id,
            store_id=store_id,
            vendor_id=data.vendor_id,
            employee_id=data.employee_id,
            notes=data.notes,
            items=items
        )
        return self.repo.create(po)

    def get_po(self, po_id: str) -> PurchaseOrder:
        po = self.repo.get(po_id)
        if not po:
            raise NotFoundException("PurchaseOrder", po_id)
        return po

    def list_pos(self, organization_id: str, store_id: str) -> List[PurchaseOrder]:
        return self.repo.list(organization_id=organization_id, store_id=store_id)
        
    def mark_ordered(self, po_id: str) -> PurchaseOrder:
        po = self.get_po(po_id)
        if po.status != POStatus.DRAFT:
            raise BusinessRuleException("Can only order a DRAFT PO")
        po.status = POStatus.ORDERED
        po.ordered_at = utc_now()
        return self.repo.update(po)

    def receive_po(self, po_id: str, request: POReceiveRequest) -> PurchaseOrder:
        po = self.get_po(po_id)
        if po.status not in [POStatus.ORDERED, POStatus.PARTIALLY_RECEIVED]:
            raise BusinessRuleException("PO is not in a receivable state")

        for rec_item in request.items:
            po_item = next((i for i in po.items if i.id == rec_item.item_id), None)
            if not po_item:
                continue
                
            po_item.received_quantity += rec_item.received_quantity
            
            # Increase inventory
            if rec_item.received_quantity > 0:
                self.inventory_service.adjust_inventory(
                    po.organization_id, 
                    po.store_id, 
                    InventoryAdjustmentRequest(
                        product_id=po_item.product_id,
                        reason=InventoryAdjustmentReason.RECEIVED,
                        quantity_bottles_change=rec_item.received_quantity,
                        quantity_packs_change=0,
                        quantity_cases_change=0,
                        employee_id=request.employee_id,
                        reference_id=po.id
                    )
                )

        # Check for completion or discrepancy
        fully_received = True
        for item in po.items:
            if item.received_quantity < item.expected_quantity:
                fully_received = False
            
            if item.received_quantity != item.expected_quantity:
                event_bus.publish(ReceivingDiscrepancyEvent(
                    event_id=generate_id(),
                    timestamp=utc_now(),
                    organization_id=po.organization_id,
                    store_id=po.store_id,
                    employee_id=request.employee_id,
                    purchase_order_id=po.id,
                    product_id=item.product_id,
                    expected_quantity=item.expected_quantity,
                    received_quantity=item.received_quantity
                ))

        if fully_received:
            po.status = POStatus.RECEIVED
            po.received_at = utc_now()
        else:
            po.status = POStatus.PARTIALLY_RECEIVED

        return self.repo.update(po)

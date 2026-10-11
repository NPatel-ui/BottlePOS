from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from enum import Enum
from app.domain.common import utc_now
from app.core.ids import generate_id

class POStatus(str, Enum):
    DRAFT = "DRAFT"
    ORDERED = "ORDERED"
    PARTIALLY_RECEIVED = "PARTIALLY_RECEIVED"
    RECEIVED = "RECEIVED"
    CANCELLED = "CANCELLED"

@dataclass
class PurchaseOrderItem:
    product_id: str
    expected_quantity: int
    expected_cost: Decimal
    id: str = field(default_factory=generate_id)
    received_quantity: int = 0
    
@dataclass
class PurchaseOrder:
    organization_id: str
    store_id: str
    vendor_id: str
    employee_id: str
    id: str = field(default_factory=generate_id)
    status: POStatus = POStatus.DRAFT
    items: List[PurchaseOrderItem] = field(default_factory=list)
    created_at: datetime = field(default_factory=utc_now)
    ordered_at: Optional[datetime] = None
    received_at: Optional[datetime] = None
    notes: Optional[str] = None

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
from enum import Enum
from app.domain.common import utc_now
from app.core.ids import generate_id

class InventoryAdjustmentReason(str, Enum):
    RECEIVED = "RECEIVED"
    SALE = "SALE"
    SALE_VOID = "SALE_VOID"
    RETURN = "RETURN"
    CASE_BREAK = "CASE_BREAK"
    COUNT = "COUNT"
    DAMAGED = "DAMAGED"
    MISSING = "MISSING"
    TRANSFER = "TRANSFER"
    MANUAL = "MANUAL"

@dataclass
class Inventory:
    organization_id: str
    store_id: str
    product_id: str
    quantity_bottles: int = 0
    quantity_packs: int = 0
    quantity_cases: int = 0
    id: str = field(default_factory=generate_id)
    created_at: datetime = field(default_factory=utc_now)
    updated_at: datetime = field(default_factory=utc_now)

@dataclass
class InventoryTransaction:
    organization_id: str
    store_id: str
    product_id: str
    reason: InventoryAdjustmentReason
    quantity_bottles_change: int
    quantity_packs_change: int
    quantity_cases_change: int
    employee_id: str
    id: str = field(default_factory=generate_id)
    reference_id: Optional[str] = None 
    notes: Optional[str] = None
    created_at: datetime = field(default_factory=utc_now)

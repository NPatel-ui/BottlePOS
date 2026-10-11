from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional
from app.domain.inventory import InventoryAdjustmentReason

class InventoryAdjustmentRequest(BaseModel):
    product_id: str
    reason: InventoryAdjustmentReason
    quantity_bottles_change: int = 0
    quantity_packs_change: int = 0
    quantity_cases_change: int = 0
    employee_id: str
    reference_id: Optional[str] = None
    notes: Optional[str] = None

class CaseBreakRequest(BaseModel):
    product_id: str
    employee_id: str
    bottles_per_case: int

class InventoryResponse(BaseModel):
    id: str
    organization_id: str
    store_id: str
    product_id: str
    quantity_bottles: int
    quantity_packs: int
    quantity_cases: int
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

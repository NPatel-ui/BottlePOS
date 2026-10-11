from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from app.domain.purchasing import POStatus

class POItemCreate(BaseModel):
    product_id: str
    expected_quantity: int
    expected_cost: Decimal

class POCreate(BaseModel):
    vendor_id: str
    employee_id: str
    notes: Optional[str] = None
    items: List[POItemCreate]

class POItemResponse(BaseModel):
    id: str
    product_id: str
    expected_quantity: int
    expected_cost: Decimal
    received_quantity: int
    
    model_config = ConfigDict(from_attributes=True)

class POResponse(BaseModel):
    id: str
    organization_id: str
    store_id: str
    vendor_id: str
    employee_id: str
    status: POStatus
    items: List[POItemResponse]
    notes: Optional[str]
    created_at: datetime
    ordered_at: Optional[datetime]
    received_at: Optional[datetime]
    
    model_config = ConfigDict(from_attributes=True)

class POReceiveItem(BaseModel):
    item_id: str
    received_quantity: int

class POReceiveRequest(BaseModel):
    employee_id: str
    items: List[POReceiveItem]

from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class CustomerCreate(BaseModel):
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    notes: Optional[str] = None

class CustomerUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    notes: Optional[str] = None

class CustomerResponse(BaseModel):
    id: str
    organization_id: str
    store_id: str
    first_name: str
    last_name: str
    email: Optional[str]
    phone: Optional[str]
    loyalty_points: int
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

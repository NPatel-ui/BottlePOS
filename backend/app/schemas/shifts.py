from pydantic import BaseModel, ConfigDict
from datetime import datetime
from decimal import Decimal
from typing import Optional
from app.domain.shifts import ShiftStatus, CashDrawerEventType

class ShiftOpenRequest(BaseModel):
    employee_id: str
    opening_cash: Decimal

class ShiftCloseRequest(BaseModel):
    closing_cash: Decimal

class ShiftResponse(BaseModel):
    id: str
    organization_id: str
    store_id: str
    employee_id: str
    status: ShiftStatus
    opening_cash: Decimal
    closing_cash: Optional[Decimal]
    expected_cash: Optional[Decimal]
    cash_variance: Optional[Decimal]
    opened_at: datetime
    closed_at: Optional[datetime]
    
    model_config = ConfigDict(from_attributes=True)

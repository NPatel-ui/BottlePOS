from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal
from typing import Optional
from enum import Enum
from app.domain.common import utc_now
from app.core.ids import generate_id

class ShiftStatus(str, Enum):
    OPEN = "OPEN"
    CLOSED = "CLOSED"

@dataclass
class Shift:
    organization_id: str
    store_id: str
    employee_id: str
    opening_cash: Decimal
    id: str = field(default_factory=generate_id)
    status: ShiftStatus = ShiftStatus.OPEN
    closing_cash: Optional[Decimal] = None
    expected_cash: Optional[Decimal] = None
    cash_variance: Optional[Decimal] = None
    opened_at: datetime = field(default_factory=utc_now)
    closed_at: Optional[datetime] = None

class CashDrawerEventType(str, Enum):
    OPEN_SHIFT = "OPEN_SHIFT"
    CLOSE_SHIFT = "CLOSE_SHIFT"
    CASH_SALE = "CASH_SALE"
    CASH_REFUND = "CASH_REFUND"
    PAID_OUT = "PAID_OUT"
    CASH_DROP = "CASH_DROP"
    MANUAL_OPEN = "MANUAL_OPEN"

@dataclass
class CashDrawerEvent:
    organization_id: str
    store_id: str
    shift_id: str
    employee_id: str
    event_type: CashDrawerEventType
    amount: Decimal
    id: str = field(default_factory=generate_id)
    reference_id: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime = field(default_factory=utc_now)

from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal
from typing import Optional
from enum import Enum
from app.domain.common import utc_now
from app.core.ids import generate_id

class PaymentMethod(str, Enum):
    CASH = "CASH"
    CARD = "CARD"
    DIGITAL = "DIGITAL"
    OTHER = "OTHER"

class PaymentStatus(str, Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"

@dataclass
class Payment:
    transaction_id: str
    amount: Decimal
    method: PaymentMethod
    id: str = field(default_factory=generate_id)
    status: PaymentStatus = PaymentStatus.PENDING
    reference: Optional[str] = None
    amount_tendered: Optional[Decimal] = None
    change_returned: Optional[Decimal] = None
    reversal_reason: Optional[str] = None
    created_at: datetime = field(default_factory=utc_now)

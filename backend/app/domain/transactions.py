from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from enum import Enum
from app.domain.common import utc_now
from app.core.ids import generate_id

class TransactionStatus(str, Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    ON_HOLD = "ON_HOLD"
    VOIDED = "VOIDED"
    REFUNDED = "REFUNDED"

class ItemType(str, Enum):
    BOTTLE = "BOTTLE"
    PACK = "PACK"
    CASE = "CASE"

@dataclass
class TransactionItem:
    product_id: str
    product_name: str
    item_type: ItemType
    quantity: int
    unit_price: Decimal
    id: str = field(default_factory=generate_id)
    original_price: Optional[Decimal] = None
    discount_amount: Decimal = Decimal("0.00")
    discount_reason: Optional[str] = None
    tax_amount: Decimal = Decimal("0.00")
    is_voided: bool = False
    is_refunded: bool = False

@dataclass
class Transaction:
    organization_id: str
    store_id: str
    employee_id: str
    shift_id: str
    id: str = field(default_factory=generate_id)
    customer_id: Optional[str] = None
    status: TransactionStatus = TransactionStatus.PENDING
    items: List[TransactionItem] = field(default_factory=list)
    subtotal: Decimal = Decimal("0.00")
    tax_total: Decimal = Decimal("0.00")
    discount_total: Decimal = Decimal("0.00")
    grand_total: Decimal = Decimal("0.00")
    amount_paid: Decimal = Decimal("0.00")
    change_due: Decimal = Decimal("0.00")
    created_at: datetime = field(default_factory=utc_now)
    completed_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    void_reason: Optional[str] = None
    
    @property
    def is_completed(self) -> bool:
        return self.status == TransactionStatus.COMPLETED

from pydantic import BaseModel, ConfigDict
from decimal import Decimal
from typing import List, Optional
from datetime import datetime
from app.domain.transactions import TransactionStatus, ItemType

class TransactionItemCreate(BaseModel):
    product_id: str
    item_type: ItemType = ItemType.BOTTLE
    quantity: int = 1

class TransactionCreate(BaseModel):
    employee_id: str
    shift_id: str
    customer_id: Optional[str] = None

class TransactionItemResponse(BaseModel):
    id: str
    product_id: str
    product_name: str
    item_type: ItemType
    quantity: int
    unit_price: Decimal
    original_price: Optional[Decimal]
    discount_amount: Decimal
    discount_reason: Optional[str]
    tax_amount: Decimal
    is_voided: bool
    is_refunded: bool
    
    model_config = ConfigDict(from_attributes=True)

class TransactionResponse(BaseModel):
    id: str
    organization_id: str
    store_id: str
    employee_id: str
    shift_id: str
    customer_id: Optional[str]
    status: TransactionStatus
    items: List[TransactionItemResponse]
    subtotal: Decimal
    tax_total: Decimal
    discount_total: Decimal
    grand_total: Decimal
    amount_paid: Decimal
    change_due: Decimal
    created_at: datetime
    completed_at: Optional[datetime]
    cancelled_at: Optional[datetime]
    void_reason: Optional[str]
    
    model_config = ConfigDict(from_attributes=True)

class PaymentRequest(BaseModel):
    amount: Decimal
    method: str
    amount_tendered: Optional[Decimal] = None

class RefundRequest(BaseModel):
    employee_id: str
    reason: str
    items: Optional[List[str]] = None

class DiscountRequest(BaseModel):
    amount: Decimal
    reason: str
    employee_id: str

class VoidRequest(BaseModel):
    reason: str
    employee_id: str

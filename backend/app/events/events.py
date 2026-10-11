from dataclasses import dataclass
from typing import Dict, Any, Optional
from datetime import datetime
from decimal import Decimal

@dataclass
class Event:
    event_id: str
    timestamp: datetime
    organization_id: str
    store_id: str
    employee_id: Optional[str]

@dataclass
class TransactionCompletedEvent(Event):
    transaction_id: str
    grand_total: Decimal
    items: list
    discount_total: Decimal

@dataclass
class RefundCreatedEvent(Event):
    transaction_id: str
    refund_amount: Decimal
    items_refunded: list

@dataclass
class TransactionVoidedEvent(Event):
    transaction_id: str
    void_reason: str

@dataclass
class InventoryAdjustedEvent(Event):
    product_id: str
    reason: str
    quantity_bottles_change: int
    quantity_packs_change: int
    quantity_cases_change: int

@dataclass
class CashVarianceDetectedEvent(Event):
    shift_id: str
    variance_amount: Decimal

@dataclass
class ReceivingDiscrepancyEvent(Event):
    purchase_order_id: str
    product_id: str
    expected_quantity: int
    received_quantity: int

@dataclass
class ShiftClosedEvent(Event):
    shift_id: str
    closing_cash: Decimal
    expected_cash: Decimal
    variance_amount: Decimal

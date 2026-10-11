from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, List
from enum import Enum
from app.domain.common import utc_now
from app.core.ids import generate_id

class EmployeeRole(str, Enum):
    OWNER = "OWNER"
    ADMIN = "ADMIN"
    MANAGER = "MANAGER"
    CASHIER = "CASHIER"
    INVENTORY_MANAGER = "INVENTORY_MANAGER"

class Permission(str, Enum):
    CREATE_TRANSACTION = "CREATE_TRANSACTION"
    REFUND_TRANSACTION = "REFUND_TRANSACTION"
    VOID_TRANSACTION = "VOID_TRANSACTION"
    APPLY_DISCOUNT = "APPLY_DISCOUNT"
    OVERRIDE_PRICE = "OVERRIDE_PRICE"
    ADJUST_INVENTORY = "ADJUST_INVENTORY"
    MANAGE_EMPLOYEES = "MANAGE_EMPLOYEES"
    VIEW_REPORTS = "VIEW_REPORTS"
    VIEW_SHIELD = "VIEW_SHIELD"
    RESOLVE_SHIELD_ALERT = "RESOLVE_SHIELD_ALERT"
    MANAGE_PURCHASING = "MANAGE_PURCHASING"
    MANAGE_CUSTOMERS = "MANAGE_CUSTOMERS"
    MANAGE_PRODUCTS = "MANAGE_PRODUCTS"
    MANAGE_CASH = "MANAGE_CASH"

@dataclass
class Employee:
    organization_id: str
    store_id: str
    first_name: str
    last_name: str
    role: EmployeeRole
    id: str = field(default_factory=generate_id)
    email: Optional[str] = None
    phone: Optional[str] = None
    password_hash: Optional[str] = None
    active_status: bool = True
    permissions: List[Permission] = field(default_factory=list)
    created_at: datetime = field(default_factory=utc_now)
    updated_at: datetime = field(default_factory=utc_now)

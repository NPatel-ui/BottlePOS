from typing import Optional, List
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordBearer
from app.core.security import decode_access_token
from app.domain.employees import Employee, EmployeeRole, Permission
from app.repositories.memory.products import ProductRepository
from app.services.product_service import ProductService
from app.repositories.memory.inventory import InventoryRepository, InventoryTransactionRepository
from app.services.inventory_service import InventoryService
from app.repositories.memory.transactions import TransactionRepository
from app.repositories.memory.payments import PaymentRepository
from app.services.transaction_service import TransactionService
from app.repositories.memory.employees import EmployeeRepository
from app.services.employee_service import EmployeeService
from app.core.idempotency import idempotency_store

from app.repositories.memory.shifts import ShiftRepository, CashDrawerEventRepository
from app.services.shift_service import ShiftService
from app.repositories.memory.vendors import VendorRepository
from app.services.vendor_service import VendorService
from app.repositories.memory.purchasing import PORepository
from app.services.purchasing_service import PurchasingService
from app.repositories.memory.customers import CustomerRepository
from app.services.customer_service import CustomerService

from app.repositories.memory.audit import AuditRepository
from app.services.audit_service import AuditService
from app.repositories.memory.shield import ShieldAlertRepository, ShieldInvestigationRepository
from app.services.shield_service import ShieldService
from app.events.bus import event_bus

from app.core.supabase import get_supabase_client

# Determine if Supabase backend repository is configured
_supabase_active = get_supabase_client() is not None

if _supabase_active:
    from app.repositories.supabase.products import SupabaseProductRepository
    from app.repositories.supabase.inventory import SupabaseInventoryRepository, SupabaseInventoryTransactionRepository
    from app.repositories.supabase.transactions import SupabaseTransactionRepository
    from app.repositories.supabase.payments import SupabasePaymentRepository
    from app.repositories.supabase.employees import SupabaseEmployeeRepository
    from app.repositories.supabase.shifts import SupabaseShiftRepository, SupabaseCashDrawerEventRepository
    from app.repositories.supabase.vendors import SupabaseVendorRepository
    from app.repositories.supabase.purchasing import SupabasePORepository
    from app.repositories.supabase.customers import SupabaseCustomerRepository
    from app.repositories.supabase.audit import SupabaseAuditRepository
    from app.repositories.supabase.shield import SupabaseShieldAlertRepository, SupabaseShieldInvestigationRepository

    product_repository = SupabaseProductRepository()
    inventory_repository = SupabaseInventoryRepository()
    inventory_transaction_repository = SupabaseInventoryTransactionRepository()
    transaction_repository = SupabaseTransactionRepository()
    payment_repository = SupabasePaymentRepository()
    employee_repository = SupabaseEmployeeRepository()
    shift_repository = SupabaseShiftRepository()
    cash_drawer_repository = SupabaseCashDrawerEventRepository()
    vendor_repository = SupabaseVendorRepository()
    po_repository = SupabasePORepository()
    customer_repository = SupabaseCustomerRepository()
    audit_repository = SupabaseAuditRepository()
    shield_alert_repository = SupabaseShieldAlertRepository()
    shield_investigation_repository = SupabaseShieldInvestigationRepository()
else:
    # In-memory singletons (active when SUPABASE_URL is not set)
    product_repository = ProductRepository()
    inventory_repository = InventoryRepository()
    inventory_transaction_repository = InventoryTransactionRepository()
    transaction_repository = TransactionRepository()
    payment_repository = PaymentRepository()
    employee_repository = EmployeeRepository()
    shift_repository = ShiftRepository()
    cash_drawer_repository = CashDrawerEventRepository()
    vendor_repository = VendorRepository()
    po_repository = PORepository()
    customer_repository = CustomerRepository()
    audit_repository = AuditRepository()
    shield_alert_repository = ShieldAlertRepository()
    shield_investigation_repository = ShieldInvestigationRepository()

product_service = ProductService(product_repository)
inventory_service = InventoryService(inventory_repository, inventory_transaction_repository)
transaction_service = TransactionService(
    transaction_repository, 
    payment_repository, 
    product_service, 
    inventory_service
)
employee_service = EmployeeService(employee_repository)
shift_service = ShiftService(shift_repository, cash_drawer_repository)
vendor_service = VendorService(vendor_repository)
purchasing_service = PurchasingService(po_repository, inventory_service)
customer_service = CustomerService(customer_repository)
audit_service = AuditService(audit_repository)
shield_service = ShieldService(shield_alert_repository, shield_investigation_repository, event_bus)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def get_product_service() -> ProductService:
    return product_service

def get_inventory_service() -> InventoryService:
    return inventory_service

def get_transaction_service() -> TransactionService:
    return transaction_service

def get_employee_service() -> EmployeeService:
    return employee_service

def get_shift_service() -> ShiftService:
    return shift_service
    
def get_vendor_service() -> VendorService:
    return vendor_service
    
def get_purchasing_service() -> PurchasingService:
    return purchasing_service
    
def get_customer_service() -> CustomerService:
    return customer_service

def get_audit_service() -> AuditService:
    return audit_service

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    emp_service: EmployeeService = Depends(get_employee_service)
) -> Employee:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(token)
        employee_id: str = payload.get("sub")
        if employee_id is None:
            raise credentials_exception
    except Exception:
        raise credentials_exception
    
    employee = emp_service.get_employee(employee_id)
    if employee is None:
        raise credentials_exception
    if not employee.active_status:
        raise HTTPException(status_code=400, detail="Inactive user")
    return employee

class RequirePermissions:
    def __init__(self, required_permissions: List[Permission]):
        self.required_permissions = required_permissions

    async def __call__(self, current_user: Employee = Depends(get_current_user)) -> Employee:
        if current_user.role == EmployeeRole.OWNER:
            return current_user
        
        user_perms = set(current_user.permissions)
        if not all(p in user_perms for p in self.required_permissions):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        return current_user

async def get_idempotency_key(x_idempotency_key: Optional[str] = Header(None)) -> Optional[str]:
    return x_idempotency_key

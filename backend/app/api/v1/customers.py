from fastapi import APIRouter, Depends
from typing import List
from app.schemas.customers import CustomerCreate, CustomerUpdate, CustomerResponse
from app.services.customer_service import CustomerService
from app.domain.employees import Employee, Permission
from app.api.deps import get_customer_service, get_current_user, RequirePermissions

router = APIRouter(prefix="/customers", tags=["customers"])

@router.post("", response_model=CustomerResponse, status_code=201)
async def create_customer(
    data: CustomerCreate,
    service: CustomerService = Depends(get_customer_service),
    current_user: Employee = Depends(RequirePermissions([Permission.MANAGE_CUSTOMERS]))
):
    return service.create_customer(current_user.organization_id, current_user.store_id, data)

@router.get("", response_model=List[CustomerResponse])
async def list_customers(
    service: CustomerService = Depends(get_customer_service),
    current_user: Employee = Depends(get_current_user)
):
    return service.list_customers(current_user.organization_id, current_user.store_id)

@router.get("/{id}", response_model=CustomerResponse)
async def get_customer(
    id: str,
    service: CustomerService = Depends(get_customer_service),
    current_user: Employee = Depends(get_current_user)
):
    return service.get_customer(id)

@router.patch("/{id}", response_model=CustomerResponse)
async def update_customer(
    id: str,
    data: CustomerUpdate,
    service: CustomerService = Depends(get_customer_service),
    current_user: Employee = Depends(RequirePermissions([Permission.MANAGE_CUSTOMERS]))
):
    return service.update_customer(id, data)

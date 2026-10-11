from typing import List
from fastapi import APIRouter, Depends
from app.schemas.employees import EmployeeCreate, EmployeeUpdate, EmployeeResponse
from app.domain.employees import Employee, Permission
from app.services.employee_service import EmployeeService
from app.api.deps import get_employee_service, get_current_user, RequirePermissions

router = APIRouter(prefix="/employees", tags=["employees"])

@router.post("", response_model=EmployeeResponse)
async def create_employee(
    data: EmployeeCreate,
    service: EmployeeService = Depends(get_employee_service),
    current_user: Employee = Depends(RequirePermissions([Permission.MANAGE_EMPLOYEES]))
):
    return service.create_employee(current_user.organization_id, current_user.store_id, data)

@router.get("", response_model=List[EmployeeResponse])
async def list_employees(
    service: EmployeeService = Depends(get_employee_service),
    current_user: Employee = Depends(RequirePermissions([Permission.MANAGE_EMPLOYEES]))
):
    return service.list_employees(current_user.organization_id, current_user.store_id)

@router.get("/me", response_model=EmployeeResponse)
async def get_current_employee(
    current_user: Employee = Depends(get_current_user)
):
    return current_user

@router.get("/{employee_id}", response_model=EmployeeResponse)
async def get_employee(
    employee_id: str,
    service: EmployeeService = Depends(get_employee_service),
    current_user: Employee = Depends(RequirePermissions([Permission.MANAGE_EMPLOYEES]))
):
    return service.get_employee(employee_id)

@router.put("/{employee_id}", response_model=EmployeeResponse)
async def update_employee(
    employee_id: str,
    data: EmployeeUpdate,
    service: EmployeeService = Depends(get_employee_service),
    current_user: Employee = Depends(RequirePermissions([Permission.MANAGE_EMPLOYEES]))
):
    return service.update_employee(employee_id, data)

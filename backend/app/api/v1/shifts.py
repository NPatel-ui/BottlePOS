from fastapi import APIRouter, Depends
from typing import List
from app.schemas.shifts import ShiftOpenRequest, ShiftCloseRequest
from app.domain.shifts import Shift
from app.services.shift_service import ShiftService
from app.domain.employees import Employee, Permission
from app.api.deps import get_shift_service, get_current_user, RequirePermissions

router = APIRouter(prefix="/shifts", tags=["shifts"])

@router.post("/open", response_model=Shift)
async def open_shift(
    data: ShiftOpenRequest,
    service: ShiftService = Depends(get_shift_service),
    current_user: Employee = Depends(RequirePermissions([Permission.MANAGE_CASH]))
):
    return service.open_shift(current_user.organization_id, current_user.store_id, data)

@router.post("/{id}/close", response_model=Shift)
async def close_shift(
    id: str,
    data: ShiftCloseRequest,
    service: ShiftService = Depends(get_shift_service),
    current_user: Employee = Depends(RequirePermissions([Permission.MANAGE_CASH]))
):
    return service.close_shift(id, data)

@router.get("/{id}", response_model=Shift)
async def get_shift(
    id: str,
    service: ShiftService = Depends(get_shift_service),
    current_user: Employee = Depends(get_current_user)
):
    return service.get_shift(id)

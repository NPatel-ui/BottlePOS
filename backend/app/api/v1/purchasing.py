from fastapi import APIRouter, Depends
from typing import List
from app.schemas.purchasing import POCreate, POResponse, POReceiveRequest
from app.services.purchasing_service import PurchasingService
from app.domain.employees import Employee, Permission
from app.api.deps import get_purchasing_service, get_current_user, RequirePermissions

router = APIRouter(prefix="/pos", tags=["purchasing"])

@router.post("", response_model=POResponse, status_code=201)
async def create_po(
    data: POCreate,
    service: PurchasingService = Depends(get_purchasing_service),
    current_user: Employee = Depends(RequirePermissions([Permission.MANAGE_PURCHASING]))
):
    return service.create_po(current_user.organization_id, current_user.store_id, data)

@router.get("", response_model=List[POResponse])
async def list_pos(
    service: PurchasingService = Depends(get_purchasing_service),
    current_user: Employee = Depends(get_current_user)
):
    return service.list_pos(current_user.organization_id, current_user.store_id)

@router.get("/{id}", response_model=POResponse)
async def get_po(
    id: str,
    service: PurchasingService = Depends(get_purchasing_service),
    current_user: Employee = Depends(get_current_user)
):
    return service.get_po(id)

@router.post("/{id}/order", response_model=POResponse)
async def mark_ordered(
    id: str,
    service: PurchasingService = Depends(get_purchasing_service),
    current_user: Employee = Depends(RequirePermissions([Permission.MANAGE_PURCHASING]))
):
    return service.mark_ordered(id)

@router.post("/{id}/receive", response_model=POResponse)
async def receive_po(
    id: str,
    data: POReceiveRequest,
    service: PurchasingService = Depends(get_purchasing_service),
    current_user: Employee = Depends(RequirePermissions([Permission.MANAGE_PURCHASING]))
):
    return service.receive_po(id, data)

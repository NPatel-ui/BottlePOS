from fastapi import APIRouter, Depends
from typing import List
from app.schemas.vendors import VendorCreate, VendorUpdate, VendorResponse
from app.services.vendor_service import VendorService
from app.domain.employees import Employee, Permission
from app.api.deps import get_vendor_service, get_current_user, RequirePermissions

router = APIRouter(prefix="/vendors", tags=["vendors"])

@router.post("", response_model=VendorResponse, status_code=201)
async def create_vendor(
    data: VendorCreate,
    service: VendorService = Depends(get_vendor_service),
    current_user: Employee = Depends(RequirePermissions([Permission.MANAGE_PURCHASING]))
):
    return service.create_vendor(current_user.organization_id, data)

@router.get("", response_model=List[VendorResponse])
async def list_vendors(
    service: VendorService = Depends(get_vendor_service),
    current_user: Employee = Depends(get_current_user)
):
    return service.list_vendors(current_user.organization_id)

@router.get("/{id}", response_model=VendorResponse)
async def get_vendor(
    id: str,
    service: VendorService = Depends(get_vendor_service),
    current_user: Employee = Depends(get_current_user)
):
    return service.get_vendor(id)

@router.patch("/{id}", response_model=VendorResponse)
async def update_vendor(
    id: str,
    data: VendorUpdate,
    service: VendorService = Depends(get_vendor_service),
    current_user: Employee = Depends(RequirePermissions([Permission.MANAGE_PURCHASING]))
):
    return service.update_vendor(id, data)

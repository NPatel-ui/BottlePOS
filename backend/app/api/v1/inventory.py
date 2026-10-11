from fastapi import APIRouter, Depends, Query, Path
from typing import List
from app.schemas.inventory import InventoryAdjustmentRequest, CaseBreakRequest, InventoryResponse
from app.services.inventory_service import InventoryService
from app.api.deps import get_inventory_service

router = APIRouter(prefix="/inventory", tags=["inventory"])

@router.get("/{product_id}", response_model=InventoryResponse)
async def get_inventory(
    product_id: str = Path(...),
    organization_id: str = Query(..., description="Organization ID"),
    store_id: str = Query(..., description="Store ID"),
    service: InventoryService = Depends(get_inventory_service)
):
    return service.get_inventory(organization_id, store_id, product_id)

@router.post("/adjustments", response_model=InventoryResponse)
async def adjust_inventory(
    request: InventoryAdjustmentRequest,
    organization_id: str = Query(..., description="Organization ID"),
    store_id: str = Query(..., description="Store ID"),
    service: InventoryService = Depends(get_inventory_service)
):
    return service.adjust_inventory(organization_id, store_id, request)

@router.post("/case-break", response_model=InventoryResponse)
async def break_case(
    request: CaseBreakRequest,
    organization_id: str = Query(..., description="Organization ID"),
    store_id: str = Query(..., description="Store ID"),
    service: InventoryService = Depends(get_inventory_service)
):
    return service.break_case(organization_id, store_id, request)

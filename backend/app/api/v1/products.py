from fastapi import APIRouter, Depends, Query, Path, Body
from typing import List
from app.schemas.products import ProductCreate, ProductUpdate, ProductResponse
from app.services.product_service import ProductService
from app.api.deps import get_product_service

router = APIRouter(prefix="/products", tags=["products"])

@router.post("", response_model=ProductResponse, status_code=201)
async def create_product(
    data: ProductCreate,
    organization_id: str = Query(..., description="Organization ID"),
    store_id: str = Query(..., description="Store ID"),
    service: ProductService = Depends(get_product_service)
):
    return service.create_product(organization_id, store_id, data)

@router.get("", response_model=List[ProductResponse])
async def list_products(
    organization_id: str = Query(..., description="Organization ID"),
    store_id: str = Query(..., description="Store ID"),
    skip: int = 0,
    limit: int = 100,
    service: ProductService = Depends(get_product_service)
):
    return service.list_products(organization_id, store_id, skip, limit)

@router.get("/barcode/{barcode}", response_model=ProductResponse)
async def get_product_by_barcode(
    barcode: str = Path(...),
    service: ProductService = Depends(get_product_service)
):
    return service.get_product_by_barcode(barcode)

@router.get("/{id}", response_model=ProductResponse)
async def get_product(
    id: str = Path(...),
    service: ProductService = Depends(get_product_service)
):
    return service.get_product(id)

@router.put("/{id}", response_model=ProductResponse)
async def update_product(
    id: str = Path(...),
    data: ProductUpdate = Body(...),
    service: ProductService = Depends(get_product_service)
):
    return service.update_product(id, data)

@router.delete("/{id}", status_code=204)
async def delete_product(
    id: str = Path(...),
    service: ProductService = Depends(get_product_service)
):
    service.delete_product(id)

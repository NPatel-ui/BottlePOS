from pydantic import BaseModel, ConfigDict
from decimal import Decimal
from typing import Optional
from datetime import datetime

class ProductBase(BaseModel):
    sku: str
    name: str
    category: str
    bottle_price: Decimal
    cost: Decimal
    barcode: Optional[str] = None
    brand: Optional[str] = None
    subcategory: Optional[str] = None
    description: Optional[str] = None
    size: Optional[str] = None
    unit: Optional[str] = None
    case_price: Optional[Decimal] = None
    pack_price: Optional[Decimal] = None
    tax_category: Optional[str] = None
    alcohol_category: Optional[str] = None
    active_status: bool = True
    age_restricted: bool = False
    reorder_threshold: int = 0
    preferred_vendor_id: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    sku: Optional[str] = None
    name: Optional[str] = None
    category: Optional[str] = None
    bottle_price: Optional[Decimal] = None
    cost: Optional[Decimal] = None
    barcode: Optional[str] = None
    brand: Optional[str] = None
    active_status: Optional[bool] = None
    case_price: Optional[Decimal] = None
    pack_price: Optional[Decimal] = None

class ProductResponse(ProductBase):
    id: str
    organization_id: str
    store_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

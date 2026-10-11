from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal
from typing import Optional
from app.domain.common import utc_now
from app.core.ids import generate_id

@dataclass
class Product:
    organization_id: str
    store_id: str
    sku: str
    name: str
    category: str
    bottle_price: Decimal
    cost: Decimal
    id: str = field(default_factory=generate_id)
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
    created_at: datetime = field(default_factory=utc_now)
    updated_at: datetime = field(default_factory=utc_now)

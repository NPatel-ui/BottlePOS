from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal
from app.domain.common import utc_now

@dataclass
class POSRegister:
    id: str
    organization_id: str
    store_id: str
    name: str
    pin: str = "1234"
    location: str = "Main Counter"
    device_type: str = "Touchscreen Counter Terminal"
    opening_float: Decimal = Decimal("200.00")
    status: str = "active"
    created_at: datetime = field(default_factory=utc_now)
    updated_at: datetime = field(default_factory=utc_now)

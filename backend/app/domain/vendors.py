from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
from app.domain.common import utc_now
from app.core.ids import generate_id

@dataclass
class Vendor:
    organization_id: str
    name: str
    id: str = field(default_factory=generate_id)
    contact_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    active_status: bool = True
    created_at: datetime = field(default_factory=utc_now)
    updated_at: datetime = field(default_factory=utc_now)

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
from app.domain.common import utc_now
from app.core.ids import generate_id

@dataclass
class Customer:
    organization_id: str
    store_id: str
    first_name: str
    last_name: str
    id: str = field(default_factory=generate_id)
    email: Optional[str] = None
    phone: Optional[str] = None
    loyalty_points: int = 0
    notes: Optional[str] = None
    created_at: datetime = field(default_factory=utc_now)
    updated_at: datetime = field(default_factory=utc_now)

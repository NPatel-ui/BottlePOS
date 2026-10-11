from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, Any, Dict
from app.domain.common import utc_now
from app.core.ids import generate_id

@dataclass
class AuditEvent:
    organization_id: str
    store_id: str
    employee_id: str
    event_type: str
    entity_type: str
    entity_id: str
    id: str = field(default_factory=generate_id)
    before_state: Optional[Dict[str, Any]] = None
    after_state: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None
    request_id: Optional[str] = None
    created_at: datetime = field(default_factory=utc_now)

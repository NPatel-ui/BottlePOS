from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class AuditEventResponse(BaseModel):
    id: str
    organization_id: str
    store_id: str
    employee_id: str
    event_type: str
    entity_type: str
    entity_id: str
    before_state: Optional[Dict[str, Any]] = None
    after_state: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None
    request_id: Optional[str] = None
    created_at: datetime

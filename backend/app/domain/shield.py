from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal
from typing import Optional, List, Any, Dict
from enum import Enum
from app.domain.common import utc_now
from app.core.ids import generate_id

class AlertSeverity(str, Enum):
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class AlertStatus(str, Enum):
    OPEN = "OPEN"
    UNDER_REVIEW = "UNDER_REVIEW"
    RESOLVED = "RESOLVED"
    DISMISSED = "DISMISSED"

class InvestigationOutcome(str, Enum):
    LEGITIMATE = "LEGITIMATE"
    OPERATIONAL_ERROR = "OPERATIONAL_ERROR"
    PROCESS_ISSUE = "PROCESS_ISSUE"
    SUPPLIER_ISSUE = "SUPPLIER_ISSUE"
    INTERNAL_LOSS = "INTERNAL_LOSS"
    UNKNOWN = "UNKNOWN"

@dataclass
class ShieldAlert:
    organization_id: str
    store_id: str
    alert_type: str
    title: str
    description: str
    risk_score: int
    severity: AlertSeverity
    id: str = field(default_factory=generate_id)
    employee_id: Optional[str] = None
    reasons: List[str] = field(default_factory=list)
    related_events: List[str] = field(default_factory=list)
    related_transactions: List[str] = field(default_factory=list)
    potential_exposure: Decimal = Decimal("0.00")
    status: AlertStatus = AlertStatus.OPEN
    created_at: datetime = field(default_factory=utc_now)

@dataclass
class InvestigationNote:
    employee_id: str
    note: str
    id: str = field(default_factory=generate_id)
    created_at: datetime = field(default_factory=utc_now)

@dataclass
class ShieldInvestigation:
    alert_id: str
    organization_id: str
    store_id: str
    id: str = field(default_factory=generate_id)
    outcome: Optional[InvestigationOutcome] = None
    notes: List[InvestigationNote] = field(default_factory=list)
    resolved_by_employee_id: Optional[str] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime = field(default_factory=utc_now)

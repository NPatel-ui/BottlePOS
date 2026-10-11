from pydantic import BaseModel
from typing import List, Optional
from decimal import Decimal
from datetime import datetime
from app.domain.shield import AlertStatus, InvestigationOutcome

class ShieldAlertResponse(BaseModel):
    id: str
    organization_id: str
    store_id: str
    alert_type: str
    title: str
    description: str
    risk_score: int
    severity: str
    employee_id: Optional[str]
    status: AlertStatus
    created_at: datetime
    updated_at: datetime
    reasons: List[str]
    related_events: List[str]
    related_transactions: List[str]
    potential_exposure: Decimal

class InvestigationNoteCreate(BaseModel):
    note: str

class InvestigationNoteResponse(BaseModel):
    employee_id: str
    timestamp: datetime
    note: str

class ShieldInvestigationResponse(BaseModel):
    id: str
    alert_id: str
    organization_id: str
    store_id: str
    created_at: datetime
    updated_at: datetime
    notes: List[InvestigationNoteResponse]
    outcome: Optional[InvestigationOutcome]
    resolution_reason: Optional[str]

class AlertResolveRequest(BaseModel):
    outcome: InvestigationOutcome
    reason: str

class AlertDismissRequest(BaseModel):
    reason: str

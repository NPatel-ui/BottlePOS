from fastapi import APIRouter, Depends, Query, HTTPException, status
from typing import List, Optional
from app.schemas.shield import (
    ShieldAlertResponse, 
    ShieldInvestigationResponse, 
    InvestigationNoteCreate, 
    AlertResolveRequest, 
    AlertDismissRequest
)
from app.services.shield_service import ShieldService
from app.domain.employees import Employee, Permission
from app.api.deps import get_current_user, RequirePermissions, shield_service
from app.domain.shield import AlertStatus

router = APIRouter(prefix="/shield", tags=["shield"])

def get_shield_service() -> ShieldService:
    return shield_service

@router.get("/alerts", response_model=List[ShieldAlertResponse])
async def list_alerts(
    status: Optional[AlertStatus] = Query(None),
    service: ShieldService = Depends(get_shield_service),
    current_user: Employee = Depends(RequirePermissions([Permission.VIEW_REPORTS]))
):
    return service.list_alerts(
        organization_id=current_user.organization_id,
        store_id=current_user.store_id,
        status=status
    )

@router.get("/alerts/{alert_id}", response_model=ShieldAlertResponse)
async def get_alert(
    alert_id: str,
    service: ShieldService = Depends(get_shield_service),
    current_user: Employee = Depends(RequirePermissions([Permission.VIEW_REPORTS]))
):
    alert = service.get_alert(alert_id)
    if alert.organization_id != current_user.organization_id or alert.store_id != current_user.store_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this alert")
    return alert

@router.post("/alerts/{alert_id}/investigate", response_model=ShieldInvestigationResponse)
async def create_investigation(
    alert_id: str,
    service: ShieldService = Depends(get_shield_service),
    current_user: Employee = Depends(RequirePermissions([Permission.MANAGE_EMPLOYEES]))
):
    alert = service.get_alert(alert_id)
    if alert.organization_id != current_user.organization_id or alert.store_id != current_user.store_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this alert")
    return service.create_investigation(
        organization_id=current_user.organization_id,
        store_id=current_user.store_id,
        alert_id=alert_id
    )

@router.post("/investigations/{inv_id}/notes", response_model=ShieldInvestigationResponse)
async def add_investigation_note(
    inv_id: str,
    note: InvestigationNoteCreate,
    service: ShieldService = Depends(get_shield_service),
    current_user: Employee = Depends(RequirePermissions([Permission.MANAGE_EMPLOYEES]))
):
    inv = service.inv_repo.get(inv_id)
    if not inv or inv.organization_id != current_user.organization_id or inv.store_id != current_user.store_id:
        raise HTTPException(status_code=404, detail="Investigation not found")
        
    return service.add_investigation_note(inv_id, current_user.id, note.note)

@router.post("/alerts/{alert_id}/resolve", response_model=ShieldAlertResponse)
async def resolve_alert(
    alert_id: str,
    request: AlertResolveRequest,
    service: ShieldService = Depends(get_shield_service),
    current_user: Employee = Depends(RequirePermissions([Permission.MANAGE_EMPLOYEES]))
):
    alert = service.get_alert(alert_id)
    if alert.organization_id != current_user.organization_id or alert.store_id != current_user.store_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this alert")
        
    return service.resolve_alert(alert_id, current_user.id, request.outcome, request.reason)

@router.post("/alerts/{alert_id}/dismiss", response_model=ShieldAlertResponse)
async def dismiss_alert(
    alert_id: str,
    request: AlertDismissRequest,
    service: ShieldService = Depends(get_shield_service),
    current_user: Employee = Depends(RequirePermissions([Permission.MANAGE_EMPLOYEES]))
):
    alert = service.get_alert(alert_id)
    if alert.organization_id != current_user.organization_id or alert.store_id != current_user.store_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this alert")
        
    return service.dismiss_alert(alert_id, current_user.id, request.reason)

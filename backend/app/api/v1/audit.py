from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from app.schemas.audit import AuditEventResponse
from app.services.audit_service import AuditService
from app.domain.employees import Employee, Permission
from app.api.deps import get_audit_service, RequirePermissions

router = APIRouter(prefix="/audit", tags=["audit"])

@router.get("", response_model=List[AuditEventResponse])
async def list_audit_events(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    entity_type: Optional[str] = Query(None),
    entity_id: Optional[str] = Query(None),
    service: AuditService = Depends(get_audit_service),
    current_user: Employee = Depends(RequirePermissions([Permission.VIEW_REPORTS]))
):
    return service.list_events(
        org_id=current_user.organization_id,
        store_id=current_user.store_id,
        skip=skip,
        limit=limit,
        entity_type=entity_type,
        entity_id=entity_id
    )

from fastapi import APIRouter, Depends, Query
from datetime import datetime, timedelta
from app.schemas.reports import SalesReportResponse, InventoryReportResponse, ShieldReportResponse
from app.services.report_service import ReportService
from app.domain.employees import Employee, Permission
from app.api.deps import get_current_user, RequirePermissions, transaction_repository, inventory_repository, product_repository, shield_alert_repository
from app.domain.common import utc_now

router = APIRouter(prefix="/reports", tags=["reports"])

def get_report_service() -> ReportService:
    return ReportService(
        tx_repo=transaction_repository,
        inv_repo=inventory_repository,
        prod_repo=product_repository,
        shield_repo=shield_alert_repository
    )

@router.get("/sales", response_model=SalesReportResponse)
async def get_sales_report(
    start_date: datetime = Query(default_factory=lambda: utc_now() - timedelta(days=30)),
    end_date: datetime = Query(default_factory=utc_now),
    service: ReportService = Depends(get_report_service),
    current_user: Employee = Depends(RequirePermissions([Permission.VIEW_REPORTS]))
):
    return service.generate_sales_report(
        org_id=current_user.organization_id,
        store_id=current_user.store_id,
        start_date=start_date,
        end_date=end_date
    )

@router.get("/inventory", response_model=InventoryReportResponse)
async def get_inventory_report(
    service: ReportService = Depends(get_report_service),
    current_user: Employee = Depends(RequirePermissions([Permission.VIEW_REPORTS]))
):
    return service.generate_inventory_report(
        org_id=current_user.organization_id,
        store_id=current_user.store_id
    )

@router.get("/shield", response_model=ShieldReportResponse)
async def get_shield_report(
    start_date: datetime = Query(default_factory=lambda: utc_now() - timedelta(days=30)),
    end_date: datetime = Query(default_factory=utc_now),
    service: ReportService = Depends(get_report_service),
    current_user: Employee = Depends(RequirePermissions([Permission.VIEW_REPORTS]))
):
    return service.generate_shield_report(
        org_id=current_user.organization_id,
        store_id=current_user.store_id,
        start_date=start_date,
        end_date=end_date
    )

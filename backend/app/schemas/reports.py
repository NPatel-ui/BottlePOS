from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from decimal import Decimal
from datetime import datetime

class SalesSummary(BaseModel):
    total_sales: Decimal
    total_discounts: Decimal
    total_refunds: Decimal
    transaction_count: int
    net_sales: Decimal

class TopProduct(BaseModel):
    product_id: str
    product_name: str
    quantity_sold: int
    revenue: Decimal

class SalesReportResponse(BaseModel):
    organization_id: str
    store_id: str
    start_date: datetime
    end_date: datetime
    summary: SalesSummary
    top_products: List[TopProduct]

class InventoryAnomaly(BaseModel):
    product_id: str
    product_name: str
    expected_qty: int
    actual_qty: int
    variance: int
    variance_reason: Optional[str]

class InventoryReportResponse(BaseModel):
    organization_id: str
    store_id: str
    generated_at: datetime
    total_products: int
    total_value: Decimal
    anomalies: List[InventoryAnomaly]

class ShieldSummary(BaseModel):
    total_alerts: int
    critical_alerts: int
    high_alerts: int
    moderate_alerts: int
    resolved_investigations: int

class ShieldReportResponse(BaseModel):
    organization_id: str
    store_id: str
    start_date: datetime
    end_date: datetime
    summary: ShieldSummary

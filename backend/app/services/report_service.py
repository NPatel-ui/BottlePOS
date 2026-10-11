from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from decimal import Decimal
from collections import defaultdict

from app.schemas.reports import (
    SalesReportResponse, SalesSummary, TopProduct,
    InventoryReportResponse, InventoryAnomaly,
    ShieldReportResponse, ShieldSummary
)
from app.repositories.memory.transactions import TransactionRepository
from app.repositories.memory.inventory import InventoryRepository
from app.repositories.memory.products import ProductRepository
from app.repositories.memory.shield import ShieldAlertRepository
from app.domain.transactions import TransactionStatus
from app.domain.shield import AlertStatus
from app.domain.common import utc_now

class ReportService:
    def __init__(
        self,
        tx_repo: TransactionRepository,
        inv_repo: InventoryRepository,
        prod_repo: ProductRepository,
        shield_repo: ShieldAlertRepository
    ):
        self.tx_repo = tx_repo
        self.inv_repo = inv_repo
        self.prod_repo = prod_repo
        self.shield_repo = shield_repo

    def generate_sales_report(self, org_id: str, store_id: str, start_date: datetime, end_date: datetime) -> SalesReportResponse:
        transactions = self.tx_repo.list(organization_id=org_id, store_id=store_id)
        # Filter by date range
        transactions = [tx for tx in transactions if start_date <= tx.created_at <= end_date and tx.status == TransactionStatus.COMPLETED]
        
        total_sales = Decimal("0.0")
        total_discounts = Decimal("0.0")
        total_refunds = Decimal("0.0")  # Assuming refunds have a different status or we check refunds separately. Let's just calculate from completed txns.
        
        product_sales: Dict[str, dict] = defaultdict(lambda: {"qty": 0, "rev": Decimal("0.0")})
        
        for tx in transactions:
            total_sales += tx.grand_total
            total_discounts += tx.discount_total
            for item in tx.items:
                product_sales[item.product_id]["qty"] += item.quantity
                product_sales[item.product_id]["rev"] += item.total_price

        top_products = []
        for pid, data in sorted(product_sales.items(), key=lambda x: x[1]["rev"], reverse=True)[:10]:
            prod = self.prod_repo.get(pid)
            if prod:
                top_products.append(TopProduct(
                    product_id=pid,
                    product_name=prod.name,
                    quantity_sold=data["qty"],
                    revenue=data["rev"]
                ))

        summary = SalesSummary(
            total_sales=total_sales,
            total_discounts=total_discounts,
            total_refunds=total_refunds,
            transaction_count=len(transactions),
            net_sales=total_sales - total_discounts - total_refunds
        )

        return SalesReportResponse(
            organization_id=org_id,
            store_id=store_id,
            start_date=start_date,
            end_date=end_date,
            summary=summary,
            top_products=top_products
        )

    def generate_inventory_report(self, org_id: str, store_id: str) -> InventoryReportResponse:
        inventories = self.inv_repo.list(organization_id=org_id, store_id=store_id)
        total_products = len(inventories)
        total_value = Decimal("0.0")
        anomalies = []

        for inv in inventories:
            prod = self.prod_repo.get(inv.product_id)
            if prod:
                total_value += Decimal(str(inv.quantity_bottles)) * prod.cost
                
                # Check for anomalies, like negative inventory
                if inv.quantity_bottles < 0:
                    anomalies.append(InventoryAnomaly(
                        product_id=prod.id,
                        product_name=prod.name,
                        expected_qty=0,
                        actual_qty=inv.quantity_bottles,
                        variance=inv.quantity_bottles,
                        variance_reason="Negative stock"
                    ))

        return InventoryReportResponse(
            organization_id=org_id,
            store_id=store_id,
            generated_at=utc_now(),
            total_products=total_products,
            total_value=total_value,
            anomalies=anomalies
        )

    def generate_shield_report(self, org_id: str, store_id: str, start_date: datetime, end_date: datetime) -> ShieldReportResponse:
        alerts = self.shield_repo.list(organization_id=org_id, store_id=store_id)
        alerts = [a for a in alerts if start_date <= a.created_at <= end_date]
        
        summary = ShieldSummary(
            total_alerts=len(alerts),
            critical_alerts=sum(1 for a in alerts if a.severity == "CRITICAL"),
            high_alerts=sum(1 for a in alerts if a.severity == "HIGH"),
            moderate_alerts=sum(1 for a in alerts if a.severity == "MODERATE"),
            resolved_investigations=sum(1 for a in alerts if a.status == AlertStatus.RESOLVED)
        )

        return ShieldReportResponse(
            organization_id=org_id,
            store_id=store_id,
            start_date=start_date,
            end_date=end_date,
            summary=summary
        )

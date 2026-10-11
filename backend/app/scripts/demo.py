import os
import sys
import logging
import asyncio
from decimal import Decimal
from datetime import datetime

# Add the root directory to sys.path to allow imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.events.bus import event_bus
from app.events.events import TransactionCompletedEvent, RefundCreatedEvent, TransactionVoidedEvent, InventoryAdjustedEvent
from app.domain.employees import EmployeeRole
from app.domain.products import Product
from app.domain.inventory import InventoryAdjustmentReason
from app.schemas.products import ProductCreate
from app.api.deps import product_service, inventory_service, transaction_service, shield_service
from app.core.ids import generate_id
from app.domain.common import utc_now
from app.schemas.transactions import TransactionCreate, TransactionItemCreate, PaymentRequest
from app.domain.payments import PaymentMethod

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("BottlePOS-Demo")

async def run_demo():
    logger.info("Initializing BottlePOS Demo...")
    
    org_id = "demo_org"
    store_id = "demo_store"
    
    logger.info("Setting up Products...")
    prod1 = product_service.create_product(org_id, store_id, ProductCreate(
        sku="SKU-JD-01", name="Jack Daniels 750ml", category="Spirits", bottle_price=Decimal("45.00"), cost=Decimal("25.00")
    ))
    
    # Initialize inventory
    from app.schemas.inventory import InventoryAdjustmentRequest
    from app.domain.inventory import InventoryAdjustmentReason
    inventory_service.adjust_inventory(org_id, store_id, InventoryAdjustmentRequest(
        product_id=prod1.id,
        reason=InventoryAdjustmentReason.MANUAL,
        quantity_bottles_change=100,
        quantity_packs_change=0,
        quantity_cases_change=0,
        employee_id="system"
    ))
    
    logger.info("Running Scenario 1: Isolated Refund Abuse (Rule Detector)")
    refund_event = RefundCreatedEvent(
        event_id=generate_id(),
        timestamp=utc_now(),
        organization_id=org_id,
        store_id=store_id,
        employee_id="emp_001",
        transaction_id="tx_fake_01",
        refund_amount=Decimal("5500.00"), 
        items_refunded=["item_1"]
    )
    event_bus.publish(refund_event)
    
    logger.info("Running Scenario 2: Correlated Suspicious Activity (Correlation Engine)")
    e_id = "emp_002"
    e1 = TransactionVoidedEvent(
        event_id=generate_id(), timestamp=utc_now(), organization_id=org_id, store_id=store_id, 
        employee_id=e_id, transaction_id="tx_corr_1", void_reason="Customer changed mind"
    )
    e2 = RefundCreatedEvent(
        event_id=generate_id(), timestamp=utc_now(), organization_id=org_id, store_id=store_id, 
        employee_id=e_id, transaction_id="tx_corr_2", refund_amount=Decimal("150.00"), items_refunded=[]
    )
    e3 = InventoryAdjustedEvent(
        event_id=generate_id(), timestamp=utc_now(), organization_id=org_id, store_id=store_id, 
        employee_id=e_id, product_id=prod1.id, reason=InventoryAdjustmentReason.MISSING, quantity_bottles_change=-2,
        quantity_packs_change=0, quantity_cases_change=0
    )

    
    event_bus.publish(e1)
    event_bus.publish(e2)
    event_bus.publish(e3)

    logger.info("Generating transactions for Reports...")
    tx_req = TransactionCreate(
        employee_id="emp_003",
        shift_id="shift_001"
    )
    tx = transaction_service.create_transaction(org_id, store_id, tx_req)
    
    transaction_service.add_item(tx.id, TransactionItemCreate(product_id=prod1.id, quantity=2))
    
    # After adding items, grand_total is calculated. Let's get it to pay exactly.
    tx = transaction_service.get_transaction(tx.id)
    transaction_service.add_payment(tx.id, PaymentRequest(amount=tx.grand_total, method=PaymentMethod.CASH.value))
    
    transaction_service.complete_transaction(tx.id)

    
    await asyncio.sleep(0.5) # Wait for async event handlers
    
    logger.info("--- SHIELD ALERTS GENERATED ---")
    alerts = shield_service.list_alerts(org_id, store_id)
    for idx, alert in enumerate(alerts):
        logger.info(f"Alert #{idx+1}: {alert.severity} - {alert.title}")
        logger.info(f"  Detector: {alert.alert_type}")
        logger.info(f"  Employee: {alert.employee_id}")
        logger.info(f"  Reasons: {alert.reasons}")
        logger.info("")

if __name__ == "__main__":
    asyncio.run(run_demo())


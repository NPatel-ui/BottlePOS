import pytest
from datetime import datetime
from decimal import Decimal
from app.events.events import TransactionCompletedEvent, RefundCreatedEvent, TransactionVoidedEvent
from app.services.shield.risk_engine import RiskEngine

@pytest.fixture
def risk_engine():
    return RiskEngine()

def test_rule_based_detector_high_refund(risk_engine):
    event = RefundCreatedEvent(
        event_id="e1",
        timestamp=datetime.now(),
        organization_id="org1",
        store_id="store1",
        employee_id="emp1",
        transaction_id="tx1",
        refund_amount=Decimal("6000.00"),
        items_refunded=[]
    )
    
    anomalies = risk_engine.analyze_event(event, {})
    assert len(anomalies) == 1
    assert anomalies[0].detector_name == "RuleBasedDetector"
    assert anomalies[0].severity == "HIGH"
    assert anomalies[0].risk_score == 75

def test_statistical_detector_anomaly(risk_engine):
    context = {
        "employee_recent_discounts": [Decimal("5.0"), Decimal("6.0"), Decimal("4.0"), Decimal("5.5"), Decimal("5.0"), Decimal("4.5"), Decimal("5.0"), Decimal("5.5"), Decimal("4.0"), Decimal("5.0"), Decimal("5.0")]
    }
    
    event = TransactionCompletedEvent(
        event_id="e2",
        timestamp=datetime.now(),
        organization_id="org1",
        store_id="store1",
        employee_id="emp1",
        transaction_id="tx2",
        grand_total=Decimal("150.0"),
        items=[],
        discount_total=Decimal("50.0") # Much higher than average of ~5
    )
    
    anomalies = risk_engine.analyze_event(event, context)
    # Check if StatisticalDetector triggered
    stat_anomaly = next((a for a in anomalies if a.detector_name == "StatisticalDetector"), None)
    assert stat_anomaly is not None
    assert stat_anomaly.severity == "HIGH"
    assert stat_anomaly.risk_score > 60

def test_correlation_engine_cluster(risk_engine):
    e1 = TransactionVoidedEvent(
        event_id="c1", timestamp=datetime.now(), organization_id="o1", store_id="s1", 
        employee_id="emp1", transaction_id="t1", void_reason="test"
    )
    e2 = RefundCreatedEvent(
        event_id="c2", timestamp=datetime.now(), organization_id="o1", store_id="s1", 
        employee_id="emp1", transaction_id="t2", refund_amount=Decimal("10"), items_refunded=[]
    )
    e3 = TransactionVoidedEvent(
        event_id="c3", timestamp=datetime.now(), organization_id="o1", store_id="s1", 
        employee_id="emp1", transaction_id="t3", void_reason="test2"
    )
    
    a1 = risk_engine.analyze_event(e1, {})
    a2 = risk_engine.analyze_event(e2, {})
    
    # The third event should trigger the correlation engine
    a3 = risk_engine.analyze_event(e3, {})
    corr_anomaly = next((a for a in a3 if a.detector_name == "CorrelationEngine"), None)
    assert corr_anomaly is not None
    assert corr_anomaly.severity == "CRITICAL"

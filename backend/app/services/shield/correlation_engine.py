from typing import List
from datetime import timedelta
from app.events.events import Event, TransactionVoidedEvent, RefundCreatedEvent, InventoryAdjustedEvent
from app.services.shield.core import AnomalyDetection
from decimal import Decimal

class CorrelationEngine:
    def __init__(self, time_window_minutes: int = 15):
        self.time_window = timedelta(minutes=time_window_minutes)
        self.recent_events: List[Event] = []
        # Define events that are interesting for correlation
        self.monitored_types = (TransactionVoidedEvent, RefundCreatedEvent, InventoryAdjustedEvent)

    def analyze_cluster(self, new_event: Event) -> AnomalyDetection | None:
        if not isinstance(new_event, self.monitored_types):
            return None
            
        now = new_event.timestamp
        self.recent_events = [e for e in self.recent_events if now - e.timestamp <= self.time_window]
        self.recent_events.append(new_event)
        
        if not new_event.employee_id:
            return None
            
        employee_events = [e for e in self.recent_events if e.employee_id == new_event.employee_id]
        if len(employee_events) >= 3:
            return AnomalyDetection(
                detector_name="CorrelationEngine",
                risk_score=85,
                severity="CRITICAL",
                reasons=[f"{len(employee_events)} monitored high-risk events clustered within a {self.time_window.seconds // 60}-minute window."],
                potential_exposure=Decimal("0.00"), 
                related_events=[e.event_id for e in employee_events],
                related_transactions=[getattr(e, "transaction_id", "") for e in employee_events if hasattr(e, "transaction_id")]
            )
            
        return None

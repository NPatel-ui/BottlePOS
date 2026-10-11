from typing import List, Optional
from app.events.bus import EventBus
from app.events.events import Event, TransactionCompletedEvent, RefundCreatedEvent, TransactionVoidedEvent, InventoryAdjustedEvent, CashVarianceDetectedEvent
from app.domain.shield import ShieldAlert, AlertStatus, ShieldInvestigation, InvestigationOutcome, InvestigationNote
from app.repositories.memory.shield import ShieldAlertRepository, ShieldInvestigationRepository
from app.services.shield.risk_engine import RiskEngine
from app.core.exceptions import NotFoundException

class ShieldService:
    def __init__(self, alert_repo: ShieldAlertRepository, inv_repo: ShieldInvestigationRepository, event_bus: EventBus):
        self.alert_repo = alert_repo
        self.inv_repo = inv_repo
        self.risk_engine = RiskEngine()
        self.event_bus = event_bus
        self._subscribe_to_events()
        
        self.employee_context = {}

    def _subscribe_to_events(self):
        events_to_monitor = [
            TransactionCompletedEvent,
            RefundCreatedEvent,
            TransactionVoidedEvent,
            InventoryAdjustedEvent,
            CashVarianceDetectedEvent
        ]
        for e_type in events_to_monitor:
            self.event_bus.subscribe(e_type, self.handle_event)

    def _update_context(self, event: Event):
        if not event.employee_id:
            return
            
        if event.employee_id not in self.employee_context:
            self.employee_context[event.employee_id] = {"recent_discounts": []}
            
        if isinstance(event, TransactionCompletedEvent) and event.discount_total > 0:
            history = self.employee_context[event.employee_id]["recent_discounts"]
            history.append(float(event.discount_total))
            if len(history) > 50:
                history.pop(0)

    def handle_event(self, event: Event):
        self._update_context(event)
        
        context = {
            "employee_recent_discounts": self.employee_context.get(event.employee_id, {}).get("recent_discounts", []) if event.employee_id else []
        }
        
        anomalies = self.risk_engine.analyze_event(event, context)
        
        for anomaly in anomalies:
            alert = ShieldAlert(
                organization_id=event.organization_id,
                store_id=event.store_id,
                alert_type=anomaly.detector_name,
                title=f"Suspicious Activity Detected: {anomaly.severity}",
                description=" | ".join(anomaly.reasons),
                risk_score=anomaly.risk_score,
                severity=anomaly.severity,
                employee_id=event.employee_id,
                reasons=anomaly.reasons,
                related_events=anomaly.related_events,
                related_transactions=anomaly.related_transactions,
                potential_exposure=anomaly.potential_exposure
            )
            self.alert_repo.create(alert)

    def get_alert(self, alert_id: str) -> ShieldAlert:
        alert = self.alert_repo.get(alert_id)
        if not alert:
            raise NotFoundException("ShieldAlert", alert_id)
        return alert

    def list_alerts(self, organization_id: str, store_id: str, status: Optional[AlertStatus] = None) -> List[ShieldAlert]:
        filters = {"organization_id": organization_id, "store_id": store_id}
        if status:
            filters["status"] = status
        return self.alert_repo.list(**filters)

    def create_investigation(self, organization_id: str, store_id: str, alert_id: str) -> ShieldInvestigation:
        alert = self.get_alert(alert_id)
        alert.status = AlertStatus.UNDER_REVIEW
        self.alert_repo.update(alert)
        
        investigation = ShieldInvestigation(
            alert_id=alert_id,
            organization_id=organization_id,
            store_id=store_id
        )
        return self.inv_repo.create(investigation)
        
    def add_investigation_note(self, inv_id: str, employee_id: str, note: str) -> ShieldInvestigation:
        inv = self.inv_repo.get(inv_id)
        if not inv:
            raise NotFoundException("ShieldInvestigation", inv_id)
            
        inv_note = InvestigationNote(employee_id=employee_id, note=note)
        inv.notes.append(inv_note)
        return self.inv_repo.update(inv)

    def resolve_alert(self, alert_id: str, employee_id: str, outcome: InvestigationOutcome, reason: str) -> ShieldAlert:
        alert = self.get_alert(alert_id)
        alert.status = AlertStatus.RESOLVED
        self.alert_repo.update(alert)
        return alert
        
    def dismiss_alert(self, alert_id: str, employee_id: str, reason: str) -> ShieldAlert:
        alert = self.get_alert(alert_id)
        alert.status = AlertStatus.DISMISSED
        self.alert_repo.update(alert)
        return alert

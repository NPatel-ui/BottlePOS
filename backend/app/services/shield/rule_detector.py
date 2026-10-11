from app.services.shield.core import RiskDetector, AnomalyDetection
from app.events.events import Event, RefundCreatedEvent, TransactionCompletedEvent, TransactionVoidedEvent
from decimal import Decimal

class RuleBasedDetector(RiskDetector):
    def analyze(self, event: Event, context: dict) -> AnomalyDetection | None:
        if isinstance(event, RefundCreatedEvent):
            if event.refund_amount > Decimal("5000"):
                return AnomalyDetection(
                    detector_name="RuleBasedDetector",
                    risk_score=75,
                    severity="HIGH",
                    reasons=[f"Refund amount ({event.refund_amount}) exceeds critical threshold of 5000."],
                    potential_exposure=event.refund_amount,
                    related_events=[event.event_id],
                    related_transactions=[event.transaction_id]
                )
                
        if isinstance(event, TransactionCompletedEvent):
            if event.discount_total > Decimal("1000"):
                return AnomalyDetection(
                    detector_name="RuleBasedDetector",
                    risk_score=65,
                    severity="HIGH",
                    reasons=[f"Discount total ({event.discount_total}) exceeds hard rule threshold of 1000."],
                    potential_exposure=event.discount_total,
                    related_events=[event.event_id],
                    related_transactions=[event.transaction_id]
                )

        if isinstance(event, TransactionVoidedEvent):
            # Example hard rule: Voiding transaction triggers an anomaly if no specific context validates it
            # This is a bit too sensitive for a real app without filters, but good for demo
            return AnomalyDetection(
                detector_name="RuleBasedDetector",
                risk_score=50,
                severity="MODERATE",
                reasons=[f"Transaction was voided by employee. Reason: {event.void_reason}"],
                potential_exposure=Decimal("0.00"),  # We might not have access to the full tx amount here easily, so 0 for now
                related_events=[event.event_id],
                related_transactions=[event.transaction_id]
            )

        return None

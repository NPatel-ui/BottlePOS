from app.services.shield.core import RiskDetector, AnomalyDetection
from app.events.events import Event, TransactionCompletedEvent
from decimal import Decimal
import statistics

class StatisticalDetector(RiskDetector):
    def analyze(self, event: Event, context: dict) -> AnomalyDetection | None:
        if isinstance(event, TransactionCompletedEvent) and event.discount_total > 0:
            history = context.get("employee_recent_discounts", [])
            if len(history) > 10:
                mean = statistics.mean(history)
                stdev = statistics.stdev(history) or 1
                
                z_score = float(event.discount_total - Decimal(str(mean))) / float(stdev)
                
                if z_score > 3.0:
                    return AnomalyDetection(
                        detector_name="StatisticalDetector",
                        risk_score=min(100, int(60 + (z_score * 5))),
                        severity="HIGH" if z_score > 4.0 else "MODERATE",
                        reasons=[f"Discount amount deviates significantly from employee norm (z-score: {z_score:.2f})"],
                        potential_exposure=event.discount_total,
                        related_events=[event.event_id],
                        related_transactions=[event.transaction_id]
                    )
        return None

from typing import List
from app.events.events import Event
from app.services.shield.core import RiskDetector, AnomalyDetection
from app.services.shield.rule_detector import RuleBasedDetector
from app.services.shield.statistical_detector import StatisticalDetector
from app.services.shield.correlation_engine import CorrelationEngine

class RiskEngine:
    def __init__(self):
        self.detectors: List[RiskDetector] = [
            RuleBasedDetector(),
            StatisticalDetector()
        ]
        self.correlation_engine = CorrelationEngine()

    def analyze_event(self, event: Event, context: dict) -> List[AnomalyDetection]:
        anomalies = []
        
        for detector in self.detectors:
            try:
                anomaly = detector.analyze(event, context)
                if anomaly:
                    anomalies.append(anomaly)
            except Exception as e:
                print(f"Error in {detector.__class__.__name__}: {e}")
                
        try:
            cluster_anomaly = self.correlation_engine.analyze_cluster(event)
            if cluster_anomaly:
                anomalies.append(cluster_anomaly)
        except Exception as e:
            print(f"Error in CorrelationEngine: {e}")
            
        return anomalies

from abc import ABC, abstractmethod
from typing import List, Optional
from dataclasses import dataclass
from decimal import Decimal
from app.events.events import Event

@dataclass
class AnomalyDetection:
    detector_name: str
    risk_score: int 
    severity: str
    reasons: List[str]
    potential_exposure: Decimal
    related_events: List[str]
    related_transactions: List[str]

class RiskDetector(ABC):
    @abstractmethod
    def analyze(self, event: Event, context: dict) -> Optional[AnomalyDetection]:
        """Analyze an event and return an AnomalyDetection if suspicious."""
        pass

import time
from typing import Any, Dict, Optional
from threading import Lock
from dataclasses import dataclass, field
from app.domain.common import utc_now
from datetime import datetime

@dataclass
class IdempotencyRecord:
    key: str
    response: Any = None
    status_code: int = 200
    created_at: datetime = field(default_factory=utc_now)
    locked: bool = True

class MemoryIdempotencyStore:
    def __init__(self):
        self._store: Dict[str, IdempotencyRecord] = {}
        self._lock = Lock()
        # In a real system, we'd have a TTL sweep for this.

    def acquire(self, key: str) -> bool:
        """Returns True if lock acquired, False if key already exists."""
        with self._lock:
            if key in self._store:
                return False
            self._store[key] = IdempotencyRecord(key=key, locked=True)
            return True

    def get(self, key: str) -> Optional[IdempotencyRecord]:
        with self._lock:
            return self._store.get(key)

    def save_response(self, key: str, response: Any, status_code: int = 200):
        with self._lock:
            if key in self._store:
                self._store[key].response = response
                self._store[key].status_code = status_code
                self._store[key].locked = False

    def release(self, key: str):
        """Release the lock if an error occurred before completion."""
        with self._lock:
            if key in self._store and self._store[key].locked:
                del self._store[key]

idempotency_store = MemoryIdempotencyStore()

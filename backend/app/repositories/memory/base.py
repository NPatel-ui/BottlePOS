import threading
from typing import TypeVar, Generic, List, Optional, Any, Dict

T = TypeVar("T")

class MemoryBaseRepository(Generic[T]):
    def __init__(self):
        self._data: Dict[str, T] = {}
        self._lock = threading.RLock()

    def get(self, id: str) -> Optional[T]:
        with self._lock:
            return self._data.get(id)

    def list(self, skip: int = 0, limit: int = 100, **filters: Any) -> List[T]:
        with self._lock:
            results = list(self._data.values())
            
            # Simple attribute filtering
            for key, value in filters.items():
                if value is not None:
                    results = [r for r in results if getattr(r, key, None) == value]
            
            return results[skip : skip + limit]

    def create(self, entity: T) -> T:
        with self._lock:
            entity_id = getattr(entity, "id", None)
            if not entity_id:
                raise ValueError("Entity must have an id field")
            
            if entity_id in self._data:
                raise ValueError(f"Entity with id {entity_id} already exists")
                
            self._data[entity_id] = entity
            return entity

    def update(self, entity: T) -> T:
        with self._lock:
            entity_id = getattr(entity, "id", None)
            if not entity_id or entity_id not in self._data:
                raise ValueError(f"Entity with id {entity_id} does not exist")
                
            self._data[entity_id] = entity
            return entity

    def delete(self, id: str) -> bool:
        with self._lock:
            if id in self._data:
                del self._data[id]
                return True
            return False

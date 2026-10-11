from typing import Protocol, TypeVar, Generic, List, Optional, Any

T = TypeVar("T")

class BaseRepository(Protocol, Generic[T]):
    def get(self, id: str) -> Optional[T]:
        ...

    def list(self, skip: int = 0, limit: int = 100, **filters: Any) -> List[T]:
        ...

    def create(self, entity: T) -> T:
        ...

    def update(self, entity: T) -> T:
        ...

    def delete(self, id: str) -> bool:
        ...

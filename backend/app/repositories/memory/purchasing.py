from app.repositories.memory.base import MemoryBaseRepository
from app.domain.purchasing import PurchaseOrder

class PORepository(MemoryBaseRepository[PurchaseOrder]):
    pass

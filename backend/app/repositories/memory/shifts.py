from app.repositories.memory.base import MemoryBaseRepository
from app.domain.shifts import Shift, CashDrawerEvent

class ShiftRepository(MemoryBaseRepository[Shift]):
    pass

class CashDrawerEventRepository(MemoryBaseRepository[CashDrawerEvent]):
    pass

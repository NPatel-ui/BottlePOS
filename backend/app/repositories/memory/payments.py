from app.repositories.memory.base import MemoryBaseRepository
from app.domain.payments import Payment

class PaymentRepository(MemoryBaseRepository[Payment]):
    pass

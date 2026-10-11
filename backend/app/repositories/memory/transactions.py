from app.repositories.memory.base import MemoryBaseRepository
from app.domain.transactions import Transaction

class TransactionRepository(MemoryBaseRepository[Transaction]):
    pass

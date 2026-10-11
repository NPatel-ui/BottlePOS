from app.repositories.memory.base import MemoryBaseRepository
from app.domain.customers import Customer

class CustomerRepository(MemoryBaseRepository[Customer]):
    pass

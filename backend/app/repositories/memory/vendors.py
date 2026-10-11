from app.repositories.memory.base import MemoryBaseRepository
from app.domain.vendors import Vendor

class VendorRepository(MemoryBaseRepository[Vendor]):
    pass

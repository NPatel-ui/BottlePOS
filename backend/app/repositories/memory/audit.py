from app.repositories.memory.base import MemoryBaseRepository
from app.domain.audit import AuditEvent

class AuditRepository(MemoryBaseRepository[AuditEvent]):
    pass

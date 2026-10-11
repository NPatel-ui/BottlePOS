from app.repositories.memory.base import MemoryBaseRepository
from app.domain.shield import ShieldAlert, ShieldInvestigation

class ShieldAlertRepository(MemoryBaseRepository[ShieldAlert]):
    pass

class ShieldInvestigationRepository(MemoryBaseRepository[ShieldInvestigation]):
    pass

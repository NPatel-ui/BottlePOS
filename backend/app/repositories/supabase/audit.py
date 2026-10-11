from app.repositories.supabase.base import SupabaseBaseRepository
from app.domain.audit import AuditEvent

class SupabaseAuditRepository(SupabaseBaseRepository[AuditEvent]):
    def __init__(self):
        super().__init__("audit_logs", AuditEvent)

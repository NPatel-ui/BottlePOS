from app.repositories.supabase.base import SupabaseBaseRepository
from app.domain.shield import ShieldAlert, ShieldInvestigation

class SupabaseShieldAlertRepository(SupabaseBaseRepository[ShieldAlert]):
    def __init__(self):
        super().__init__("shield_alerts", ShieldAlert)

class SupabaseShieldInvestigationRepository(SupabaseBaseRepository[ShieldInvestigation]):
    def __init__(self):
        super().__init__("shield_investigations", ShieldInvestigation)

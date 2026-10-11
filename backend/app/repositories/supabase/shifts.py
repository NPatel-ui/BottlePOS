from app.repositories.supabase.base import SupabaseBaseRepository
from app.domain.shifts import Shift, CashDrawerEvent

class SupabaseShiftRepository(SupabaseBaseRepository[Shift]):
    def __init__(self):
        super().__init__("shifts", Shift)

class SupabaseCashDrawerEventRepository(SupabaseBaseRepository[CashDrawerEvent]):
    def __init__(self):
        super().__init__("cash_drawer_events", CashDrawerEvent)

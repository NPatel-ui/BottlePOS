from app.repositories.supabase.base import SupabaseBaseRepository
from app.domain.payments import Payment

class SupabasePaymentRepository(SupabaseBaseRepository[Payment]):
    def __init__(self):
        super().__init__("payments", Payment)

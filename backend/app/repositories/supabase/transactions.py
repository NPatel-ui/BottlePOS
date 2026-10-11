from app.repositories.supabase.base import SupabaseBaseRepository
from app.domain.transactions import Transaction

class SupabaseTransactionRepository(SupabaseBaseRepository[Transaction]):
    def __init__(self):
        super().__init__("transactions", Transaction)

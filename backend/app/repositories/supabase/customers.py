from app.repositories.supabase.base import SupabaseBaseRepository
from app.domain.customers import Customer

class SupabaseCustomerRepository(SupabaseBaseRepository[Customer]):
    def __init__(self):
        super().__init__("customers", Customer)

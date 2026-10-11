from app.repositories.supabase.base import SupabaseBaseRepository
from app.domain.vendors import Vendor

class SupabaseVendorRepository(SupabaseBaseRepository[Vendor]):
    def __init__(self):
        super().__init__("vendors", Vendor)

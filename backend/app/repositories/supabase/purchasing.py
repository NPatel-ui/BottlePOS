from app.repositories.supabase.base import SupabaseBaseRepository
from app.domain.purchasing import PurchaseOrder

class SupabasePORepository(SupabaseBaseRepository[PurchaseOrder]):
    def __init__(self):
        super().__init__("purchase_orders", PurchaseOrder)

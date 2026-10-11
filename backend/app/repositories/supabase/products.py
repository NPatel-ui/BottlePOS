from typing import Optional
from app.repositories.supabase.base import SupabaseBaseRepository
from app.domain.products import Product

class SupabaseProductRepository(SupabaseBaseRepository[Product]):
    def __init__(self):
        super().__init__("products", Product)

    def get_by_barcode(self, barcode: str) -> Optional[Product]:
        client = self.client
        if not client:
            return None
        res = client.table(self.table_name).select("*").eq("barcode", barcode).eq("active_status", True).execute()
        if res.data and len(res.data) > 0:
            return self._from_record(res.data[0])
        return None

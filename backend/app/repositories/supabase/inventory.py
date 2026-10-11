from typing import Optional
from app.repositories.supabase.base import SupabaseBaseRepository
from app.domain.inventory import Inventory, InventoryTransaction

class SupabaseInventoryRepository(SupabaseBaseRepository[Inventory]):
    def __init__(self):
        super().__init__("inventory", Inventory)

    def get_by_product(self, organization_id: str, store_id: str, product_id: str) -> Optional[Inventory]:
        client = self.client
        if not client:
            return None
        res = (
            client.table(self.table_name)
            .select("*")
            .eq("organization_id", organization_id)
            .eq("store_id", store_id)
            .eq("product_id", product_id)
            .execute()
        )
        if res.data and len(res.data) > 0:
            return self._from_record(res.data[0])
        return None

    def adjust_quantities(
        self, organization_id: str, store_id: str, product_id: str, 
        d_bottles: int, d_packs: int, d_cases: int
    ) -> Inventory:
        inv = self.get_by_product(organization_id, store_id, product_id)
        if not inv:
            inv = Inventory(
                organization_id=organization_id,
                store_id=store_id,
                product_id=product_id
            )
            inv = self.create(inv)

        new_bottles = inv.quantity_bottles + d_bottles
        new_packs = inv.quantity_packs + d_packs
        new_cases = inv.quantity_cases + d_cases

        if new_bottles < 0 or new_packs < 0 or new_cases < 0:
            raise ValueError("Inventory quantities cannot be negative")

        inv.quantity_bottles = new_bottles
        inv.quantity_packs = new_packs
        inv.quantity_cases = new_cases

        return self.update(inv)

class SupabaseInventoryTransactionRepository(SupabaseBaseRepository[InventoryTransaction]):
    def __init__(self):
        super().__init__("inventory_transactions", InventoryTransaction)

from app.repositories.memory.base import MemoryBaseRepository
from app.domain.inventory import Inventory, InventoryTransaction
from typing import Optional

class InventoryRepository(MemoryBaseRepository[Inventory]):
    def get_by_product(self, organization_id: str, store_id: str, product_id: str) -> Optional[Inventory]:
        with self._lock:
            for inv in self._data.values():
                if (inv.organization_id == organization_id and 
                    inv.store_id == store_id and 
                    inv.product_id == product_id):
                    return inv
            return None

    def adjust_quantities(
        self, organization_id: str, store_id: str, product_id: str, 
        d_bottles: int, d_packs: int, d_cases: int
    ) -> Inventory:
        with self._lock:
            inv = self.get_by_product(organization_id, store_id, product_id)
            if not inv:
                inv = Inventory(
                    organization_id=organization_id,
                    store_id=store_id,
                    product_id=product_id
                )
                self.create(inv)
            
            new_bottles = inv.quantity_bottles + d_bottles
            new_packs = inv.quantity_packs + d_packs
            new_cases = inv.quantity_cases + d_cases
            
            if new_bottles < 0 or new_packs < 0 or new_cases < 0:
                raise ValueError("Inventory quantities cannot be negative")
                
            inv.quantity_bottles = new_bottles
            inv.quantity_packs = new_packs
            inv.quantity_cases = new_cases
            
            return self.update(inv)

class InventoryTransactionRepository(MemoryBaseRepository[InventoryTransaction]):
    pass

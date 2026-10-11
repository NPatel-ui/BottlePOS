from app.repositories.memory.base import MemoryBaseRepository
from app.domain.products import Product
from typing import Optional

class ProductRepository(MemoryBaseRepository[Product]):
    def get_by_barcode(self, barcode: str) -> Optional[Product]:
        with self._lock:
            for product in self._data.values():
                if product.barcode == barcode and product.active_status:
                    return product
            return None

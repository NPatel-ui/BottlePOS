from typing import List, Optional
from app.domain.products import Product
from app.schemas.products import ProductCreate, ProductUpdate
from app.repositories.memory.products import ProductRepository
from app.core.exceptions import NotFoundException, ValidationException

class ProductService:
    def __init__(self, repository: ProductRepository):
        self.repository = repository

    def create_product(self, organization_id: str, store_id: str, data: ProductCreate) -> Product:
        if data.barcode and self.repository.get_by_barcode(data.barcode):
            raise ValidationException(f"Product with barcode {data.barcode} already exists.")
            
        product = Product(
            organization_id=organization_id,
            store_id=store_id,
            **data.model_dump()
        )
        return self.repository.create(product)

    def get_product(self, product_id: str) -> Product:
        product = self.repository.get(product_id)
        if not product:
            raise NotFoundException("Product", product_id)
        return product

    def get_product_by_barcode(self, barcode: str) -> Product:
        product = self.repository.get_by_barcode(barcode)
        if not product:
            raise NotFoundException("Product (barcode)", barcode)
        return product

    def list_products(self, organization_id: str, store_id: str, skip: int = 0, limit: int = 100) -> List[Product]:
        return self.repository.list(
            skip=skip, 
            limit=limit, 
            organization_id=organization_id, 
            store_id=store_id,
            active_status=True
        )

    def update_product(self, product_id: str, data: ProductUpdate) -> Product:
        product = self.get_product(product_id)
        
        update_data = data.model_dump(exclude_unset=True)
        
        if "barcode" in update_data and update_data["barcode"] != product.barcode:
            existing = self.repository.get_by_barcode(update_data["barcode"])
            if existing and existing.id != product.id:
                raise ValidationException(f"Product with barcode {update_data['barcode']} already exists.")
                
        for key, value in update_data.items():
            setattr(product, key, value)
            
        return self.repository.update(product)

    def delete_product(self, product_id: str) -> None:
        if not self.repository.delete(product_id):
            raise NotFoundException("Product", product_id)

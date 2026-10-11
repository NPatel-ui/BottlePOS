from typing import List
from app.domain.customers import Customer
from app.schemas.customers import CustomerCreate, CustomerUpdate
from app.repositories.memory.customers import CustomerRepository
from app.core.exceptions import NotFoundException

class CustomerService:
    def __init__(self, repo: CustomerRepository):
        self.repo = repo

    def create_customer(self, organization_id: str, store_id: str, data: CustomerCreate) -> Customer:
        customer = Customer(
            organization_id=organization_id, 
            store_id=store_id, 
            **data.model_dump()
        )
        return self.repo.create(customer)

    def get_customer(self, customer_id: str) -> Customer:
        customer = self.repo.get(customer_id)
        if not customer:
            raise NotFoundException("Customer", customer_id)
        return customer

    def update_customer(self, customer_id: str, data: CustomerUpdate) -> Customer:
        customer = self.get_customer(customer_id)
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(customer, key, value)
        return self.repo.update(customer)

    def list_customers(self, organization_id: str, store_id: str) -> List[Customer]:
        return self.repo.list(organization_id=organization_id, store_id=store_id)

from typing import List
from app.domain.vendors import Vendor
from app.schemas.vendors import VendorCreate, VendorUpdate
from app.repositories.memory.vendors import VendorRepository
from app.core.exceptions import NotFoundException

class VendorService:
    def __init__(self, repo: VendorRepository):
        self.repo = repo

    def create_vendor(self, organization_id: str, data: VendorCreate) -> Vendor:
        vendor = Vendor(organization_id=organization_id, **data.model_dump())
        return self.repo.create(vendor)

    def get_vendor(self, vendor_id: str) -> Vendor:
        vendor = self.repo.get(vendor_id)
        if not vendor:
            raise NotFoundException("Vendor", vendor_id)
        return vendor

    def update_vendor(self, vendor_id: str, data: VendorUpdate) -> Vendor:
        vendor = self.get_vendor(vendor_id)
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(vendor, key, value)
        return self.repo.update(vendor)

    def list_vendors(self, organization_id: str) -> List[Vendor]:
        return self.repo.list(organization_id=organization_id)

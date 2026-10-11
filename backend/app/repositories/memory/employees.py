from app.repositories.memory.base import MemoryBaseRepository
from app.domain.employees import Employee

class EmployeeRepository(MemoryBaseRepository[Employee]):
    def get_by_email(self, email: str) -> Employee | None:
        for item in self.list():
            if item.email == email:
                return item
        return None

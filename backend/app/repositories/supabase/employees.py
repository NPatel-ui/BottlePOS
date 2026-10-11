from typing import Optional
from app.repositories.supabase.base import SupabaseBaseRepository
from app.domain.employees import Employee

class SupabaseEmployeeRepository(SupabaseBaseRepository[Employee]):
    def __init__(self):
        super().__init__("employees", Employee)

    def get_by_email(self, email: str) -> Optional[Employee]:
        client = self.client
        if not client:
            return None
        res = client.table(self.table_name).select("*").eq("email", email).execute()
        if res.data and len(res.data) > 0:
            return self._from_record(res.data[0])
        return None

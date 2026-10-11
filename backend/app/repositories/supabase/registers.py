from app.repositories.supabase.base import SupabaseBaseRepository
from app.domain.registers import POSRegister

class SupabaseRegisterRepository(SupabaseBaseRepository[POSRegister]):
    def __init__(self):
        super().__init__("pos_registers", POSRegister)

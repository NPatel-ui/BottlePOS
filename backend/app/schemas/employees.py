from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List
from app.domain.employees import EmployeeRole, Permission

class EmployeeCreate(BaseModel):
    first_name: str
    last_name: str
    role: EmployeeRole
    email: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None
    permissions: List[Permission] = []

class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[EmployeeRole] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None
    permissions: Optional[List[Permission]] = None
    active_status: Optional[bool] = None

class EmployeeResponse(BaseModel):
    id: str
    organization_id: str
    store_id: str
    first_name: str
    last_name: str
    role: EmployeeRole
    email: Optional[str]
    phone: Optional[str]
    active_status: bool
    permissions: List[Permission]
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str

class LoginRequest(BaseModel):
    email: str
    password: str

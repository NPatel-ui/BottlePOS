from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.schemas.employees import LoginRequest, Token, EmployeeCreate
from app.domain.employees import EmployeeRole, Permission
from app.services.employee_service import EmployeeService
from app.services.email_verification import email_verification_service
from app.core.exceptions import NotFoundException
from app.api.deps import get_employee_service

router = APIRouter(prefix="/auth", tags=["auth"])

class VerifyEmailRequest(BaseModel):
    email: str
    code: str

class ResendVerificationRequest(BaseModel):
    email: str

@router.post("/login", response_model=Token)
async def login(
    data: LoginRequest,
    service: EmployeeService = Depends(get_employee_service)
):
    return service.authenticate(data)

@router.post("/register")
async def register(
    data: dict,
    service: EmployeeService = Depends(get_employee_service)
):
    email = data.get("email")
    if not email:
        from app.core.exceptions import ValidationException
        raise ValidationException("Email is required")

    org_id = data.get("organization_id") or "org_default"
    store_id = data.get("store_id") or "store_default"
    
    employee_data = EmployeeCreate(
        first_name=data.get("username", "Admin"),
        last_name="",
        role=EmployeeRole.ADMIN,
        email=email,
        password=data.get("password"),
        permissions=list(Permission)  # give all permissions
    )
    
    # Create employee with active_status=False until email is verified
    employee = service.create_employee(org_id, store_id, employee_data, active_status=False)
    
    # Generate 10-minute verification record
    verification = email_verification_service.create_verification(email)
    
    return {
        "status": "pending_verification",
        "message": "Account created! A verification code has been dispatched to your email address.",
        "email": email,
        "expires_in_minutes": 10,
        "expires_at": verification.expires_at.isoformat(),
        "employee_id": employee.id
    }

@router.post("/verify-email")
async def verify_email(
    data: VerifyEmailRequest,
    service: EmployeeService = Depends(get_employee_service)
):
    return service.verify_employee_email(data.email, data.code)

@router.post("/resend-verification")
async def resend_verification(
    data: ResendVerificationRequest,
    service: EmployeeService = Depends(get_employee_service)
):
    employee = service.repository.get_by_email(data.email)
    if not employee:
        raise NotFoundException("Employee account", data.email)
    if employee.active_status:
        return {"message": "Account is already verified. Please log in.", "verified": True}
        
    verification = email_verification_service.create_verification(data.email)
    return {
        "message": "Verification code resent to your email address.",
        "email": data.email,
        "expires_in_minutes": 10,
        "expires_at": verification.expires_at.isoformat()
    }

class ConfirmLinkRequest(BaseModel):
    email: str

@router.post("/confirm-link")
async def confirm_link(
    data: ConfirmLinkRequest,
    service: EmployeeService = Depends(get_employee_service)
):
    return service.activate_employee_by_email(data.email)


from typing import List, Optional
from app.domain.employees import Employee, EmployeeRole, Permission
from app.schemas.employees import EmployeeCreate, EmployeeUpdate, LoginRequest, Token
from app.repositories.memory.employees import EmployeeRepository
from app.core.exceptions import NotFoundException, ValidationException, BusinessRuleException
from app.core.security import get_password_hash, verify_password, create_access_token

from app.services.email_verification import email_verification_service

class EmployeeService:
    def __init__(self, repository: EmployeeRepository):
        self.repository = repository

    def create_employee(self, organization_id: str, store_id: str, data: EmployeeCreate, active_status: bool = True) -> Employee:
        if data.email:
            existing = self.repository.get_by_email(data.email)
            if existing:
                if not existing.active_status:
                    if email_verification_service.is_expired(data.email):
                        self.repository.delete(existing.id)
                        email_verification_service.delete_record(data.email)
                    else:
                        raise ValidationException("An account with this email is pending verification. Please verify within 10 minutes or wait for it to expire.")
                else:
                    raise ValidationException("Email already registered. Please log in.")
            
        employee_data = data.model_dump(exclude={"password"})
        if data.password:
            employee_data["password_hash"] = get_password_hash(data.password)
            
        employee = Employee(
            organization_id=organization_id,
            store_id=store_id,
            active_status=active_status,
            **employee_data
        )
        return self.repository.create(employee)

    def update_employee(self, employee_id: str, data: EmployeeUpdate) -> Employee:
        employee = self.get_employee(employee_id)
        
        update_data = data.model_dump(exclude_unset=True, exclude={"password"})
        
        if data.email and data.email != employee.email:
            existing = self.repository.get_by_email(data.email)
            if existing and existing.id != employee_id:
                raise ValidationException("Email already registered")
                
        if data.password:
            update_data["password_hash"] = get_password_hash(data.password)
            
        for key, value in update_data.items():
            setattr(employee, key, value)
            
        return self.repository.update(employee)

    def get_employee(self, employee_id: str) -> Employee:
        employee = self.repository.get(employee_id)
        if not employee:
            raise NotFoundException("Employee", employee_id)
        return employee

    def list_employees(self, organization_id: str, store_id: str) -> List[Employee]:
        return self.repository.list(organization_id=organization_id, store_id=store_id)
        
    def authenticate(self, data: LoginRequest) -> Token:
        employee = self.repository.get_by_email(data.email)
        if not employee:
            raise BusinessRuleException("Invalid credentials")
        if not employee.password_hash or not verify_password(data.password, employee.password_hash):
            raise BusinessRuleException("Invalid credentials")
        if not employee.active_status:
            if email_verification_service.is_expired(data.email):
                self.repository.delete(employee.id)
                email_verification_service.delete_record(data.email)
                raise BusinessRuleException(
                    "Verification expired (10 minutes limit exceeded). Your pending account has been removed. Please create an account again.",
                    code="VERIFICATION_EXPIRED"
                )
            raise BusinessRuleException(
                "Email not verified. Please check your email and verify your account within 10 minutes before logging in.",
                code="EMAIL_NOT_VERIFIED"
            )
            
        access_token = create_access_token(subject=employee.id)
        return Token(access_token=access_token, token_type="bearer")

    def verify_employee_email(self, email: str, code: str) -> dict:
        employee = self.repository.get_by_email(email)
        if not employee:
            raise NotFoundException("Employee account", email)
            
        success, message, is_expired = email_verification_service.verify_code(email, code)
        if not success:
            if is_expired:
                self.repository.delete(employee.id)
                email_verification_service.delete_record(email)
                raise BusinessRuleException(message, code="VERIFICATION_EXPIRED")
            raise BusinessRuleException(message, code="INVALID_CODE")
            
        employee.active_status = True
        self.repository.update(employee)
        return {"success": True, "message": "Email verified successfully! You can now log in with your credentials."}

    def activate_employee_by_email(self, email: str) -> dict:
        employee = self.repository.get_by_email(email)
        if not employee:
            raise NotFoundException("Employee account", email)
        employee.active_status = True
        self.repository.update(employee)
        email_verification_service.delete_record(email)
        access_token = create_access_token(subject=employee.id)
        return {
            "success": True,
            "message": "Account verified and unlocked successfully!",
            "access_token": access_token,
            "token_type": "bearer",
            "employee": {
                "id": employee.id,
                "first_name": employee.first_name,
                "email": employee.email,
                "role": employee.role
            }
        }


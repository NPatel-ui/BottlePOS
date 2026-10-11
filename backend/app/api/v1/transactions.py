from fastapi import APIRouter, Depends, Query, Path, Body, HTTPException
from typing import List, Optional
from app.schemas.transactions import (
    TransactionCreate, 
    TransactionItemCreate, 
    PaymentRequest, 
    RefundRequest, 
    TransactionResponse,
    DiscountRequest,
    VoidRequest
)
from app.services.transaction_service import TransactionService
from app.domain.employees import Employee, Permission
from app.api.deps import get_transaction_service, get_current_user, RequirePermissions, get_idempotency_key
from app.core.idempotency import idempotency_store

router = APIRouter(prefix="/transactions", tags=["transactions"])

def handle_idempotent_request(key: Optional[str], func, *args, **kwargs):
    if not key:
        return func(*args, **kwargs)
        
    if not idempotency_store.acquire(key):
        record = idempotency_store.get(key)
        if record and not record.locked:
            return record.response
        else:
            raise HTTPException(status_code=409, detail="Request is already being processed")
            
    try:
        response = func(*args, **kwargs)
        idempotency_store.save_response(key, response)
        return response
    except Exception as e:
        idempotency_store.release(key)
        raise e

@router.post("", response_model=TransactionResponse, status_code=201)
async def create_transaction(
    data: TransactionCreate,
    service: TransactionService = Depends(get_transaction_service),
    current_user: Employee = Depends(RequirePermissions([Permission.CREATE_TRANSACTION]))
):
    return service.create_transaction(current_user.organization_id, current_user.store_id, data)

@router.get("", response_model=List[TransactionResponse])
async def list_transactions(
    service: TransactionService = Depends(get_transaction_service),
    current_user: Employee = Depends(get_current_user)
):
    return service.list_transactions(current_user.organization_id, current_user.store_id)

@router.get("/{id}", response_model=TransactionResponse)
async def get_transaction(
    id: str = Path(...),
    service: TransactionService = Depends(get_transaction_service),
    current_user: Employee = Depends(get_current_user)
):
    return service.get_transaction(id)

@router.post("/{id}/items", response_model=TransactionResponse)
async def add_item(
    id: str = Path(...),
    data: TransactionItemCreate = Body(...),
    service: TransactionService = Depends(get_transaction_service),
    current_user: Employee = Depends(RequirePermissions([Permission.CREATE_TRANSACTION]))
):
    return service.add_item(id, data)

@router.delete("/{id}/items/{item_id}", response_model=TransactionResponse)
async def remove_item(
    id: str = Path(...),
    item_id: str = Path(...),
    service: TransactionService = Depends(get_transaction_service),
    current_user: Employee = Depends(RequirePermissions([Permission.CREATE_TRANSACTION]))
):
    return service.remove_item(id, item_id)

@router.post("/{id}/items/{item_id}/void", response_model=TransactionResponse)
async def void_item(
    id: str = Path(...),
    item_id: str = Path(...),
    data: VoidRequest = Body(...),
    service: TransactionService = Depends(get_transaction_service),
    current_user: Employee = Depends(RequirePermissions([Permission.VOID_TRANSACTION]))
):
    return service.void_item(id, item_id, data)

@router.post("/{id}/void", response_model=TransactionResponse)
async def void_transaction(
    id: str = Path(...),
    data: VoidRequest = Body(...),
    service: TransactionService = Depends(get_transaction_service),
    current_user: Employee = Depends(RequirePermissions([Permission.VOID_TRANSACTION]))
):
    return service.void_transaction(id, data)

@router.post("/{id}/discount", response_model=TransactionResponse)
async def apply_discount(
    id: str = Path(...),
    data: DiscountRequest = Body(...),
    service: TransactionService = Depends(get_transaction_service),
    current_user: Employee = Depends(RequirePermissions([Permission.APPLY_DISCOUNT]))
):
    return service.apply_discount(id, data)

@router.post("/{id}/payments", response_model=TransactionResponse)
async def add_payment(
    id: str = Path(...),
    data: PaymentRequest = Body(...),
    service: TransactionService = Depends(get_transaction_service),
    current_user: Employee = Depends(RequirePermissions([Permission.CREATE_TRANSACTION])),
    idempotency_key: Optional[str] = Depends(get_idempotency_key)
):
    return handle_idempotent_request(idempotency_key, service.add_payment, id, data)

@router.post("/{id}/complete", response_model=TransactionResponse)
async def complete_transaction(
    id: str = Path(...),
    service: TransactionService = Depends(get_transaction_service),
    current_user: Employee = Depends(RequirePermissions([Permission.CREATE_TRANSACTION])),
    idempotency_key: Optional[str] = Depends(get_idempotency_key)
):
    return handle_idempotent_request(idempotency_key, service.complete_transaction, id)

@router.post("/{id}/cancel", response_model=TransactionResponse)
async def cancel_transaction(
    id: str = Path(...),
    service: TransactionService = Depends(get_transaction_service),
    current_user: Employee = Depends(RequirePermissions([Permission.CREATE_TRANSACTION]))
):
    return service.cancel_transaction(id)

@router.post("/{id}/refund", response_model=TransactionResponse)
async def refund_transaction(
    id: str = Path(...),
    data: RefundRequest = Body(...),
    service: TransactionService = Depends(get_transaction_service),
    current_user: Employee = Depends(RequirePermissions([Permission.REFUND_TRANSACTION])),
    idempotency_key: Optional[str] = Depends(get_idempotency_key)
):
    return handle_idempotent_request(idempotency_key, service.refund_transaction, id, data)

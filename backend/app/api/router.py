from fastapi import APIRouter
from app.api.v1 import (
    products, 
    inventory, 
    transactions, 
    auth, 
    employees, 
    shifts, 
    vendors, 
    purchasing, 
    customers,
    audit,
    shield,
    reports,
    health
)

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(employees.router)
api_router.include_router(products.router)
api_router.include_router(inventory.router)
api_router.include_router(transactions.router)
api_router.include_router(shifts.router)
api_router.include_router(vendors.router)
api_router.include_router(purchasing.router)
api_router.include_router(customers.router)
api_router.include_router(audit.router)
api_router.include_router(shield.router)
api_router.include_router(reports.router)
api_router.include_router(health.router)

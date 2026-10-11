from fastapi import APIRouter

router = APIRouter(prefix="/health", tags=["health"])

@router.get("/liveness")
async def liveness():
    return {"status": "ok"}

@router.get("/readiness")
async def readiness():
    # In a full setup, this might check database connectivity or redis.
    # For now, if the app is answering, it's ready.
    return {"status": "ready"}

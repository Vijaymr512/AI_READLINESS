from fastapi import APIRouter
import httpx

router = APIRouter()

@router.get("/health")
async def health():
    return {"status": "ok", "app": "App Reader"}

@router.get("/internet")
async def check_internet():
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            r = await client.get("https://www.google.com")
            return {"online": r.status_code < 400}
    except Exception:
        return {"online": False}

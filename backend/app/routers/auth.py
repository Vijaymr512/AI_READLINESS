from fastapi import APIRouter, HTTPException, status
from app.storage.schemas import UserCreate, UserLogin, TokenResponse
from app.storage.user_repo import create_user, get_user_by_email
from app.utils.auth_utils import hash_password, verify_password, create_token

router = APIRouter()

@router.post("/signup", response_model=TokenResponse, status_code=201)
async def signup(body: UserCreate):
    existing = await get_user_by_email(body.email)
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")
    user = await create_user({
        "email": body.email,
        "password_hash": hash_password(body.password),
        "full_name": body.full_name,
        "profile_image": None,
    })
    token = create_token(user["id"])
    return TokenResponse(
        access_token=token,
        user={"id": user["id"], "email": user["email"], "full_name": user["full_name"], "profile_image": user["profile_image"]}
    )

@router.post("/login", response_model=TokenResponse)
async def login(body: UserLogin):
    user = await get_user_by_email(body.email)
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_token(user["id"])
    return TokenResponse(
        access_token=token,
        user={"id": user["id"], "email": user["email"], "full_name": user["full_name"], "profile_image": user["profile_image"]}
    )

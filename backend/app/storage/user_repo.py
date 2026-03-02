from bson import ObjectId
from app.config.database import db

def _ser(doc: dict) -> dict:
    return {
        "id":            str(doc["_id"]),
        "email":         doc["email"],
        "password_hash": doc["password_hash"],
        "full_name":     doc.get("full_name"),
        "profile_image": doc.get("profile_image"),
        "is_admin":      doc.get("is_admin", False),
        "created_at":    doc.get("created_at"),
    }

async def create_user(data: dict) -> dict:
    result = await db.users.insert_one(data)
    data["_id"] = result.inserted_id
    return _ser(data)

async def get_user_by_email(email: str) -> dict | None:
    doc = await db.users.find_one({"email": email})
    return _ser(doc) if doc else None

async def get_user_by_id(user_id: str) -> dict | None:
    if not ObjectId.is_valid(user_id):
        return None
    doc = await db.users.find_one({"_id": ObjectId(user_id)})
    return _ser(doc) if doc else None

async def update_user(user_id: str, fields: dict) -> dict | None:
    if not ObjectId.is_valid(user_id):
        return None
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": fields})
    return await get_user_by_id(user_id)

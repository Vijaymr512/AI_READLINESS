from datetime import datetime, timezone
from bson import ObjectId
from app.config.database import db

def _ser(doc: dict) -> dict:
    doc["id"] = str(doc["_id"])
    doc["user_id"] = str(doc["user_id"])
    del doc["_id"]
    return doc

async def create_assessment(data: dict) -> dict:
    data["created_at"] = datetime.now(timezone.utc)
    result = await db.assessments.insert_one(data)
    data["_id"] = result.inserted_id
    return _ser(data)

async def list_by_user(user_id: str) -> list[dict]:
    cursor = db.assessments.find({"user_id": ObjectId(user_id)}).sort("created_at", -1)
    docs = await cursor.to_list(length=200)
    return [_ser(doc) for doc in docs]

async def get_by_id(assessment_id: str, user_id: str) -> dict | None:
    if not (ObjectId.is_valid(assessment_id) and ObjectId.is_valid(user_id)):
        return None
    doc = await db.assessments.find_one(
        {"_id": ObjectId(assessment_id), "user_id": ObjectId(user_id)}
    )
    return _ser(doc) if doc else None

async def delete_by_id(assessment_id: str, user_id: str) -> bool:
    if not (ObjectId.is_valid(assessment_id) and ObjectId.is_valid(user_id)):
        return False
    r = await db.assessments.delete_one(
        {"_id": ObjectId(assessment_id), "user_id": ObjectId(user_id)}
    )
    return r.deleted_count > 0

async def delete_many_by_ids(ids: list[str], user_id: str) -> int:
    valid = [ObjectId(i) for i in ids if ObjectId.is_valid(i)]
    if not valid or not ObjectId.is_valid(user_id):
        return 0
    r = await db.assessments.delete_many(
        {"_id": {"$in": valid}, "user_id": ObjectId(user_id)}
    )
    return int(r.deleted_count)

async def update_assessment(assessment_id: str, data: dict) -> dict | None:
    """Update an existing assessment record (used after SSE analysis completes)."""
    if not ObjectId.is_valid(assessment_id):
        return None

    data.pop("_id", None)
    data.pop("id", None)
    await db.assessments.update_one(
        {"_id": ObjectId(assessment_id)},
        {"$set": data},
    )
    doc = await db.assessments.find_one({"_id": ObjectId(assessment_id)})
    return _ser(doc) if doc else None


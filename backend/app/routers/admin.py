"""
admin.py — Admin-only API router.
Endpoints accessible only to users with is_admin=True.
"""
from fastapi import APIRouter, Depends, HTTPException
from app.config.database import get_db
from app.utils.auth_utils import get_current_user_id
from app.storage.user_repo import get_user_by_id
from datetime import datetime, timezone

router = APIRouter(prefix="/admin", tags=["Admin"])

async def require_admin(user_id: str = Depends(get_current_user_id)):
    user = await get_user_by_id(user_id)
    if not user or not user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Admin access required.")
    return user_id

@router.get("/stats")
async def admin_stats(admin=Depends(require_admin)):
    """System-wide stats for admin dashboard."""
    db = await get_db()
    total_users       = await db.users.count_documents({})
    total_assessments = await db.assessments.count_documents({})
    recent_users      = await db.users.count_documents({
        "created_at": {"$gte": datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)}
    })
    recent_assessments = await db.assessments.count_documents({
        "created_at": {"$gte": datetime.now(timezone.utc).replace(hour=0, minute=0, second=0)}
    })

    pipeline = [{"$group": {
        "_id": "$status",
        "count": {"$sum": 1},
        "avg_score": {"$avg": "$score"},
    }}]
    dist_cursor = db.assessments.aggregate(pipeline)
    score_dist  = [d async for d in dist_cursor]

    recent_cursor = db.assessments.find({}, {"score": 1, "created_at": 1, "status": 1}).sort("created_at", -1).limit(30)
    recent_runs   = [r async for r in recent_cursor]

    return {
        "total_users":         total_users,
        "total_assessments":   total_assessments,
        "new_users_today":     recent_users,
        "new_assessments_today": recent_assessments,
        "score_distribution":  score_dist,
        "recent_runs":         [{
            "score": r["score"], "status": r.get("status"),
            "created_at": r["created_at"].isoformat() if r.get("created_at") else None
        } for r in recent_runs],
    }

@router.get("/users")
async def list_all_users(skip: int = 0, limit: int = 50, admin=Depends(require_admin)):
    """List all registered users."""
    db = await get_db()
    cursor = db.users.find({}, {"password_hash": 0}).sort("created_at", -1).skip(skip).limit(limit)
    users = []
    async for u in cursor:
        uid = str(u.pop("_id", ""))
        u["id"] = uid

        count = await db.assessments.count_documents({"user_id": uid})
        u["assessment_count"] = count
        users.append(u)
    total = await db.users.count_documents({})
    return {"users": users, "total": total, "skip": skip, "limit": limit}

@router.get("/users/{user_id}")
async def get_user_detail(user_id: str, admin=Depends(require_admin)):
    """Get a single user's full profile + all their assessments."""
    from bson import ObjectId
    db = await get_db()
    try:
        u = await db.users.find_one({"_id": ObjectId(user_id)}, {"password_hash": 0})
    except Exception:
        raise HTTPException(status_code=404, detail="User not found.")
    if not u:
        raise HTTPException(status_code=404, detail="User not found.")
    u["id"] = str(u.pop("_id"))

    cursor = db.assessments.find({"user_id": user_id}).sort("created_at", -1).limit(20)
    assessments = []
    async for a in cursor:
        a["id"] = str(a.pop("_id"))
        assessments.append(a)

    return {"user": u, "assessments": assessments}

@router.delete("/users/{user_id}")
async def delete_user(user_id: str, admin=Depends(require_admin)):
    """Delete a user and all their assessments."""
    from bson import ObjectId
    db = await get_db()
    try:
        await db.assessments.delete_many({"user_id": user_id})
        await db.users.delete_one({"_id": ObjectId(user_id)})
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"deleted": True, "user_id": user_id}

@router.patch("/users/{user_id}/admin")
async def toggle_admin(user_id: str, is_admin: bool, admin=Depends(require_admin)):
    """Grant or revoke admin status."""
    from bson import ObjectId
    db = await get_db()
    try:
        await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"is_admin": is_admin}})
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"user_id": user_id, "is_admin": is_admin}

@router.get("/assessments")
async def list_all_assessments(skip: int = 0, limit: int = 50, status: str = None, admin=Depends(require_admin)):
    """List all assessments across all users."""
    db  = await get_db()
    filt = {}
    if status:
        filt["status"] = status
    cursor = db.assessments.find(filt, {
        "user_id": 1, "score": 1, "status": 1, "source_value": 1,
        "source_type": 1, "created_at": 1, "layer_scores": 1,
    }).sort("created_at", -1).skip(skip).limit(limit)
    items = []
    async for a in cursor:
        a["id"] = str(a.pop("_id"))
        items.append(a)
    total = await db.assessments.count_documents(filt)
    return {"assessments": items, "total": total}

@router.delete("/assessments/{assessment_id}")
async def admin_delete_assessment(assessment_id: str, admin=Depends(require_admin)):
    from bson import ObjectId
    db = await get_db()
    try:
        await db.assessments.delete_one({"_id": ObjectId(assessment_id)})
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"deleted": True}

from fastapi import APIRouter, Depends, HTTPException
from app.storage import user_repo, assessment_repo
from app.utils.auth_utils import get_current_user_id

router = APIRouter()

@router.get("/me")
async def get_me(user_id: str = Depends(get_current_user_id)):
    user = await user_repo.get_user_by_id(user_id)
    if not user:
        raise HTTPException(404, "User not found")
    return {"id": user["id"], "email": user["email"], "full_name": user["full_name"], "profile_image": user["profile_image"]}

@router.patch("/me")
async def update_me(body: dict, user_id: str = Depends(get_current_user_id)):
    allowed = {k: v for k, v in body.items() if k in {"full_name", "profile_image"}}
    user = await user_repo.update_user(user_id, allowed)
    if not user:
        raise HTTPException(404, "User not found")
    return {"id": user["id"], "email": user["email"], "full_name": user["full_name"], "profile_image": user["profile_image"]}

@router.get("/dashboard")
async def dashboard(user_id: str = Depends(get_current_user_id)):
    assessments = await assessment_repo.list_by_user(user_id)

    lightweight = []
    for a in assessments:
        lightweight.append({
            "id": a["id"],
            "source_type": a.get("source_type", ""),
            "source_value": a.get("source_value", ""),
            "score": a.get("score", 0),
            "status": a.get("status", ""),
            "created_at": a.get("created_at"),
            "layer_scores": a.get("layer_scores", {}),
            "category_scores": a.get("category_scores", {}),
            "score_details": a.get("score_details", {}),
        })
    return {"assessments": lightweight}

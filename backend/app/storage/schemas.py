from datetime import datetime
from pydantic import BaseModel, EmailStr, Field

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str | None = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: str
    email: EmailStr
    full_name: str | None = None
    profile_image: str | None = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class AssessmentOut(BaseModel):
    id: str
    user_id: str
    source_type: str
    source_value: str
    score: int
    status: str
    summary: str
    category_scores: dict
    layer_scores: dict
    risks: list[dict]
    capabilities: dict
    score_details: dict
    executive_summary: str
    improvement_diagnostics: list[dict]
    why_not_80: list[str]
    project_profile: dict
    created_at: datetime

class DashboardOut(BaseModel):
    assessments: list[dict]

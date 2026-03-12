from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ApplicationBase(BaseModel):
    message: Optional[str] = None
    specialization: str   # обязательно

class ApplicationCreate(ApplicationBase):
    project_id: int

class ApplicationUpdateStatus(BaseModel):
    status: str  # "accepted" или "rejected"

class ApplicationOut(ApplicationBase):
    id: int
    project_id: int
    analyst_id: int
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AnalystInfo(BaseModel):
    id: int
    full_name: str
    specialization: str
    avatar: Optional[str] = None
    average_rating: float
    review_count: int

class ApplicationWithAnalystOut(ApplicationOut):
    analyst: AnalystInfo
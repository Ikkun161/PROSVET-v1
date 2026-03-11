from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ReviewBase(BaseModel):
    rating: float
    text: Optional[str] = None

class ReviewCreate(ReviewBase):
    analyst_id: int  # кому отзыв

class ReviewOut(ReviewBase):
    id: int
    reviewer_id: int
    analyst_id: int
    created_at: datetime

    class Config:
        from_attributes = True
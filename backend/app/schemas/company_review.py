from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class CompanyReviewBase(BaseModel):
    rating: float
    text: Optional[str] = None

class CompanyReviewCreate(CompanyReviewBase):
    company_id: int

class CompanyReviewOut(CompanyReviewBase):
    id: int
    reviewer_id: int
    company_id: int
    created_at: datetime

    class Config:
        from_attributes = True
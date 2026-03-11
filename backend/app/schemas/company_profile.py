from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CompanyProfileBase(BaseModel):
    company_name: str
    description: Optional[str] = None
    website: Optional[str] = None
    industry: Optional[str] = None
    founded_year: Optional[int] = None

class CompanyProfileCreate(CompanyProfileBase):
    pass

class CompanyProfileUpdate(CompanyProfileBase):
    pass

class CompanyProfileOut(CompanyProfileBase):
    id: int
    user_id: int
    logo: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class CompanyProfileWithRatingOut(CompanyProfileBase):
    id: int
    user_id: int
    logo: Optional[str] = None
    average_rating: float
    review_count: int

    class Config:
        from_attributes = True
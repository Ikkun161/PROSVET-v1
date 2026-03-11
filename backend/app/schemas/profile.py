from typing import Optional
from pydantic import BaseModel

class ProfileBase(BaseModel):
    full_name: str
    specialization: str
    experience: Optional[int] = None
    description: Optional[str] = None
    portfolio: Optional[str] = None
    hourly_rate: Optional[int] = None

class ProfileCreate(ProfileBase):
    pass

class ProfileUpdate(ProfileBase):
    pass

class ProfileOut(ProfileBase):
    id: int
    user_id: int
    avatar: Optional[str] = None

    class Config:
        from_attributes = True

class ProfileWithRatingOut(ProfileBase):
    id: int
    user_id: int
    avatar: Optional[str] = None
    average_rating: float
    review_count: int

    class Config:
        from_attributes = True
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class RequiredSpecialization(BaseModel):
    specialization: str
    hourly_rate: int

class ProjectBase(BaseModel):
    title: str
    description: Optional[str] = None
    required_specializations: Optional[List[RequiredSpecialization]] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(ProjectBase):
    pass

class ProjectOut(ProjectBase):
    id: int
    company_id: int
    avatar: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Для списка проектов с данными компании
class CompanyInfo(BaseModel):
    id: int
    company_name: str
    logo: Optional[str] = None

class ProjectListItemOut(ProjectOut):
    company: CompanyInfo
    matching_score: float = 0.0


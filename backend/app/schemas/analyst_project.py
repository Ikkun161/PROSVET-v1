from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import date

class AnalystProjectBase(BaseModel):
    title: str
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None

    # Этот валидатор сработает ПЕРЕД созданием модели
    @field_validator('start_date', mode='before')
    @classmethod
    def set_now_if_empty(cls, v):
        # Если дата пришла как None, пустая строка или просто не указана
        if v is None or v == "":
            return date.today()
        return v

class AnalystProjectCreate(AnalystProjectBase):
    pass

class AnalystProjectUpdate(AnalystProjectBase):
    title: Optional[str] = None
    description: Optional[str] = None

class AnalystProjectOut(AnalystProjectBase):
    id: int
    analyst_id: int
    category: Optional[str] = None
    confidence: Optional[float] = None

    class Config:
        from_attributes = True
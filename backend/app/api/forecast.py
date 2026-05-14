from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, validator
from typing import List
from datetime import datetime
import re
from app.ml.forecast import forecast_sales

router = APIRouter()

class ForecastRequest(BaseModel):
    sells: List[float]
    start_date: str  # формат YYYY-MM-DD
    periods: int = 3

    @validator('start_date')
    def normalize_date(cls, v):
        # Убираем дублирующиеся дефисы и пробелы
        v = re.sub(r'-{2,}', '-', v.strip())
        # Проверяем корректность даты
        try:
            datetime.strptime(v, '%Y-%m-%d')
        except ValueError:
            raise ValueError('start_date должен быть в формате YYYY-MM-DD')
        return v

class ForecastResponse(BaseModel):
    forecast: List[float]
    forecast_dates: List[str]
    historical: List[float]
    historical_dates: List[str]
    metrics: dict

@router.post("/forecast", response_model=ForecastResponse)
def predict_sales(request: ForecastRequest):
    if len(request.sells) < 6:
        raise HTTPException(status_code=400, detail="Need at least 6 sales values")
    warning = None
    if len(request.sells) < 12:
        warning = "Для учёта сезонности рекомендуется не менее 12–24 точек. Прогноз может быть менее точным."
    result = forecast_sales(request.sells, request.start_date, request.periods)
    if result.get('warnings'):
        result['model_warnings'] = result['warnings'][:3]
        del result['warnings']
    return result
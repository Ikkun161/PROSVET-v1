from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from datetime import datetime
import pandas as pd
from app.ml.forecast import forecast_sales

router = APIRouter()

class ForecastRequest(BaseModel):
    sells: List[float]
    start_date: str  # формат YYYY-MM-DD
    periods: int = 3  # количество месяцев прогноза

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
    # Если есть предупреждения, добавляем их в ответ (можно объединить с warning о данных)
    if result.get('warnings'):
        # Берём первые 3, чтобы не перегружать
        result['model_warnings'] = result['warnings'][:3]
        del result['warnings']
    return result
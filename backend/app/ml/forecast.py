import pandas as pd
import numpy as np
import warnings
from sklearn.linear_model import LinearRegression
from statsmodels.tsa.statespace.sarimax import SARIMAX

def capture_warnings(func, *args, **kwargs):
    captured_warnings = []
    with warnings.catch_warnings(record=True) as w:
        warnings.simplefilter("always")
        result = func(*args, **kwargs)
        for warning in w:
            captured_warnings.append(str(warning.message))
    return result, captured_warnings

def forecast_sales(sells: list, start_date: str, periods: int = 3):
    if len(sells) < 3:
        raise ValueError("Недостаточно данных. Требуется минимум 3 значения.")

    dates = pd.date_range(start=start_date, periods=len(sells), freq='MS')
    df = pd.DataFrame({'sells': sells, 'date': dates})
    df.set_index('date', inplace=True)

    warnings_list = []
    forecast_values = None
    model_type = "sarimax"

    # Пытаемся обучить SARIMAX
    try:
        def train_sarimax():
            model = SARIMAX(df['sells'], order=(1, 1, 1), seasonal_order=(1, 0, 0, 12))
            result = model.fit(disp=False)
            return result.forecast(steps=periods)
        forecast, w = capture_warnings(train_sarimax)
        warnings_list.extend(w)
        forecast_values = forecast
    except Exception as e:
        warnings_list.append(f"SARIMAX не удался: {str(e)}. Используется линейная регрессия.")
        model_type = "linear"

    # Fallback: линейная регрессия
    if forecast_values is None:
        X = np.arange(len(sells)).reshape(-1, 1)
        y = sells
        model = LinearRegression()
        model.fit(X, y)
        future_X = np.arange(len(sells), len(sells) + periods).reshape(-1, 1)
        forecast_values = model.predict(future_X)
        if len(sells) < 12:
            warnings_list.append("Данных недостаточно для выявления сезонности (требуется 12+ точек). Прогноз основан только на тренде.")

    # Даты прогноза
    last_date = df.index[-1]
    forecast_dates = pd.date_range(start=last_date + pd.DateOffset(months=1), periods=periods, freq='MS')
    historical_dates = [d.strftime('%Y-%m') for d in df.index]
    historical_values = df['sells'].tolist()
    forecast_values = forecast_values.tolist() if hasattr(forecast_values, 'tolist') else list(forecast_values)
    forecast_dates_str = [d.strftime('%Y-%m') for d in forecast_dates]

    # ----- ВЫЧИСЛЕНИЕ ТРЕНДА ПО СРАВНЕНИЮ СРЕДНИХ НАЧАЛА И КОНЦА -----
    n = len(historical_values)
    window = min(6, n // 3) if n >= 6 else n // 2
    if window < 2:
        window = n
    first_avg = np.mean(historical_values[:window])
    last_avg = np.mean(historical_values[-window:])
    diff_percent = (last_avg - first_avg) / first_avg * 100
        # ... после вычисления diff_percent ...
    trend_percent = diff_percent   # используем ту же разницу средних

    if diff_percent > 5:
        overall_trend = 'growth'
    elif diff_percent < -5:
        overall_trend = 'decline'
    else:
        overall_trend = 'stable'
    # ----------------------------------------------------------------

    last_historical = historical_values[-1]
    first_forecast = forecast_values[0]
    trend_percent = ((first_forecast - last_historical) / last_historical) * 100

    metrics = {
        'last_historical': last_historical,
        'first_forecast': first_forecast,
        'trend_percent': round(diff_percent, 2),   # ← изменено
        'overall_trend': overall_trend,
        'model_type': model_type,
    }

    return {
        'historical': historical_values,
        'historical_dates': historical_dates,
        'forecast': forecast_values,
        'forecast_dates': forecast_dates_str,
        'metrics': metrics,
        'warnings': warnings_list
    }
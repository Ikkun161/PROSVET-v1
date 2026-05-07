import { useState } from 'react';
import AuthHeader from '../components/AuthHeader';
import { apiFetch } from '../utils/api';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import './ForecastPage.css';

function ForecastPage() {
    const [salesData, setSalesData] = useState('');
    const [startDate, setStartDate] = useState('2022-01-01');
    const [periods, setPeriods] = useState(6);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [warning, setWarning] = useState('');
    const [showGuide, setShowGuide] = useState(false);
    const [modelWarnings, setModelWarnings] = useState([]);

    const validateData = (sellsArray) => {
        if (sellsArray.length < 6) {
            setWarning('⚠️ Введено менее 6 значений. Для минимально надёжного прогноза нужно не менее 6 точек. Рекомендуется 12–24.');
            return false;
        }
        if (sellsArray.length < 12) {
            setWarning('⚠️ Для учёта сезонности рекомендуется не менее 12–24 точек. Прогноз может быть менее точным.');
        } else {
            setWarning('');
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setWarning('');
        setResult(null);
        setModelWarnings([]);

        const sellsArray = salesData.split(',').map(Number);
        if (sellsArray.length < 6) {
            setError('Введите минимум 6 значений продаж через запятую');
            setLoading(false);
            return;
        }
        if (sellsArray.some(isNaN)) {
            setError('Все значения должны быть числами');
            setLoading(false);
            return;
        }
        validateData(sellsArray);

        try {
            const response = await apiFetch('/forecast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sells: sellsArray,
                    start_date: startDate,
                    periods: periods,
                }),
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || 'Ошибка прогнозирования');
            }
            const data = await response.json();
            setResult(data);
            if (data.warning) {
                setWarning(data.warning);
            }
            if (data.warnings && data.warnings.length) {
                setModelWarnings(data.warnings);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Построение данных для графика с соединением последней исторической точки с прогнозом
    let chartData = [];
    let forecastLineData = [];
    if (result) {
        // Данные для исторической линии (только historical)
        const historicalData = result.historical.map((y, idx) => ({
            month: result.historical_dates[idx],
            historical: y,
            forecast: null,
        }));

        // Добавляем последнюю историческую точку как начальную для прогнозной линии
        const lastHistoricalPoint = {
            month: result.historical_dates[result.historical_dates.length - 1],
            historical: result.historical[result.historical.length - 1],
            forecast: result.historical[result.historical.length - 1], // дублируем для связки
        };

        // Данные для прогнозной линии (последняя историческая + прогноз)
        const forecastPoints = result.forecast.map((y, idx) => ({
            month: result.forecast_dates[idx],
            historical: null,
            forecast: y,
        }));

        chartData = [
            ...historicalData,
            lastHistoricalPoint,
            ...forecastPoints,
        ];
    }

    const getAdvice = (metrics) => {
        if (!metrics) return '';
        const { overall_trend } = metrics;
        if (overall_trend === 'growth') {
            return `📈 Прогнозируется рост продаж. Рекомендуем увеличить закупки!`;
        } else if (overall_trend === 'decline') {
            return `📉 Прогнозируется падение продаж. Возможно, стоит пересмотреть ассортимент или маркетинг. Не время унывать, но действовать надо!`;
        } else {
            return `➖ Продажи стабильны. Крупных колебаний не ожидается.`;
        }
    };

    return (
        <>
            <AuthHeader />
            <div className="forecast-page">
                <div className="forecast-container">
                    <h1 className="forecast-title">Прогноз продаж</h1>

                    {/* Блок руководства */}
                    <div className="guide-section">
                        <p className="guide-text">
                            <span className="important-label">❗ ВАЖНО</span> <br />Перед использованием модуля ознакомьтесь с <span className="guide-link" onClick={() => setShowGuide(true)}>руководством</span>.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="forecast-form">
                        <div className="form-group">
                            <label>Продажи по месяцам (через запятую, минимум 6 значений)</label>
                            <textarea
                                rows="3"
                                value={salesData}
                                onChange={(e) => setSalesData(e.target.value)}
                                placeholder="120, 115, 130, 145, 170, 200, 230, 210, 190, 175, 155, 140"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Дата начала (первый месяц)</label>
                            <input
                                type="month"
                                value={startDate.slice(0, 7)}
                                onChange={(e) => setStartDate(e.target.value + '-01')}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Количество месяцев прогноза</label>
                            <input
                                type="number"
                                min="1"
                                max="12"
                                value={periods}
                                onChange={(e) => setPeriods(parseInt(e.target.value))}
                                required
                            />
                        </div>
                        <button type="submit" className="btn-submit" disabled={loading}>
                            {loading ? 'Загрузка...' : 'Построить прогноз'}
                        </button>
                    </form>

                    {warning && <div className="warning-message">{warning}</div>}
                    {modelWarnings.length > 0 && (
                        <div className="warning-message">
                            <strong>⚠️ Предупреждения модели:</strong>
                            <ul>
                                {modelWarnings.map((w, idx) => <li key={idx}>{w}</li>)}
                            </ul>
                            <p>Прогноз может быть неточным. Рекомендуется увеличить объём данных.</p>
                        </div>
                    )}
                    {error && <div className="error-message">{error}</div>}

                    {result && (
                        <div className="forecast-result">
                            <div className="chart-container">
                                <ResponsiveContainer width="100%" height={400}>
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="historical"
                                            stroke="#ED6C4F"
                                            strokeWidth={2}
                                            name="Исторические продажи"
                                            dot={{ r: 4, fill: "white", stroke: "#ED6C4F", strokeWidth: 2 }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="forecast"
                                            stroke="#3E5A81"
                                            strokeWidth={2}
                                            strokeDasharray="5 5"
                                            name="Прогноз"
                                            dot={{
                                                r: 4,
                                                fill: "white",
                                                stroke: "#3E5A81",
                                                strokeWidth: 2,
                                                strokeDasharray: "none"   // убираем пунктир у точек
                                            }}
                                            connectNulls
                                        />
                                        <ReferenceLine x={result.historical_dates[result.historical_dates.length - 1]} stroke="gray" strokeDasharray="3 3" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="advice-box">
                                <p>{getAdvice(result.metrics)}</p>
                                <div className="metrics">
                                    <span>Последние исторические: {result.metrics.last_historical}</span>
                                    <span>Первый прогноз: {result.metrics.first_forecast}</span>
                                    <span>Изменение: {result.metrics.trend_percent > 0 ? '+' : ''}{result.metrics.trend_percent}%</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Модальное окно с руководством */}
            {showGuide && (
                <div className="modal-overlay" onClick={() => setShowGuide(false)}>
                    <div className="modal-content guide-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setShowGuide(false)}>×</button>
                        <h3>📘 Руководство по использованию модуля прогнозирования</h3>
                        <div className="guide-content">
                            <h4>Как вводить данные</h4>
                            <p>В поле «Продажи по месяцам» введите числовые значения продаж через запятую. Пример:<br />
                                <code>120, 115, 130, 145, 170</code></p>
                            <p>Каждое значение соответствует одному месяцу. Первое значение – продажи за месяц, указанный в поле «Дата начала».</p>

                            <h4>Минимальные требования</h4>
                            <p>✅ <strong>Минимум 6 значений</strong> – для построения базового прогноза (тренда).<br />
                                ✅ <strong>Рекомендуется 12–24 значения</strong> – для более точного прогноза и учёта сезонности.<br />
                                ⚠️ При недостаточном количестве данных модель может не выявить сезонные колебания, и прогноз будет менее точным.</p>

                            <h4>Что означают предупреждения?</h4>
                            <p>Если вы видите жёлтое предупреждение, это означает, что данных недостаточно для надёжного прогноза. Вы можете всё равно получить результат, но относитесь к нему с осторожностью.</p>

                            <h4>Как интерпретировать прогноз</h4>
                            <p>График показывает исторические продажи (оранжевая линия) и прогноз (синяя пунктирная линия). Под графиком выводится совет на основе динамики: рост, падение или стагнация.</p>

                            <h4>Ограничения модели</h4>
                            <p>Модель не учитывает внешние факторы (акции, рекламу, экономические кризисы). Прогноз носит рекомендательный характер и не является гарантией будущих продаж.</p>
                        </div>
                        <button className="btn-close-guide" onClick={() => setShowGuide(false)}>Закрыть</button>
                    </div>
                </div>
            )}
        </>
    );
}

export default ForecastPage;
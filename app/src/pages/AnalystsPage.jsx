import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import AuthHeader from '../components/AuthHeader';
import './AnalystsPage.css';

const SPECIALIZATIONS = [
  'Бизнес-аналитик',
  'Data Scientist',
  'Data Engineer',
  'Аналитик данных',
  'Системный аналитик',
  'BI-аналитик',
];

function AnalystsPage() {
  const [analysts, setAnalysts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Основные фильтры, применяемые к данным
  const [filters, setFilters] = useState({
    specializations: [],
    experienceMin: '',
    experienceMax: '',
    rateMin: '',
    rateMax: '',
    minRating: '',
  });

  // Локальные фильтры для модального окна
  const [localFilters, setLocalFilters] = useState({ ...filters });
  const [showFilters, setShowFilters] = useState(false);

  // Сортировка
  const [sortBy, setSortBy] = useState('rating');
  const [sortOrder, setSortOrder] = useState('desc');

  // Загрузка данных
  useEffect(() => {
    const fetchAnalysts = async () => {
      try {
        const response = await fetch('http://localhost:8000/profiles/analysts');
        if (!response.ok) throw new Error('Ошибка загрузки');
        const data = await response.json();
        setAnalysts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalysts();
  }, []);

  // При открытии модалки синхронизируем локальные фильтры с текущими
  const openFilters = () => {
    setLocalFilters({ ...filters });
    setShowFilters(true);
  };

  // Применить локальные фильтры (закрыть окно)
  const applyFilters = () => {
    setFilters(localFilters);
    setShowFilters(false);
  };

  // Сбросить фильтры: локальные очищаются и сразу применяются
  const resetFilters = () => {
    const empty = {
      specializations: [],
      experienceMin: '',
      experienceMax: '',
      rateMin: '',
      rateMax: '',
      minRating: '',
    };
    setLocalFilters(empty);
    setFilters(empty);
    setShowFilters(false);
  };

  // Закрыть без сохранения
  const closeFilters = () => {
    setShowFilters(false);
  };

  // Обработчики изменения локальных фильтров
  const handleSpecializationChange = (spec) => {
    setLocalFilters(prev => {
      const specs = prev.specializations.includes(spec)
        ? prev.specializations.filter(s => s !== spec)
        : [...prev.specializations, spec];
      return { ...prev, specializations: specs };
    });
  };

  // Применение фильтров и сортировки
  const filteredAndSortedAnalysts = useMemo(() => {
    let result = [...analysts];

    // Фильтрация
    if (filters.specializations.length > 0) {
      result = result.filter(a => filters.specializations.includes(a.specialization));
    }
    if (filters.experienceMin) {
      result = result.filter(a => a.experience >= parseInt(filters.experienceMin));
    }
    if (filters.experienceMax) {
      result = result.filter(a => a.experience <= parseInt(filters.experienceMax));
    }
    if (filters.rateMin) {
      result = result.filter(a => a.hourly_rate >= parseInt(filters.rateMin));
    }
    if (filters.rateMax) {
      result = result.filter(a => a.hourly_rate <= parseInt(filters.rateMax));
    }
    if (filters.minRating) {
      result = result.filter(a => a.average_rating >= parseFloat(filters.minRating));
    }

    // Сортировка
    result.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case 'rating':
          aVal = a.average_rating;
          bVal = b.average_rating;
          break;
        case 'experience':
          aVal = a.experience || 0;
          bVal = b.experience || 0;
          break;
        case 'rate':
          aVal = a.hourly_rate || 0;
          bVal = b.hourly_rate || 0;
          break;
        default:
          return 0;
      }
      if (sortOrder === 'asc') return aVal - bVal;
      else return bVal - aVal;
    });

    return result;
  }, [analysts, filters, sortBy, sortOrder]);

  if (loading) return <div className="loading">Загрузка...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <>
      <AuthHeader />
      <div className="analysts-page container-wide">
        <div className="page-header">
          <h1 className="page-title">Аналитики</h1>
          <div className="controls">
            <button className="btn-filters" onClick={openFilters}>
              Фильтры
            </button>
            <select
              className="sort-select"
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [by, order] = e.target.value.split('-');
                setSortBy(by);
                setSortOrder(order);
              }}
            >
              <option value="rating-desc">По рейтингу (сначала высокий)</option>
              <option value="rating-asc">По рейтингу (сначала низкий)</option>
              <option value="experience-desc">По опыту (больше)</option>
              <option value="experience-asc">По опыту (меньше)</option>
              <option value="rate-desc">По ставке (дорогие)</option>
              <option value="rate-asc">По ставке (дешевые)</option>
            </select>
          </div>
        </div>

        {showFilters && (
          <div className="modal-overlay" onClick={closeFilters}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Фильтры</h3>
              <div className="filters-form">
                <div className="filter-group">
                  <label>Специализация</label>
                  <div className="checkbox-group">
                    {SPECIALIZATIONS.map(spec => (
                      <label key={spec}>
                        <input
                          type="checkbox"
                          checked={localFilters.specializations.includes(spec)}
                          onChange={() => handleSpecializationChange(spec)}
                        />
                        {spec}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="filter-group">
                  <label>Опыт (лет)</label>
                  <div className="range-inputs">
                    <input
                      type="number"
                      placeholder="От"
                      value={localFilters.experienceMin}
                      onChange={(e) => setLocalFilters({...localFilters, experienceMin: e.target.value})}
                      min="0"
                    />
                    <input
                      type="number"
                      placeholder="До"
                      value={localFilters.experienceMax}
                      onChange={(e) => setLocalFilters({...localFilters, experienceMax: e.target.value})}
                      min="0"
                    />
                  </div>
                </div>

                <div className="filter-group">
                  <label>Ставка (₽/час)</label>
                  <div className="range-inputs">
                    <input
                      type="number"
                      placeholder="От"
                      value={localFilters.rateMin}
                      onChange={(e) => setLocalFilters({...localFilters, rateMin: e.target.value})}
                      min="0"
                    />
                    <input
                      type="number"
                      placeholder="До"
                      value={localFilters.rateMax}
                      onChange={(e) => setLocalFilters({...localFilters, rateMax: e.target.value})}
                      min="0"
                    />
                  </div>
                </div>

                <div className="filter-group">
                  <label>Минимальный рейтинг</label>
                  <select
                    value={localFilters.minRating}
                    onChange={(e) => setLocalFilters({...localFilters, minRating: e.target.value})}
                  >
                    <option value="">Любой</option>
                    <option value="4">от 4 ★</option>
                    <option value="3">от 3 ★</option>
                    <option value="2">от 2 ★</option>
                    <option value="1">от 1 ★</option>
                  </select>
                </div>

                <div className="filter-actions">
                  <button className="btn-clear" onClick={resetFilters}>Сбросить</button>
                  <button className="btn-apply" onClick={applyFilters}>Применить</button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="analysts-list">
          {filteredAndSortedAnalysts.length === 0 ? (
            <p className="no-results">Нет аналитиков, соответствующих фильтрам</p>
          ) : (
            filteredAndSortedAnalysts.map((analyst) => (
              <Link to={`/profile/${analyst.user_id}`} key={analyst.id} className="analyst-card">
                <div className="card-avatar">
                  <img
                    src={analyst.avatar ? `http://localhost:8000${analyst.avatar}` : '/default-avatar.png'}
                    alt={analyst.full_name}
                  />
                </div>
                <div className="card-info">
                  <h3 className="card-name">{analyst.full_name}</h3>
                  <div className="card-specialization">{analyst.specialization}</div>
                  <div className="card-experience">Опыт: {analyst.experience || 'не указано'} лет</div>
                  <div className="card-price">
                    {analyst.hourly_rate ? `${analyst.hourly_rate} ₽/час` : 'Ставка не указана'}
                  </div>
                  <div className={`card-rating ${analyst.review_count > 0 ? '' : 'no-reviews'}`}>
                    {analyst.review_count > 0 ? (
                      <>
                        {'★'.repeat(Math.round(analyst.average_rating))}
                        {'☆'.repeat(5 - Math.round(analyst.average_rating))}
                        <span className="rating-count">({analyst.review_count})</span>
                      </>
                    ) : (
                      <>☆ Нет отзывов</>
                    )}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </>
  );
}

export default AnalystsPage;
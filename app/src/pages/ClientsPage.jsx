import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import AuthHeader from '../components/AuthHeader';
import { apiFetch } from '../utils/api';
import './AnalystsPage.css';

function ClientsPage() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Основные фильтры (применяемые)
  const [filters, setFilters] = useState({
    industries: [],
    foundedMin: '',
    foundedMax: '',
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
    const fetchCompanies = async () => {
      try {
        const response = await apiFetch('/client/profiles');
        if (!response.ok) throw new Error('Ошибка загрузки');
        const data = await response.json();
        setCompanies(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCompanies();
  }, []);

  // Получаем список уникальных отраслей
  const allIndustries = useMemo(() => {
    const industrySet = new Set();
    companies.forEach(c => {
      if (c.industry) industrySet.add(c.industry);
    });
    return Array.from(industrySet).sort();
  }, [companies]);

  // Открытие модалки фильтров
  const openFilters = () => {
    setLocalFilters({ ...filters });
    setShowFilters(true);
  };

  // Применение фильтров
  const applyFilters = () => {
    setFilters(localFilters);
    setShowFilters(false);
  };

  // Сброс фильтров
  const resetFilters = () => {
    const empty = {
      industries: [],
      foundedMin: '',
      foundedMax: '',
      minRating: '',
    };
    setLocalFilters(empty);
    setFilters(empty);
    setShowFilters(false);
  };

  // Закрытие без сохранения
  const closeFilters = () => {
    setShowFilters(false);
  };

  // Обработчик изменения отраслей в локальных фильтрах
  const handleIndustryChange = (industry) => {
    setLocalFilters(prev => {
      const industries = prev.industries.includes(industry)
        ? prev.industries.filter(i => i !== industry)
        : [...prev.industries, industry];
      return { ...prev, industries };
    });
  };

  // Применение фильтров и сортировки
  const filteredAndSortedCompanies = useMemo(() => {
    let result = [...companies];

    // Фильтр по отраслям
    if (filters.industries.length > 0) {
      result = result.filter(c => filters.industries.includes(c.industry));
    }

    // Фильтр по году основания
    if (filters.foundedMin) {
      result = result.filter(c => c.founded_year >= parseInt(filters.foundedMin));
    }
    if (filters.foundedMax) {
      result = result.filter(c => c.founded_year <= parseInt(filters.foundedMax));
    }

    // Фильтр по минимальному рейтингу
    if (filters.minRating) {
      result = result.filter(c => c.average_rating >= parseFloat(filters.minRating));
    }

    // Сортировка
    result.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case 'rating':
          aVal = a.average_rating;
          bVal = b.average_rating;
          break;
        case 'name':
          aVal = a.company_name || '';
          bVal = b.company_name || '';
          break;
        case 'founded':
          aVal = a.founded_year || 0;
          bVal = b.founded_year || 0;
          break;
        default:
          return 0;
      }
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      } else {
        if (sortOrder === 'asc') return aVal - bVal;
        else return bVal - aVal;
      }
    });

    return result;
  }, [companies, filters, sortBy, sortOrder]);

  if (loading) return <div className="loading">Загрузка...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <>
      <AuthHeader />
      <div className="analysts-page container-wide">
        <div className="page-header">
          <h1 className="page-title">Заказчики</h1>
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
              <option value="name-asc">По названию (А→Я)</option>
              <option value="name-desc">По названию (Я→А)</option>
              <option value="founded-desc">По году основания (новые)</option>
              <option value="founded-asc">По году основания (старые)</option>
            </select>
          </div>
        </div>

        {showFilters && (
          <div className="modal-overlay" onClick={closeFilters}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Фильтры заказчиков</h3>
              <div className="filters-form">
                <div className="filter-group">
                  <label>Отрасль</label>
                  <div className="checkbox-group">
                    {allIndustries.length === 0 ? (
                      <p className="no-options">Нет доступных отраслей</p>
                    ) : (
                      allIndustries.map(ind => (
                        <label key={ind}>
                          <input
                            type="checkbox"
                            checked={localFilters.industries.includes(ind)}
                            onChange={() => handleIndustryChange(ind)}
                          />
                          {ind}
                        </label>
                      ))
                    )}
                  </div>
                </div>

                <div className="filter-group">
                  <label>Год основания</label>
                  <div className="range-inputs">
                    <input
                      type="number"
                      placeholder="От"
                      value={localFilters.foundedMin}
                      onChange={(e) => setLocalFilters({...localFilters, foundedMin: e.target.value})}
                      min="1900"
                      max={new Date().getFullYear()}
                    />
                    <input
                      type="number"
                      placeholder="До"
                      value={localFilters.foundedMax}
                      onChange={(e) => setLocalFilters({...localFilters, foundedMax: e.target.value})}
                      min="1900"
                      max={new Date().getFullYear()}
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
          {filteredAndSortedCompanies.length === 0 ? (
            <p className="no-results">Нет заказчиков, соответствующих фильтрам</p>
          ) : (
            filteredAndSortedCompanies.map((company) => (
              <Link to={`/client/profile/${company.user_id}`} key={company.id} className="analyst-card">
                <div className="card-avatar">
                  <img
                    src={company.logo ? `http://localhost:8000${company.logo}` : '/default-company.png'}
                    alt={company.company_name}
                  />
                </div>
                <div className="card-info">
                  <h3 className="card-name">{company.company_name}</h3>
                  {company.industry && <div className="card-specialization">{company.industry}</div>}
                  {company.founded_year && <div className="card-experience">Основана в {company.founded_year}</div>}
                  <div className={`card-rating ${company.review_count > 0 ? '' : 'no-reviews'}`}>
                    {company.review_count > 0 ? (
                      <>
                        {'★'.repeat(Math.round(company.average_rating))}
                        {'☆'.repeat(5 - Math.round(company.average_rating))}
                        <span className="rating-count">({company.review_count})</span>
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

export default ClientsPage;
import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import AuthHeader from '../components/AuthHeader';
import { apiFetch } from '../utils/api';
import './AnalystsPage.css'; // переиспользуем стили

function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Основные фильтры (применяемые)
  const [filters, setFilters] = useState({
    specializations: [],
    rateMin: '',
    rateMax: '',
    companyName: '',
  });

  // Локальные фильтры для модального окна
  const [localFilters, setLocalFilters] = useState({ ...filters });
  const [showFilters, setShowFilters] = useState(false);

  // Сортировка
  const [sortBy, setSortBy] = useState('rate');
  const [sortOrder, setSortOrder] = useState('asc'); // по умолчанию сначала дешёвые

  // Загрузка данных
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await apiFetch('/projects');
        if (!response.ok) throw new Error('Ошибка загрузки проектов');
        const data = await response.json();
        setProjects(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  // Получаем список уникальных специализаций из проектов
  const allSpecializations = useMemo(() => {
    const specSet = new Set();
    projects.forEach(project => {
      if (project.required_specializations) {
        project.required_specializations.forEach(s => specSet.add(s.specialization));
      }
    });
    return Array.from(specSet).sort();
  }, [projects]);

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
      specializations: [],
      rateMin: '',
      rateMax: '',
      companyName: '',
    };
    setLocalFilters(empty);
    setFilters(empty);
    setShowFilters(false);
  };

  // Закрытие без сохранения
  const closeFilters = () => {
    setShowFilters(false);
  };

  // Обработчик изменения специализаций в локальных фильтрах
  const handleSpecializationChange = (spec) => {
    setLocalFilters(prev => {
      const specs = prev.specializations.includes(spec)
        ? prev.specializations.filter(s => s !== spec)
        : [...prev.specializations, spec];
      return { ...prev, specializations: specs };
    });
  };

  // Вычисление минимальной ставки проекта (для сортировки и фильтрации)
  const getMinRate = (project) => {
    if (!project.required_specializations || project.required_specializations.length === 0) return null;
    return Math.min(...project.required_specializations.map(s => s.hourly_rate));
  };

  // Применение фильтров и сортировки
  const filteredAndSortedProjects = useMemo(() => {
    let result = [...projects];

    // Фильтр по специализациям
    if (filters.specializations.length > 0) {
      result = result.filter(project => {
        if (!project.required_specializations) return false;
        const projSpecs = project.required_specializations.map(s => s.specialization);
        return filters.specializations.some(spec => projSpecs.includes(spec));
      });
    }

    // Фильтр по названию компании
    if (filters.companyName.trim()) {
      const query = filters.companyName.toLowerCase().trim();
      result = result.filter(project =>
        project.company?.company_name?.toLowerCase().includes(query)
      );
    }

    // Фильтр по минимальной ставке
    result = result.filter(project => {
      const minRate = getMinRate(project);
      if (minRate === null) return false; // проекты без ставок не показываем
      if (filters.rateMin && minRate < parseInt(filters.rateMin)) return false;
      if (filters.rateMax && minRate > parseInt(filters.rateMax)) return false;
      return true;
    });

    // Сортировка
    result.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case 'rate':
          aVal = getMinRate(a) || 0;
          bVal = getMinRate(b) || 0;
          break;
        case 'name':
          aVal = a.title || '';
          bVal = b.title || '';
          break;
        case 'company':
          aVal = a.company?.company_name || '';
          bVal = b.company?.company_name || '';
          break;
        case 'date':
          aVal = a.created_at ? new Date(a.created_at) : new Date(0);
          bVal = b.created_at ? new Date(b.created_at) : new Date(0);
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
  }, [projects, filters, sortBy, sortOrder]);

  if (loading) return <div className="loading">Загрузка...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <>
      <AuthHeader />
      <div className="analysts-page container-wide">
        <div className="page-header">
          <h1 className="page-title">Все проекты</h1>
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
              <option value="rate-asc">По ставке (сначала дешёвые)</option>
              <option value="rate-desc">По ставке (сначала дорогие)</option>
              <option value="date-desc">Сначала новые</option>
              <option value="date-asc">Сначала старые</option>
              <option value="name-asc">По названию (А→Я)</option>
              <option value="name-desc">По названию (Я→А)</option>
              <option value="company-asc">По компании (А→Я)</option>
              <option value="company-desc">По компании (Я→А)</option>
            </select>
          </div>
        </div>

        {showFilters && (
          <div className="modal-overlay" onClick={closeFilters}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Фильтры проектов</h3>
              <div className="filters-form">
                <div className="filter-group">
                  <label>Специализации</label>
                  <div className="checkbox-group">
                    {allSpecializations.length === 0 ? (
                      <p className="no-options">Нет доступных специализаций</p>
                    ) : (
                      allSpecializations.map(spec => (
                        <label key={spec}>
                          <input
                            type="checkbox"
                            checked={localFilters.specializations.includes(spec)}
                            onChange={() => handleSpecializationChange(spec)}
                          />
                          {spec}
                        </label>
                      ))
                    )}
                  </div>
                </div>

                <div className="filter-group">
                  <label>Компания</label>
                  <input
                    type="text"
                    placeholder="Название компании"
                    value={localFilters.companyName}
                    onChange={(e) => setLocalFilters({...localFilters, companyName: e.target.value})}
                  />
                </div>

                <div className="filter-group">
                  <label>Минимальная ставка (₽/час)</label>
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

                <div className="filter-actions">
                  <button className="btn-clear" onClick={resetFilters}>Сбросить</button>
                  <button className="btn-apply" onClick={applyFilters}>Применить</button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="analysts-list">
          {filteredAndSortedProjects.length === 0 ? (
            <p className="no-results">Нет проектов, соответствующих фильтрам</p>
          ) : (
            filteredAndSortedProjects.map((project) => (
              <Link to={`/projects/${project.id}`} key={project.id} className="analyst-card">
                <div className="card-avatar">
                  <img
                    src={project.avatar ? `http://localhost:8000${project.avatar}` : '/default-project.png'}
                    alt={project.title}
                  />
                </div>
                <div className="card-info">
                  <h3 className="card-name">{project.title}</h3>
                  {project.company && (
                    <div className="company-mini">
                      <img
                        src={project.company.logo ? `http://localhost:8000${project.company.logo}` : '/default-company.png'}
                        alt={project.company.company_name}
                        className="company-mini-logo"
                      />
                      <span className="company-mini-name">{project.company.company_name}</span>
                    </div>
                  )}
                  {project.required_specializations && (
                    <div className="card-specialization">
                      {project.required_specializations.slice(0, 2).map(spec => spec.specialization).join(', ')}
                      {project.required_specializations.length > 2 && '...'}
                    </div>
                  )}
                  <div className="card-price">
                    от {Math.min(...project.required_specializations.map(s => s.hourly_rate))} ₽/час
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

export default ProjectsPage;
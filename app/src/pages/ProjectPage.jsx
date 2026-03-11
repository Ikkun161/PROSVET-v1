import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AuthHeader from '../components/AuthHeader';
import { apiFetch } from '../utils/api';
import './ProjectPage.css';

function ProjectPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [company, setCompany] = useState(null);
  const [companyRating, setCompanyRating] = useState({ average: 0, count: 0 });
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Текущий пользователь (если залогинен)
        const token = localStorage.getItem('token');
        if (token) {
          const userRes = await apiFetch('/users/me');
          if (userRes.ok) {
            const userData = await userRes.json();
            setCurrentUser(userData);
          }
        }

        // Данные проекта
        const projectRes = await apiFetch(`/projects/${id}`);
        if (!projectRes.ok) {
          if (projectRes.status === 404) {
            setError('Проект не найден');
          } else {
            const err = await projectRes.json();
            throw new Error(err.detail || 'Ошибка загрузки проекта');
          }
          setLoading(false);
          return;
        }
        const projectData = await projectRes.json();
        setProject(projectData);

        // Данные компании-создателя
        const companyRes = await apiFetch(`/client/profiles/user/${projectData.company_id}`);
        if (companyRes.ok) {
          const companyData = await companyRes.json();
          setCompany(companyData);
        }

        // Рейтинг компании
        const ratingRes = await apiFetch(`/company-reviews/company/${projectData.company_id}/rating`);
        if (ratingRes.ok) {
          const ratingData = await ratingRes.json();
          setCompanyRating(ratingData);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) return <div className="loading">Загрузка...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!project) return null;

  const isOwner = currentUser && currentUser.id === project.company_id && currentUser.role === 'client';
  const isAnalyst = currentUser && currentUser.role === 'analyst';

  const avatarUrl = project.avatar ? `http://localhost:8000${project.avatar}` : '/default-project.png';
  const companyLogoUrl = company?.logo ? `http://localhost:8000${company.logo}` : '/default-company.png';

  const getReviewsWord = (count) => {
    if (count % 10 === 1 && count % 100 !== 11) return 'отзыв';
    if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) return 'отзыва';
    return 'отзывов';
  };

  const handleRespond = () => {
    alert('Функция отклика будет доступна позже');
  };

  const handleViewResponses = () => {
    alert('Просмотр откликов (в разработке)');
  };

  const handleEdit = () => {
    // TODO: переход на страницу редактирования проекта
    alert('Редактирование проекта будет доступно позже');
  };

  return (
    <>
      <AuthHeader />
      <div className="project-page container-wide">
        <div className="project-header">
          <img src={avatarUrl} alt="проект" className="project-avatar" />
          <div className="project-header-info">
            <h1>{project.title}</h1>
            {company && (
              <div className="company-info">
                <img src={companyLogoUrl} alt={company.company_name} className="company-logo" />
                <div className="company-details">
                  <span className="company-name">{company.company_name}</span>
                  {companyRating.count > 0 ? (
                    <span className="company-rating">
                      {'★'.repeat(Math.round(companyRating.average))}
                      {'☆'.repeat(5 - Math.round(companyRating.average))}
                      <span className="rating-count">({companyRating.count})</span>
                    </span>
                  ) : (
                    <span className="company-rating no-reviews">☆ Нет отзывов</span>
                  )}
                </div>
              </div>
            )}
          </div>
          {isOwner && (
            <div className="project-actions">
              <button className="btn-edit" onClick={handleEdit}>
                Редактировать
              </button>
              <button className="btn-view-responses" onClick={handleViewResponses}>
                Посмотреть отклики
              </button>
            </div>
          )}
          {isAnalyst && !isOwner && (
            <button className="btn-respond" onClick={handleRespond}>
              Откликнуться
            </button>
          )}
        </div>

        {project.description && (
          <div className="project-description">
            <h3>Описание проекта</h3>
            <p>{project.description}</p>
          </div>
        )}

        {project.required_specializations && project.required_specializations.length > 0 && (
          <div className="specialists-section">
            <h3>Требуемые специалисты</h3>
            <div className="specialists-grid">
              {project.required_specializations.map((spec, index) => (
                <div key={index} className="specialist-card">
                  <h4>{spec.specialization}</h4>
                  <div className="specialist-price">{spec.hourly_rate} ₽/час</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default ProjectPage;
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom'; // добавили Link
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
  const [appliedSpecializations, setAppliedSpecializations] = useState([]);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [applyMessage, setApplyMessage] = useState('');
  const [applying, setApplying] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        let userData = null;
        if (token) {
          const userRes = await apiFetch('/users/me');
          if (userRes.ok) {
            userData = await userRes.json();
            setCurrentUser(userData);
          }
        }

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

        const companyRes = await apiFetch(`/client/profiles/user/${projectData.company_id}`);
        if (companyRes.ok) {
          const companyData = await companyRes.json();
          setCompany(companyData);
        }

        const ratingRes = await apiFetch(`/company-reviews/company/${projectData.company_id}/rating`);
        if (ratingRes.ok) {
          const ratingData = await ratingRes.json();
          setCompanyRating(ratingData);
        }

        if (userData && userData.role === 'analyst') {
          const myAppsRes = await apiFetch('/applications/my');
          if (myAppsRes.ok) {
            const myApps = await myAppsRes.json();
            const appsForThisProject = myApps.filter(app => app.project_id === projectData.id);
            setAppliedSpecializations(appsForThisProject.map(app => app.specialization));
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleApplyClick = (specialization) => {
    setSelectedSpecialization(specialization);
    setShowApplyForm(true);
    setApplyMessage('');
  };

  const handleApply = async (e) => {
    e.preventDefault();
    setApplying(true);
    try {
      const response = await apiFetch('/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: parseInt(id),
          specialization: selectedSpecialization,
          message: applyMessage || null,
        }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Ошибка отклика');
      }
      setAppliedSpecializations(prev => [...prev, selectedSpecialization]);
      setShowApplyForm(false);
      setNotification({ type: 'success', message: 'Отклик отправлен!' });
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setApplying(false);
    }
  };

  if (loading) return <div className="loading">Загрузка...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!project) return null;

  const isOwner = currentUser && currentUser.id === project.company_id && currentUser.role === 'client';
  const isAnalyst = currentUser && currentUser.role === 'analyst';

  const avatarUrl = project.avatar ? `http://localhost:8000${project.avatar}` : '/default-project.png';
  const companyLogoUrl = company?.logo ? `http://localhost:8000${company.logo}` : '/default-company.png';

  const handleViewResponses = () => {
    navigate(`/projects/${id}/applications`);
  };

  const handleEdit = () => {
    navigate(`/projects/${id}/edit`);
  };

  return (
    <>
      <AuthHeader />
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}
      <div className="project-page container-wide">
        <div className="project-header">
          <img src={avatarUrl} alt="проект" className="project-avatar" />
          <div className="project-header-info">
            <h1>{project.title}</h1>
            {company && (
              // Добавляем ссылку на профиль компании
              <Link to={`/client/profile/${project.company_id}`} className="company-link">
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
              </Link>
            )}
          </div>
          <div className="project-actions">
            {isOwner && (
              <>
                <button className="btn-edit" onClick={handleEdit}>
                  Редактировать
                </button>
                <button className="btn-view-responses" onClick={handleViewResponses}>
                  Посмотреть отклики
                </button>
              </>
            )}
          </div>
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
              {project.required_specializations.map((spec, index) => {
                const alreadyApplied = appliedSpecializations.includes(spec.specialization);
                return (
                  <div key={index} className="specialist-card">
                    <h4>{spec.specialization}</h4>
                    <div className="specialist-price">{spec.hourly_rate} ₽/час</div>
                    {isAnalyst && !isOwner && !alreadyApplied && (
                      <button
                        className="btn-respond-card"
                        onClick={() => handleApplyClick(spec.specialization)}
                      >
                        Откликнуться
                      </button>
                    )}
                    {isAnalyst && alreadyApplied && (
                      <div className="applied-badge">Вы уже откликнулись</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {showApplyForm && (
          <div className="apply-form">
            <h3>Отклик на вакансию: {selectedSpecialization}</h3>
            <form onSubmit={handleApply}>
              <textarea
                placeholder="Сообщение заказчику (необязательно)"
                value={applyMessage}
                onChange={(e) => setApplyMessage(e.target.value)}
                rows="3"
                className="apply-textarea"
              />
              <div className="form-actions">
                <button type="submit" disabled={applying}>
                  {applying ? 'Отправка...' : 'Отправить отклик'}
                </button>
                <button type="button" onClick={() => setShowApplyForm(false)}>Отмена</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </>
  );
}

export default ProjectPage;
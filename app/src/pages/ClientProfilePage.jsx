import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AuthHeader from '../components/AuthHeader';
import { apiFetch } from '../utils/api';
import './ProfilePage.css';

function ClientProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      const isMyProfile = id === 'my' || !id;

      try {
        if (isMyProfile) {
          // Свой профиль – нужен токен
          if (!token) {
            navigate('/login');
            return;
          }
          const profileRes = await apiFetch('/client/profiles/me');
          if (profileRes.status === 401) {
            setLoading(false);
            return;
          }
          if (profileRes.status === 404) {
            navigate('/client/profile/fill');
            return;
          }
          if (!profileRes.ok) {
            const err = await profileRes.json();
            throw new Error(err.detail || 'Ошибка загрузки профиля');
          }
          const profileData = await profileRes.json();
          setProfile(profileData);
          setIsOwnProfile(true);
          const companyId = profileData.user_id;
          if (companyId) {
            await loadReviews(companyId);
            await loadProjects(companyId);
          }
        } else {
          // Чужой профиль по ID
          const profileRes = await apiFetch(`/client/profiles/user/${id}`);
          if (profileRes.status === 404) {
            setError('Профиль компании не найден');
            setLoading(false);
            return;
          }
          if (!profileRes.ok) {
            const err = await profileRes.json();
            throw new Error(err.detail || 'Ошибка загрузки профиля');
          }
          const profileData = await profileRes.json();
          setProfile(profileData);
          setIsOwnProfile(false);
          await loadReviews(profileData.user_id);
          await loadProjects(profileData.user_id);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const loadReviews = async (companyId) => {
      const ratingRes = await apiFetch(`/company-reviews/company/${companyId}/rating`);
      if (ratingRes.ok) {
        const ratingData = await ratingRes.json();
        setAverageRating(ratingData.average);
        setReviewCount(ratingData.count);
      }
      const reviewsRes = await apiFetch(`/company-reviews/company/${companyId}`);
      if (reviewsRes.ok) {
        const reviewsData = await reviewsRes.json();
        setReviews(reviewsData);
      }
    };

    const loadProjects = async (companyId) => {
      const projectsRes = await apiFetch(`/projects/company/${companyId}`);
      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        setProjects(projectsData);
      }
    };

    fetchProfile();
  }, [id, navigate]);

  if (loading) return <div className="loading">Загрузка...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!profile) return null;

  const logoUrl = profile.logo
    ? `http://localhost:8000${profile.logo}`
    : '/default-company.png';

  const getReviewsWord = (count) => {
    if (count % 10 === 1 && count % 100 !== 11) return 'отзыв';
    if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) return 'отзыва';
    return 'отзывов';
  };

  const handleProjectClick = (projectId) => {
    navigate(`/projects/${projectId}`);
  };

  return (
    <>
      <AuthHeader />
      <div className="profile-page container">
        <div className="profile-header">
          <img src={logoUrl} alt="логотип" className="profile-avatar" />
          <div className="profile-header-info">
            <div className="profile-name-row">
              <h1>{profile.company_name}</h1>
              {reviewCount > 0 ? (
                <div className="profile-rating">
                  {'★'.repeat(Math.round(averageRating))}
                  {'☆'.repeat(5 - Math.round(averageRating))}
                  <span className="rating-count">({reviewCount} {getReviewsWord(reviewCount)})</span>
                </div>
              ) : (
                <div className="profile-rating no-reviews">☆ Нет отзывов</div>
              )}
            </div>
          </div>
          {isOwnProfile && (
            <div className="profile-actions">
              <button className="btn-edit" onClick={() => navigate('/client/profile/edit')}>
                Редактировать профиль
              </button>
              <button className="btn-create-project" onClick={() => navigate('/projects/create')}>
                Создать проект
              </button>
            </div>
          )}
        </div>

        <div className="profile-details">
          {profile.industry && (
            <div className="detail-row">
              <span className="detail-label">Сфера:</span>
              <span className="detail-value">{profile.industry}</span>
            </div>
          )}
          {profile.founded_year && (
            <div className="detail-row">
              <span className="detail-label">Год основания:</span>
              <span className="detail-value">{profile.founded_year}</span>
            </div>
          )}
          {profile.website && (
            <div className="detail-row">
              <span className="detail-label">Веб-сайт:</span>
              <span className="detail-value">
                <a href={profile.website} target="_blank" rel="noopener noreferrer">
                  {profile.website}
                </a>
              </span>
            </div>
          )}
        </div>

        <div className="profile-description">
          <h3>О компании</h3>
          <p>{profile.description || 'Информация не указана'}</p>
        </div>

        {/* Список проектов */}
        {projects.length > 0 && (
          <div className="projects-section">
            <h2 className="reviews-title">Проекты</h2>
            <div className="projects-list">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="project-card"
                  onClick={() => handleProjectClick(project.id)}
                >
                  <img
                    src={project.avatar ? `http://localhost:8000${project.avatar}` : '/default-project.png'}
                    alt={project.title}
                    className="project-avatar"
                  />
                  <div className="project-info">
                    <h3>{project.title}</h3>
                    {project.required_specializations && project.required_specializations.slice(0, 2).map((spec) => (
                      <div key={spec.specialization} className="project-spec">
                        {spec.specialization}: {spec.hourly_rate} ₽/час
                      </div>
                    ))}
                    {project.required_specializations?.length > 2 && <div className="project-spec">...</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Отзывы */}
       
      </div>
       <div className="reviews-section">
          <h2 className="reviews-title">
            Отзывы {reviewCount > 0 && `(${reviewCount})`}
          </h2>
          {reviews.length === 0 ? (
            <p className="no-reviews">Пока нет отзывов</p>
          ) : (
            <div className="reviews-list">
              {reviews.map((review) => (
                <div key={review.id} className="review-card">
                  <div className="review-header">
                    <span className="review-rating">
                      {'★'.repeat(Math.round(review.rating))}
                      {'☆'.repeat(5 - Math.round(review.rating))}
                    </span>
                    <span className="review-date">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="review-text">{review.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
    </>
  );
}

export default ClientProfilePage;
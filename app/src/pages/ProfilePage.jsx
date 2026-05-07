import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AuthHeader from '../components/AuthHeader';
import { apiFetch } from '../utils/api';
import './ProfilePage.css';

function ProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  // ----- Состояния для проектов -----
  const [projects, setProjects] = useState([]);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [projectForm, setProjectForm] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
  });
  const [savingProject, setSavingProject] = useState(false);
  // ---------------------------------

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      const isMyProfile = id === 'my' || !id;

      try {
        let analystId = null;

        if (isMyProfile) {
          if (!token) {
            navigate('/login');
            return;
          }

          const userRes = await apiFetch('/users/me');
          if (userRes.status === 401) {
            setLoading(false);
            return;
          }
          if (!userRes.ok) {
            const err = await userRes.json();
            throw new Error(err.detail || 'Не удалось получить данные пользователя');
          }
          const userData = await userRes.json();

          if (userData.role !== 'analyst') {
            setError('Этот раздел доступен только аналитикам');
            setLoading(false);
            return;
          }

          const profileRes = await apiFetch('/profiles/me');
          if (profileRes.status === 401) {
            setLoading(false);
            return;
          }
          if (profileRes.status === 404) {
            navigate('/profile/fill');
            return;
          }
          if (!profileRes.ok) {
            const err = await profileRes.json();
            throw new Error(err.detail || 'Ошибка загрузки профиля');
          }
          const profileData = await profileRes.json();
          setProfile(profileData);
          setIsOwnProfile(true);
          analystId = userData.id;

          // Загружаем проекты только для своего профиля (свой эндпоинт)
          fetchProjects();
        } else {
          // Чужой профиль – пока проекты не грузим, эндпоинт не реализован
          const profileRes = await apiFetch(`/profiles/user/${id}`);
          if (profileRes.status === 404) {
            setError('Профиль не найден');
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
          analystId = id;
          // Для чужих профилей проекты не показываем (пока нет публичного API)
          setProjects([]);
        }

        if (analystId) {
          const ratingRes = await apiFetch(`/reviews/analyst/${analystId}/rating`);
          if (ratingRes.ok) {
            const ratingData = await ratingRes.json();
            setAverageRating(ratingData.average);
            setReviewCount(ratingData.count);
          }

          const reviewsRes = await apiFetch(`/reviews/analyst/${analystId}`);
          if (reviewsRes.ok) {
            const reviewsData = await reviewsRes.json();
            setReviews(reviewsData);
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id, navigate]);

  // ----- Функции для работы с проектами (только для владельца) -----
  const fetchProjects = async () => {
    try {
      const res = await apiFetch('/analyst/projects');
      if (res.ok) {
        const data = await res.json();
        // Сортируем по дате начала (новые сверху)
        const sorted = data.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
        setProjects(sorted);
      }
    } catch (err) {
      console.error('Ошибка загрузки проектов', err);
    }
  };

  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    setSavingProject(true);
    const method = editingProject ? 'PUT' : 'POST';
    const url = editingProject ? `/analyst/projects/${editingProject.id}` : '/analyst/projects';
    const body = {
      title: projectForm.title,
      description: projectForm.description,
      start_date: projectForm.start_date || null,
      end_date: projectForm.end_date || null,
    };
    try {
      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        fetchProjects();
        setShowProjectModal(false);
        setEditingProject(null);
        setProjectForm({ title: '', description: '', start_date: '', end_date: '' });
      } else {
        const err = await res.json();
        alert(err.detail || 'Ошибка сохранения');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingProject(false);
    }
  };

  const editProject = (project) => {
    setEditingProject(project);
    setProjectForm({
      title: project.title,
      description: project.description || '',
      start_date: project.start_date || '',
      end_date: project.end_date || '',
    });
    setShowProjectModal(true);
  };

  const deleteProject = async (projectId) => {
    if (window.confirm('Удалить проект?')) {
      try {
        const res = await apiFetch(`/analyst/projects/${projectId}`, { method: 'DELETE' });
        if (res.ok) {
          fetchProjects();
        } else {
          alert('Ошибка удаления');
        }
      } catch (err) {
        alert(err.message);
      }
    }
  };
  // -----------------------------------------

  if (loading) return <div className="loading">Загрузка...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!profile) return null;

  const avatarUrl = profile.avatar
    ? `http://localhost:8000${profile.avatar}`
    : '/default-avatar.png';

  const getReviewsWord = (count) => {
    if (count % 10 === 1 && count % 100 !== 11) return 'отзыв';
    if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) return 'отзыва';
    return 'отзывов';
  };

  const topProjects = projects.slice(0, 3);
  const hasMoreProjects = projects.length >= 1;

  return (
    <>
      <AuthHeader />
      <div className="profile-page container">
        <div className="profile-header">
          <img src={avatarUrl} alt="аватар" className="profile-avatar" />
          <div className="profile-header-info">
            <div className="profile-name-row">
              <h1>{profile.full_name}</h1>
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
              <button className="btn-edit" onClick={() => navigate('/profile/edit')}>
                Редактировать профиль
              </button>
              <button className="btn-portfolio" onClick={() => navigate('/portfolio')}>
                Портфолио
              </button>
            </div>
          )}
        </div>

        <div className="profile-details">
          <div className="detail-row">
            <span className="detail-label">Специализация:</span>
            <span className="detail-value">{profile.specialization}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Опыт:</span>
            <span className="detail-value">{profile.experience || 'не указано'} лет</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Портфолио (ссылка):</span>
            <span className="detail-value">
              {profile.portfolio ? (
                <a href={profile.portfolio} target="_blank" rel="noopener noreferrer">
                  {profile.portfolio}
                </a>
              ) : 'не указано'}
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Ставка (₽/час):</span>
            <span className="detail-value">{profile.hourly_rate || 'не указано'}</span>
          </div>
        </div>

        <div className="profile-description">
          <h3>О себе</h3>
          <p>{profile.description || 'Пока ничего не рассказано'}</p>
        </div>

        {/* Блок проектов – показываем только если есть проекты или владелец */}
        {(isOwnProfile || projects.length > 0) && (
          <div className="profile-projects-section">
            <div className="projects-header">
              <h3>{isOwnProfile ? 'Мои проекты' : 'Кейсы аналитика'}</h3>
              {isOwnProfile && (
                <button
                  className="btn-add-project"
                  onClick={() => {
                    setEditingProject(null);
                    setProjectForm({ title: '', description: '', start_date: '', end_date: '' });
                    setShowProjectModal(true);
                  }}
                >
                  + Добавить проект
                </button>
              )}
            </div>

            {projects.length === 0 && isOwnProfile && <p className="no-projects">Проекты еще не добавлены</p>}

            <div className="projects-list">
              {topProjects.map(project => (
                <div key={project.id} className="project-item">
                  <div className="project-header-row">
                    <h4>{project.title}</h4>
                    
                  </div>

                  {project.category && (
                    <div className="project-category-tag">
                      {project.category}
                    </div>
                  )}

                  <p className="project-description">{project.description}</p>

                  <div className="project-dates">
                    {project.start_date && <span>с {project.start_date}</span>}
                    {project.end_date ? <span> по {project.end_date}</span> : <span> (текущий проект)</span>}
                  </div>
                </div>
              ))}
            </div>

            {hasMoreProjects && (
              <button className="btn-show-all" onClick={() => navigate('/portfolio')}>
                Показать все проекты ({projects.length})
              </button>
            )}
          </div>
        )}

        {/* Отзывы */}
        <div className="profile-reviews-card">
          <h2 className="reviews-title">
            Отзывы {reviewCount > 0 && `(${reviewCount})`}
          </h2>
          {reviews.length === 0 ? (
            <p className="no-reviews">Пока нет отзывов</p>
          ) : (
            <div className="reviews-list">
              {reviews.map((review) => (
                <div key={review.id} className="review-item">
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
      </div>

      {/* Модальное окно для проектов (только для владельца) */}
      {showProjectModal && (
        <div className="modal-overlay" onClick={() => setShowProjectModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowProjectModal(false)}>×</button>
            <h3>{editingProject ? 'Редактировать проект' : 'Новый проект'}</h3>
            <form onSubmit={handleProjectSubmit}>
              <div className="form-group">
                <label>Название проекта *</label>
                <input
                  type="text"
                  value={projectForm.title}
                  onChange={(e) => setProjectForm({...projectForm, title: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Описание (модель определит категорию автоматически)</label>
                <textarea
                  rows="4"
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({...projectForm, description: e.target.value})}
                  placeholder="Расскажите, что вы делали в этом проекте..."
                />
              </div>
              <div className="form-group-row" style={{display: 'flex', gap: '15px'}}>
                <div className="form-group" style={{flex: 1}}>
                  <label>Дата начала</label>
                  <input
                    type="date"
                    value={projectForm.start_date}
                    onChange={(e) => setProjectForm({...projectForm, start_date: e.target.value})}
                  />
                </div>
                <div className="form-group" style={{flex: 1}}>
                  <label>Дата окончания</label>
                  <input
                    type="date"
                    value={projectForm.end_date}
                    onChange={(e) => setProjectForm({...projectForm, end_date: e.target.value})}
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn-save" disabled={savingProject}>
                  {savingProject ? 'Сохранение...' : 'Сохранить проект'}
                </button>
                <button type="button" className="btn-cancel" onClick={() => setShowProjectModal(false)}>Отмена</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default ProfilePage;
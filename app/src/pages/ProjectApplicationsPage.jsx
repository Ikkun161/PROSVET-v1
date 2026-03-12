import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom'; // добавляем Link
import AuthHeader from '../components/AuthHeader';
import { apiFetch } from '../utils/api';
import './ProfilePage.css';

function ProjectApplicationsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [projectTitle, setProjectTitle] = useState('');

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const projectRes = await apiFetch(`/projects/${id}`);
        if (!projectRes.ok) throw new Error('Проект не найден');
        const projectData = await projectRes.json();
        setProjectTitle(projectData.title);

        const res = await apiFetch(`/applications/project/${id}`);
        if (!res.ok) throw new Error('Ошибка загрузки откликов');
        const data = await res.json();
        setApplications(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, [id]);

  const handleStatusChange = async (appId, newStatus) => {
    try {
      const res = await apiFetch(`/applications/${appId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Ошибка изменения статуса');
      }
      const updated = await res.json();
      setApplications(prev =>
        prev.map(app => app.id === appId ? { ...app, status: updated.status } : app)
      );
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="loading">Загрузка...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <>
      <AuthHeader />
      <div className="profile-page container">
        <h2 className="reviews-title">Отклики на проект «{projectTitle}»</h2>
        {applications.length === 0 ? (
          <p className="no-reviews">Пока нет откликов</p>
        ) : (
          <div className="reviews-list">
            {applications.map(app => (
              <div key={app.id} className="review-card" style={{ display: 'block' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {/* Ссылка на профиль аналитика через аватарку */}
                  <Link to={`/profile/${app.analyst_id}`}>
                    <img
                      src={app.analyst.avatar ? `http://localhost:8000${app.analyst.avatar}` : '/default-avatar.png'}
                      alt={app.analyst.full_name}
                      style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', cursor: 'pointer' }}
                    />
                  </Link>
                  <div style={{ flex: 1 }}>
                    {/* Ссылка на профиль аналитика через имя */}
                    <Link to={`/profile/${app.analyst_id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <h4 style={{ margin: 0, cursor: 'pointer' }}>{app.analyst.full_name}</h4>
                    </Link>
                    <p style={{ margin: '4px 0' }}>{app.analyst.specialization}</p>
                    <div className="profile-rating">
                      {'★'.repeat(Math.round(app.analyst.average_rating))}
                      {'☆'.repeat(5 - Math.round(app.analyst.average_rating))}
                      <span className="rating-count">({app.analyst.review_count})</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      backgroundColor: app.status === 'pending' ? '#FFD966' : app.status === 'accepted' ? '#B6D7A8' : '#F4B0B0',
                      color: '#333',
                      fontWeight: 'bold'
                    }}>
                      {app.status === 'pending' ? 'Ожидает' : app.status === 'accepted' ? 'Принят' : 'Отклонён'}
                    </span>
                    {app.message && <p style={{ marginTop: '8px', fontStyle: 'italic' }}>Сообщение: {app.message}</p>}
                    {app.status === 'pending' && (
                      <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                        <button className="btn-edit" onClick={() => handleStatusChange(app.id, 'accepted')}>
                          Принять
                        </button>
                        <button className="btn-edit" style={{ backgroundColor: '#999' }} onClick={() => handleStatusChange(app.id, 'rejected')}>
                          Отклонить
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default ProjectApplicationsPage;
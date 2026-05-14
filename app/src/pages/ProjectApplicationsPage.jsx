import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AuthHeader from '../components/AuthHeader';
import { apiFetch } from '../utils/api';
import styles from './ProjectApplicationsPage.module.css'; // ← модуль

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
        // Сортировка по убыванию matching_score
        const sorted = data.sort((a, b) => b.matching_score - a.matching_score);
        setApplications(sorted);
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

  // Определяем класс для карточки в зависимости от индекса (топ-3)
  const getTopClass = (index) => {
    if (index === 0) return styles['top1'];
    if (index === 1) return styles['top2'];
    if (index === 2) return styles['top3'];
    return '';
  };

  if (loading) return <div className={styles.loading}>Загрузка...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <>
      <AuthHeader />
      <div className={`${styles.page} container`}>
        <h2 className={styles.title}>Отклики на проект «{projectTitle}»</h2>
        {applications.length === 0 ? (
          <p className={styles['no-applications']}>Пока нет откликов</p>
        ) : (
          <div className={styles.list}>
            {applications.map((app, index) => {
              const topClass = getTopClass(index);
              return (
                <div key={app.id} className={`${styles.card} ${topClass}`}>
                  <div className={styles.cardInner}>
                    {/* Аватар со ссылкой */}
                    <Link to={`/profile/${app.analyst_id}`} className={styles.avatarLink}>
                      <img
                        src={
                          app.analyst.avatar
                            ? `http://localhost:8000${app.analyst.avatar}`
                            : '/default-avatar.png'
                        }
                        alt={app.analyst.full_name}
                        className={styles.avatar}
                      />
                    </Link>

                    {/* Информация об аналитике */}
                    <div className={styles.info}>
                      <Link to={`/profile/${app.analyst_id}`} className={styles.nameLink}>
                        <h4 className={styles.name}>{app.analyst.full_name}</h4>
                      </Link>
                      <p className={styles.specialization}>{app.analyst.specialization}</p>
                      <div className={styles.rating}>
                        {'★'.repeat(Math.round(app.analyst.average_rating))}
                        {'☆'.repeat(5 - Math.round(app.analyst.average_rating))}
                        <span className={styles.ratingCount}>({app.analyst.review_count})</span>
                      </div>
                      <div className={styles.matchingScore}>
                        Matching Score: {app.matching_score}
                      </div>
                    </div>

                    {/* Статус и кнопки управления */}
                    <div className={styles.actions}>
                      <span
                        className={`${styles.statusBadge} ${
                          app.status === 'pending'
                            ? styles.statusPending
                            : app.status === 'accepted'
                            ? styles.statusAccepted
                            : styles.statusRejected
                        }`}
                      >
                        {app.status === 'pending'
                          ? 'Ожидает'
                          : app.status === 'accepted'
                          ? 'Принят'
                          : 'Отклонён'}
                      </span>
                      {app.message && (
                        <p className={styles.message}>Сообщение: {app.message}</p>
                      )}
                      {app.status === 'pending' && (
                        <div className={styles.buttons}>
                          <button
                            className={styles.acceptBtn}
                            onClick={() => handleStatusChange(app.id, 'accepted')}
                          >
                            Принять
                          </button>
                          <button
                            className={styles.rejectBtn}
                            onClick={() => handleStatusChange(app.id, 'rejected')}
                          >
                            Отклонить
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

export default ProjectApplicationsPage;
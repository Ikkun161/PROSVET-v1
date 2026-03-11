import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AuthHeader from '../components/AuthHeader';
import './AnalystsPage.css';

function AnalystsPage() {
  const [analysts, setAnalysts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  if (loading) return <div className="loading">Загрузка...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <>
      <AuthHeader />
      <div className="analysts-page container-wide">
        <h1 className="page-title">Аналитики</h1>
        <div className="analysts-list">
          {analysts.map((analyst) => (
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
          ))}
        </div>
      </div>
    </>
  );
}

export default AnalystsPage;
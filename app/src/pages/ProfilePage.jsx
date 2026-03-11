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
        } else {
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
            <button className="btn-edit" onClick={() => navigate('/profile/edit')}>
              Редактировать профиль
            </button>
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
            <span className="detail-label">Портфолио:</span>
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
      </div>

      {/* Отзывы – используем классы, соответствующие CSS */}
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
    </>
  );
}

export default ProfilePage;
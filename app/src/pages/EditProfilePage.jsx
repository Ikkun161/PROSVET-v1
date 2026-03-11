import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthHeader from '../components/AuthHeader';
import './AuthPages.css';

const SPECIALIZATIONS = [
  'Бизнес-аналитик',
  'Data Scientist',
  'Data Engineer',
  'Аналитик данных',
  'Системный аналитик',
  'BI-аналитик',
];

// Компонент модального окна
function AvatarModal({ isOpen, onClose, onConfirm, previewUrl, uploading }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h3>Предпросмотр фото</h3>
        <div className="modal-preview-container">
          <img src={previewUrl} alt="preview" className="modal-preview" />
        </div>
        <p className="modal-hint">Как будет выглядеть ваше фото в профиле</p>
        <div className="modal-actions">
          <button
            className="btn-confirm"
            onClick={onConfirm}
            disabled={uploading}
          >
            {uploading ? 'Загрузка...' : 'Сохранить фото'}
          </button>
          <button
            className="btn-cancel"
            onClick={onClose}
            disabled={uploading}
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}

function EditProfilePage() {
  const [formData, setFormData] = useState({
    full_name: '',
    specialization: '',
    experience: '',
    description: '',
    portfolio: '',
    hourly_rate: '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      try {
        const res = await fetch('http://localhost:8000/profiles/me', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setFormData({
            full_name: data.full_name || '',
            specialization: data.specialization || '',
            experience: data.experience || '',
            description: data.description || '',
            portfolio: data.portfolio || '',
            hourly_rate: data.hourly_rate || '',
          });
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSpecializationSelect = (spec) => {
    setFormData(prev => ({ ...prev, specialization: spec }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      setModalOpen(true); // открываем модалку
      setUploadSuccess('');
      // сбрасываем input, чтобы можно было выбрать тот же файл повторно
      e.target.value = '';
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;

    setUploading(true);
    setUploadSuccess('');
    setError('');

    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', avatarFile);

    try {
      const response = await fetch('http://localhost:8000/profiles/avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Ошибка загрузки фото');
      }

      setUploadSuccess('Фото успешно сохранено!');
      setModalOpen(false);
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    // если нужно сбросить превью при отмене – раскомментируй:
    // setAvatarPreview(null);
    // setAvatarFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:8000/profiles/me', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: formData.full_name,
          specialization: formData.specialization,
          experience: formData.experience ? parseInt(formData.experience) : null,
          description: formData.description,
          portfolio: formData.portfolio,
          hourly_rate: formData.hourly_rate ? parseInt(formData.hourly_rate) : null,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Ошибка сохранения');
      }

      navigate('/profile');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AuthHeader />
      <div className="auth-page">
        <div className="auth-container">
          <h2 className="auth-subtitle">Редактирование профиля</h2>

          {/* Блок загрузки фото (без превью, только выбор) */}
          <div className="avatar-upload-section">
            <div className="avatar-selector">
              <p className="avatar-label">Загрузить новое фото</p>
              <input
                type="file"
                id="avatar-upload"
                accept="image/*"
                onChange={handleAvatarChange}
                className="avatar-input"
              />
              {uploadSuccess && <p className="success-message">{uploadSuccess}</p>}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Поля формы (без изменений) */}
            <div className="form-group">
              <label htmlFor="full_name">Полное имя</label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Специализация</label>
              <div className="specialization-grid">
                {SPECIALIZATIONS.map((spec) => (
                  <button
                    key={spec}
                    type="button"
                    className={`spec-button ${formData.specialization === spec ? 'selected' : ''}`}
                    onClick={() => handleSpecializationSelect(spec)}
                  >
                    {spec}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="experience">Опыт (лет)</label>
              <input
                type="number"
                id="experience"
                name="experience"
                min="0"
                value={formData.experience}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Описание</label>
              <textarea
                id="description"
                name="description"
                rows="4"
                value={formData.description}
                onChange={handleChange}
                className="auth-textarea"
              />
            </div>

            <div className="form-group">
              <label htmlFor="portfolio">Ссылка на портфолио</label>
              <input
                type="url"
                id="portfolio"
                name="portfolio"
                value={formData.portfolio}
                onChange={handleChange}
                pattern="https?://.*"
                title="Введите ссылку, начинающуюся с http:// или https://"
              />
            </div>

            <div className="form-group">
              <label htmlFor="hourly_rate">Почасовая ставка (₽)</label>
              <input
                type="number"
                id="hourly_rate"
                name="hourly_rate"
                min="0"
                value={formData.hourly_rate}
                onChange={handleChange}
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
            <button type="button" className="btn-skip" onClick={() => navigate('/profile')}>
              Отмена
            </button>
          </form>
        </div>
      </div>

      {/* Модальное окно */}
      <AvatarModal
        isOpen={modalOpen}
        onClose={closeModal}
        onConfirm={handleAvatarUpload}
        previewUrl={avatarPreview}
        uploading={uploading}
      />
    </>
  );
}

export default EditProfilePage;
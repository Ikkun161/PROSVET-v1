import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import regLogo from '../img/logo-reglog.svg';
import './AuthPages.css';

// Варианты специализаций
const SPECIALIZATIONS = [
    'Бизнес-аналитик',
    'Data Scientist',
    'Data Engineer',
    'Аналитик данных',
    'Системный аналитик',
    'BI-аналитик',
];

function ProfileFillPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    specialization: '',
    experience: '',
    description: '',
    portfolio: '',
    hourlyRate: '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const totalSteps = 7;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSpecializationSelect = (spec) => {
    setFormData(prev => ({ ...prev, specialization: spec }));
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);
  const skipStep = () => {
    if (step === totalSteps) {
      navigate('/profile/my');
    } else {
      setStep(prev => prev + 1);
    }
  };

  const handleSubmitProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:8000/profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: formData.fullName,
          specialization: formData.specialization,
          experience: formData.experience ? parseInt(formData.experience) : null,
          description: formData.description,
          portfolio: formData.portfolio,
          hourly_rate: formData.hourlyRate ? parseInt(formData.hourlyRate) : null,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Ошибка сохранения профиля');
      }

      // Переходим к шагу загрузки фото
      setStep(7);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadAvatar = async () => {
    if (!avatarFile) {
      navigate('/dashboard');
      return;
    }
    setLoading(true);
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
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 1: return formData.fullName.trim() !== '';
      case 2: return formData.specialization !== '';
      default: return true;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="profile-step">
            <div className="form-group">
              <label htmlFor="fullName">Полное имя</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                placeholder="Иван Иванов"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
              <p className="field-hint">Заказчики будут видеть это как ваше имя или псевдоним</p>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="profile-step">
            <label>Специализация</label>
            <div className="specialization-grid">
              {SPECIALIZATIONS.map(spec => (
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
        );
      case 3:
        return (
          <div className="profile-step">
            <div className="form-group">
              <label htmlFor="experience">Опыт работы (лет)</label>
              <input
                type="number"
                id="experience"
                name="experience"
                min="0"
                max="50"
                placeholder="например, 3"
                value={formData.experience}
                onChange={handleChange}
              />
            </div>
          </div>
        );
      case 4:
        return (
          <div className="profile-step">
            <div className="form-group">
              <label htmlFor="description">Опишите свой опыт работы</label>
              <textarea
                id="description"
                name="description"
                rows="4"
                placeholder="Расскажите о своих проектах, достижениях, навыках..."
                value={formData.description}
                onChange={handleChange}
                className="auth-textarea"
              />
            </div>
          </div>
        );
      case 5:
        return (
          <div className="profile-step">
            <div className="form-group">
              <label htmlFor="portfolio">Ссылка на портфолио</label>
              <input
                type="url"
                id="portfolio"
                name="portfolio"
                placeholder="https://github.com/..."
                value={formData.portfolio}
                onChange={handleChange}
                pattern="https?://.*"
                title="Введите ссылку, начинающуюся с http:// или https://"
              />
            </div>
          </div>
        );
      case 6:
        return (
          <div className="profile-step">
            <div className="form-group">
              <label htmlFor="hourlyRate">Минимальная почасовая ставка (₽)</label>
              <input
                type="number"
                id="hourlyRate"
                name="hourlyRate"
                min="0"
                placeholder="например, 2000"
                value={formData.hourlyRate}
                onChange={handleChange}
              />
            </div>
          </div>
        );
      case 7:
        return (
          <div className="profile-step">
            <label>Фотография профиля (необязательно)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                setAvatarFile(file);
                setAvatarPreview(URL.createObjectURL(file));
              }}
            />
            {avatarPreview && (
              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <img
                  src={avatarPreview}
                  alt="Preview"
                  style={{
                    width: '150px',
                    height: '150px',
                    objectFit: 'cover',
                    borderRadius: '50%',
                    border: '2px solid #ED6C4F'
                  }}
                />
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const renderNavigation = () => {
    if (step < totalSteps) {
      return (
        <div className="step-navigation-grid">
          {step > 1 ? (
            <button type="button" className="btn-back" onClick={prevStep}>Назад</button>
          ) : <div className="nav-placeholder" />}
          <button type="button" className="btn-skip-orange" onClick={skipStep}>Пропустить</button>
          <button
            type="button"
            className="btn-next"
            onClick={step === 6 ? handleSubmitProfile : nextStep}
            disabled={step <= 6 && !isStepValid()}
          >
            {step === 6 ? 'Сохранить профиль' : 'Далее'}
          </button>
        </div>
      );
    } else {
      // Шаг 7
      return (
        <div className="step-navigation-grid">
          <button type="button" className="btn-back" onClick={prevStep}>Назад</button>
          <button type="button" className="btn-skip-orange" onClick={skipStep}>Пропустить</button>
          <button
            type="button"
            className="btn-next"
            onClick={handleUploadAvatar}
            disabled={loading}
          >
            {loading ? 'Загрузка...' : 'Сохранить фото'}
          </button>
        </div>
      );
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container profile-container">
        <img src={regLogo} alt="ПРОСВЕТ" className="auth-logo" />
        <p className="auth-subtitle">Заполните профиль</p>
        <p className="auth-subtitle" style={{ fontSize: '18px', marginTop: '-15px', marginBottom: '20px' }}>
          Шаг {step} из {totalSteps}
        </p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={(e) => e.preventDefault()}>
          {renderStep()}
          {renderNavigation()}
        </form>
      </div>
    </div>
  );
}

export default ProfileFillPage;
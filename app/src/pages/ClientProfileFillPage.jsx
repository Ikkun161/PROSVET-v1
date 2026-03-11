import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthHeader from '../components/AuthHeader';
import { apiFetch } from '../utils/api';
import './AuthPages.css';

function ClientProfileFillPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    company_name: '',
    description: '',
    website: '',
    industry: '',
    founded_year: '',
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);
  const skipStep = () => setStep(prev => prev + 1);

  const handleSubmitProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiFetch('/client/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: formData.company_name,
          description: formData.description,
          website: formData.website,
          industry: formData.industry,
          founded_year: formData.founded_year ? parseInt(formData.founded_year) : null,
        }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Ошибка сохранения профиля');
      }
      setStep(4); // переходим к шагу загрузки логотипа
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadLogo = async () => {
    if (!logoFile) {
      navigate('/client/profile/my');
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append('file', logoFile);
    try {
      const response = await apiFetch('/client/profiles/logo', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Ошибка загрузки логотипа');
      }
      navigate('/client/profile/my');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 1: return formData.company_name.trim() !== '';
      default: return true;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="profile-step">
            <div className="form-group">
              <label htmlFor="company_name">Название компании *</label>
              <input
                type="text"
                id="company_name"
                name="company_name"
                placeholder="ООО «Ромашка»"
                value={formData.company_name}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="profile-step">
            <div className="form-group">
              <label htmlFor="description">Описание компании</label>
              <textarea
                id="description"
                name="description"
                rows="4"
                placeholder="Расскажите о вашей компании..."
                value={formData.description}
                onChange={handleChange}
                className="auth-textarea"
              />
            </div>
            <div className="form-group">
              <label htmlFor="website">Веб-сайт</label>
              <input
                type="url"
                id="website"
                name="website"
                placeholder="https://example.com"
                value={formData.website}
                onChange={handleChange}
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="profile-step">
            <div className="form-group">
              <label htmlFor="industry">Сфера деятельности</label>
              <input
                type="text"
                id="industry"
                name="industry"
                placeholder="например, IT, ритейл, производство"
                value={formData.industry}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="founded_year">Год основания</label>
              <input
                type="number"
                id="founded_year"
                name="founded_year"
                min="1900"
                max={new Date().getFullYear()}
                placeholder="2020"
                value={formData.founded_year}
                onChange={handleChange}
              />
            </div>
          </div>
        );
      case 4:
        return (
          <div className="profile-step">
            <label>Логотип компании (необязательно)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
            />
            {logoPreview && (
              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <img
                  src={logoPreview}
                  alt="preview"
                  style={{
                    width: '150px',
                    height: '150px',
                    objectFit: 'cover',
                    borderRadius: '8px',
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

  const totalSteps = 4;

  return (
    <>
      <AuthHeader />
      <div className="auth-page">
        <div className="auth-container">
          <h2 className="auth-subtitle">Заполните профиль компании</h2>
          <p className="auth-subtitle" style={{ fontSize: '18px', marginBottom: '20px' }}>
            Шаг {step} из {totalSteps}
          </p>
          <form onSubmit={(e) => e.preventDefault()}>
            {renderStep()}
            {error && <div className="error-message">{error}</div>}
            <div className="step-navigation">
              {step > 1 && (
                <button type="button" className="btn-secondary" onClick={prevStep}>
                  Назад
                </button>
              )}
              {step < totalSteps && (
                <>
                  <button type="button" className="btn-skip" onClick={skipStep}>
                    Пропустить
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={step === totalSteps - 1 ? handleSubmitProfile : nextStep}
                    disabled={!isStepValid()}
                  >
                    {step === totalSteps - 1 ? 'Сохранить профиль' : 'Далее'}
                  </button>
                </>
              )}
              {step === totalSteps && (
                <>
                  <button type="button" className="btn-secondary" onClick={prevStep}>
                    Назад
                  </button>
                  <button type="button" className="btn-skip" onClick={() => navigate('/client/profile/my')}>
                    Пропустить
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleUploadLogo}
                    disabled={loading}
                  >
                    {loading ? 'Загрузка...' : 'Сохранить логотип'}
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default ClientProfileFillPage;
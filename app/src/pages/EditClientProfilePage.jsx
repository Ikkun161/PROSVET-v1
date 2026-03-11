import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthHeader from '../components/AuthHeader';
import { apiFetch } from '../utils/api';
import './AuthPages.css';

// Компонент модального окна для подтверждения логотипа
function LogoModal({ isOpen, onClose, onConfirm, previewUrl, uploading }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h3>Предпросмотр логотипа</h3>
        <div className="modal-preview-container">
          <img src={previewUrl} alt="preview" className="modal-preview" />
        </div>
        <p className="modal-hint">Как будет выглядеть логотип компании в профиле</p>
        <div className="modal-actions">
          <button
            className="btn-confirm"
            onClick={onConfirm}
            disabled={uploading}
          >
            {uploading ? 'Загрузка...' : 'Сохранить логотип'}
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

function EditClientProfilePage() {
  const [formData, setFormData] = useState({
    company_name: '',
    description: '',
    website: '',
    industry: '',
    founded_year: '',
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      try {
        const response = await apiFetch('/client/profiles/me');
        if (response.status === 401) return;
        if (response.ok) {
          const data = await response.json();
          setFormData({
            company_name: data.company_name || '',
            description: data.description || '',
            website: data.website || '',
            industry: data.industry || '',
            founded_year: data.founded_year || '',
          });
          if (data.logo) {
            setLogoPreview(`http://localhost:8000${data.logo}`);
          }
        } else if (response.status === 404) {
          navigate('/client/profile/fill');
        } else {
          const err = await response.json();
          throw new Error(err.detail || 'Ошибка загрузки');
        }
      } catch (err) {
        setError(err.message);
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
      setModalOpen(true);
      e.target.value = ''; // сбрасываем input
    }
  };

  const handleLogoUpload = async () => {
    if (!logoFile) return;

    setUploading(true);
    setError('');

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

      setModalOpen(false);
      setLogoFile(null);
      // обновим превью с сервера? оставим как есть, т.к. уже показываем
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setLogoFile(null);
    setLogoPreview(null); // если хотим убрать превью при отмене
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await apiFetch('/client/profiles/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: formData.company_name,
          description: formData.description,
          website: formData.website,
          industry: formData.industry,
          founded_year: formData.founded_year ? parseInt(formData.founded_year) : null,
        }),
      });
      if (response.status === 401) return;
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Ошибка сохранения');
      }
      navigate('/client/profile/my');
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
          <h2 className="auth-subtitle">Редактирование профиля компании</h2>

          {/* Блок загрузки логотипа */}
          <div className="avatar-upload-section">
            <div className="avatar-selector">
              <p className="avatar-label">Логотип компании</p>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
              />
              {logoPreview && !modalOpen && (
                <div style={{ marginTop: '10px' }}>
                  <img
                    src={logoPreview}
                    alt="logo preview"
                    style={{
                      width: '100px',
                      height: '100px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      border: '2px solid #ED6C4F'
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="company_name">Название компании *</label>
              <input
                type="text"
                id="company_name"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="description">Описание компании</label>
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
              <label htmlFor="website">Веб-сайт</label>
              <input
                type="url"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="industry">Сфера деятельности</label>
              <input
                type="text"
                id="industry"
                name="industry"
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
                value={formData.founded_year}
                onChange={handleChange}
              />
            </div>
            {error && <div className="error-message">{error}</div>}
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
            <button type="button" className="btn-skip" onClick={() => navigate('/client/profile/my')}>
              Отмена
            </button>
          </form>
        </div>
      </div>

      <LogoModal
        isOpen={modalOpen}
        onClose={closeModal}
        onConfirm={handleLogoUpload}
        previewUrl={logoPreview}
        uploading={uploading}
      />
    </>
  );
}

export default EditClientProfilePage;
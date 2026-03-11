import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthHeader from '../components/AuthHeader';
import { apiFetch } from '../utils/api';
import './AuthPages.css';

// Список доступных специализаций (можно вынести в отдельный файл)
const SPECIALIZATIONS = [
  'Бизнес-аналитик',
  'Data Scientist',
  'Data Engineer',
  'Аналитик данных',
  'Системный аналитик',
  'BI-аналитик',
];

function ProjectCreatePage() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    required_specializations: [{ specialization: '', hourly_rate: '' }],
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSpecChange = (index, field, value) => {
    const newSpecs = [...formData.required_specializations];
    newSpecs[index][field] = value;
    setFormData(prev => ({ ...prev, required_specializations: newSpecs }));
  };

  const addSpec = () => {
    setFormData(prev => ({
      ...prev,
      required_specializations: [...prev.required_specializations, { specialization: '', hourly_rate: '' }]
    }));
  };

  const removeSpec = (index) => {
    if (formData.required_specializations.length > 1) {
      const newSpecs = formData.required_specializations.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, required_specializations: newSpecs }));
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Фильтруем незаполненные специализации и преобразуем hourly_rate в число
    const specs = formData.required_specializations
      .filter(s => s.specialization.trim() !== '' && s.hourly_rate !== '')
      .map(s => ({
        specialization: s.specialization,
        hourly_rate: parseInt(s.hourly_rate)
      }));

    const projectData = {
      title: formData.title,
      description: formData.description || null,
      required_specializations: specs.length > 0 ? specs : null
    };

    try {
      // Создаём проект
      const res = await apiFetch('/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Ошибка создания проекта');
      }
      const project = await res.json();

      // Если есть аватар, загружаем его
      if (avatarFile) {
        const formData = new FormData();
        formData.append('file', avatarFile);
        const avatarRes = await apiFetch(`/projects/${project.id}/avatar`, {
          method: 'POST',
          body: formData,
        });
        if (!avatarRes.ok) {
          const err = await avatarRes.json();
          console.error('Ошибка загрузки аватара проекта', err);
        }
      }

      navigate(`/projects/${project.id}`);
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
        <div className="auth-container" style={{ maxWidth: '800px' }}>
          <h2 className="auth-subtitle">Создание проекта</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="title">Название проекта *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
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
              <label>Требуемые специализации и ставки</label>
              {formData.required_specializations.map((spec, index) => (
                <div key={index} className="spec-row" style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <select
                    value={spec.specialization}
                    onChange={(e) => handleSpecChange(index, 'specialization', e.target.value)}
                    style={{ flex: 2, padding: '8px' }}
                  >
                    <option value="">Выберите специализацию</option>
                    {SPECIALIZATIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Ставка (₽/час)"
                    value={spec.hourly_rate}
                    onChange={(e) => handleSpecChange(index, 'hourly_rate', e.target.value)}
                    style={{ flex: 1 }}
                  />
                  {formData.required_specializations.length > 1 && (
                    <button type="button" onClick={() => removeSpec(index)} className="btn-remove">✕</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addSpec} className="btn-add">+ Добавить специализацию</button>
            </div>

            <div className="form-group">
              <label>Аватар проекта (необязательно)</label>
              <input type="file" accept="image/*" onChange={handleAvatarChange} />
              {avatarPreview && (
                <div style={{ marginTop: '10px' }}>
                  <img src={avatarPreview} alt="preview" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }} />
                </div>
              )}
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Создание...' : 'Создать проект'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export default ProjectCreatePage;
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AuthHeader from '../components/AuthHeader';
import { apiFetch } from '../utils/api';
import './AuthPages.css';

const SPECIALIZATIONS = [
  'Бизнес-аналитик',
  'Data Scientist',
  'Data Engineer',
  'Аналитик данных',
  'Системный аналитик',
  'BI-аналитик',
];

function ProjectEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [project, setProject] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    required_specializations: [],
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await apiFetch(`/projects/${id}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError('Проект не найден');
          } else {
            const err = await res.json();
            throw new Error(err.detail || 'Ошибка загрузки проекта');
          }
          setLoading(false);
          return;
        }
        const projectData = await res.json();
        setProject(projectData);
        setFormData({
          title: projectData.title || '',
          description: projectData.description || '',
          required_specializations: projectData.required_specializations || [],
        });
        if (projectData.avatar) {
          setAvatarPreview(`http://localhost:8000${projectData.avatar}`);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [id]);

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
    setSaving(true);
    setError('');

    // Подготовка данных: фильтруем незаполненные и преобразуем hourly_rate
    const specs = formData.required_specializations
      .filter(s => s.specialization && s.specialization.trim() !== '' && s.hourly_rate && s.hourly_rate !== '')
      .map(s => ({
        specialization: s.specialization,
        hourly_rate: parseInt(s.hourly_rate)
      }));

    const updateData = {
      title: formData.title,
      description: formData.description || null,
      required_specializations: specs.length > 0 ? specs : null
    };

    try {
      // Обновляем проект
      const res = await apiFetch(`/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Ошибка обновления проекта');
      }
      const updatedProject = await res.json();

      // Если есть новый файл аватара, загружаем
      if (avatarFile) {
        const formData = new FormData();
        formData.append('file', avatarFile);
        const avatarRes = await apiFetch(`/projects/${id}/avatar`, {
          method: 'POST',
          body: formData,
        });
        if (!avatarRes.ok) {
          const err = await avatarRes.json();
          console.error('Ошибка загрузки аватара', err);
          // но не прерываем, проект уже обновлён
        }
      }

      navigate(`/projects/${id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading">Загрузка...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!project) return null;

  return (
    <>
      <AuthHeader />
      <div className="auth-page">
        <div className="auth-container" style={{ maxWidth: '800px' }}>
          <h2 className="auth-subtitle">Редактирование проекта</h2>
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
              <label>Аватар проекта</label>
              <input type="file" accept="image/*" onChange={handleAvatarChange} />
              {avatarPreview && (
                <div style={{ marginTop: '10px' }}>
                  <img
                    src={avatarPreview}
                    alt="preview"
                    style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }}
                  />
                </div>
              )}
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="btn-submit" disabled={saving}>
              {saving ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
            <button type="button" className="btn-skip" onClick={() => navigate(`/projects/${id}`)}>
              Отмена
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export default ProjectEditPage;
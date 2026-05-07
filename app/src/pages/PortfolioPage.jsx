import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthHeader from '../components/AuthHeader';
import { apiFetch } from '../utils/api';
import './PortfolioPage.css';

function formatDate(dateStr) {
    if (!dateStr) return 'Наст. время';
    const d = new Date(dateStr);
    return d.toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' });
}

function pluralProject(n) {
    if (n % 10 === 1 && n % 100 !== 11) return 'проект';
    if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'проекта';
    return 'проектов';
}

const EMPTY_FORM = { title: '', description: '', start_date: '', end_date: '' };

function PortfolioPage() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // ── Modal state ──
    const [showModal, setShowModal] = useState(false);
    const [editingProject, setEditingProject] = useState(null); // null = создание
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    const navigate = useNavigate();

    // ── Загрузка ──
    const fetchProjects = async () => {
        try {
            const res = await apiFetch('/analyst/projects');
            if (!res.ok) throw new Error('Ошибка при загрузке проектов');
            const data = await res.json();
            setProjects(data.sort((a, b) => new Date(b.start_date) - new Date(a.start_date)));
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchProjects(); }, []);

    // ── Открыть модалку ──
    const openAdd = () => {
        setEditingProject(null);
        setForm(EMPTY_FORM);
        setFormError('');
        setShowModal(true);
    };

    const openEdit = (project) => {
        setEditingProject(project);
        setForm({
            title: project.title,
            description: project.description || '',
            start_date: project.start_date || '',
            end_date: project.end_date || '',
        });
        setFormError('');
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingProject(null);
        setFormError('');
    };

    // ── Сохранить (POST / PUT) ──
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setFormError('');

        const method = editingProject ? 'PUT' : 'POST';
        const url = editingProject
            ? `/analyst/projects/${editingProject.id}`
            : '/analyst/projects';

        try {
            const res = await apiFetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: form.title,
                    description: form.description,
                    start_date: form.start_date || null,
                    end_date: form.end_date || null,
                }),
            });

            if (res.ok) {
                await fetchProjects();
                closeModal();
            } else {
                const err = await res.json();
                setFormError(err.detail || 'Ошибка сохранения');
            }
        } catch (err) {
            setFormError(err.message);
        } finally {
            setSaving(false);
        }
    };

    // ── Удалить ──
    const handleDelete = async (projectId) => {
        if (!window.confirm('Удалить проект из портфолио?')) return;
        try {
            const res = await apiFetch(`/analyst/projects/${projectId}`, { method: 'DELETE' });
            if (res.ok) {
                setProjects(prev => prev.filter(p => p.id !== projectId));
            } else {
                alert('Ошибка при удалении');
            }
        } catch (err) {
            alert(err.message);
        }
    };

    const setField = (field) => (e) =>
        setForm(prev => ({ ...prev, [field]: e.target.value }));

    // ── Render ──
    if (loading) return <div className="loading">Загружаем портфолио…</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <>
            <AuthHeader />

            <div className="portfolio-page">

                {/* Шапка */}
                <div className="portfolio-header">
                    <div className="portfolio-header-left">
                        <h1 className="page-title">Мои проекты</h1>
                        <p className="portfolio-count">
                            {projects.length === 0
                                ? 'Портфолио пусто'
                                : `${projects.length} ${pluralProject(projects.length)}`}
                        </p>
                    </div>
                    <button className="btn-add" onClick={openAdd}>
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                            <path d="M8 1v14M1 8h14" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
                        </svg>
                        Добавить проект
                    </button>
                </div>

                {/* Сетка */}
                <div className="projects-grid">
                    {projects.length === 0 ? (

                        <div className="empty-state">
                            <div className="empty-icon">
                                <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5"
                                    strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="3" width="18" height="18" rx="3" />
                                    <path d="M12 8v8M8 12h8" />
                                </svg>
                            </div>
                            <h3>Портфолио пока пустое</h3>
                            <p>Добавьте первый проект — он поможет клиентам оценить ваш опыт.</p>
                            <button className="btn-add-empty" onClick={openAdd}>Добавить проект</button>
                        </div>

                    ) : projects.map((project, idx) => (

                        <div
                            key={project.id}
                            className="project-card"
                            style={{ animationDelay: `${idx * 80}ms` }}
                        >
                            <div className="card-body">
                                <div className="card-index">Проект {String(idx + 1).padStart(2, '0')}</div>

                                {project.category && (
                                    <span className="category-tag">{project.category}</span>
                                )}

                                <div className="project-header">
                                    <h3>{project.title}</h3>
                                </div>

                                <p className="project-description">{project.description}</p>

                                <div className="project-meta">
                                    <div className="project-dates">
                                        <span>{formatDate(project.start_date)}</span>
                                        <span className="dot" aria-hidden="true" />
                                        <span>{formatDate(project.end_date)}</span>
                                    </div>

                                    <div className="card-actions">
                                        <button className="btn-edit-small" onClick={() => openEdit(project)}>
                                            Изменить
                                        </button>
                                        <button
                                            className="btn-delete-small"
                                            onClick={() => handleDelete(project.id)}
                                            aria-label="Удалить проект"
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M4 7H20" stroke="white" strokeWidth="2" strokeLinecap="round" />
                                                <path d="M10 11V16" stroke="white" strokeWidth="2" strokeLinecap="round" />
                                                <path d="M14 11V16" stroke="white" strokeWidth="2" strokeLinecap="round" />
                                                <path d="M6 7L7 19C7 20.1046 7.89543 21 9 21H15C16.1046 21 17 20.1046 17 19L18 7" stroke="white" strokeWidth="2" strokeLinecap="round" />
                                                <path d="M9 4V3C9 2.44772 9.44772 2 10 2H14C14.5523 2 15 2.44772 15 3V4" stroke="white" strokeWidth="2" strokeLinecap="round" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                    ))}
                </div>

                {/* Назад */}
                <div className="btn-back-container">
                    <button className="btn-back" onClick={() => navigate(-1)}>
                        ← Вернуться в профиль
                    </button>
                </div>

            </div>

            {/* ═══ Модальное окно ═══ */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>

                        <button className="modal-close" onClick={closeModal} aria-label="Закрыть">×</button>

                        <h3 className="modal-title">
                            {editingProject ? 'Редактировать проект' : 'Новый проект'}
                        </h3>

                        <form onSubmit={handleSubmit}>

                            <div className="form-group">
                                <label>Название проекта *</label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={setField('title')}
                                    placeholder="Например: Аналитика воронки продаж"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Описание</label>
                                <textarea
                                    rows="4"
                                    value={form.description}
                                    onChange={setField('description')}
                                    placeholder="Расскажите, что делали — модель определит категорию автоматически"
                                />
                            </div>

                            <div className="form-group-row">
                                <div className="form-group">
                                    <label>Начало</label>
                                    <input
                                        type="date"
                                        value={form.start_date}
                                        onChange={setField('start_date')}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Окончание</label>
                                    <input
                                        type="date"
                                        value={form.end_date}
                                        onChange={setField('end_date')}
                                    />
                                </div>
                            </div>

                            {formError && <p className="form-error">{formError}</p>}

                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={closeModal}>
                                    Отмена
                                </button>
                                <button type="submit" className="btn-save" disabled={saving}>
                                    {saving ? 'Сохранение…' : 'Сохранить проект'}
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

export default PortfolioPage;
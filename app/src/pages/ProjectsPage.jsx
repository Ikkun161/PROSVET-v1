import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AuthHeader from '../components/AuthHeader';
import { apiFetch } from '../utils/api';
import './AnalystsPage.css'; // переиспользуем стили

function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await apiFetch('/projects');
        if (!response.ok) throw new Error('Ошибка загрузки проектов');
        const data = await response.json();
        setProjects(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  if (loading) return <div className="loading">Загрузка...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <>
      <AuthHeader />
      <div className="analysts-page container-wide">
        <h1 className="page-title">Все проекты</h1>
        <div className="analysts-list">
          {projects.map((project) => (
            <Link to={`/projects/${project.id}`} key={project.id} className="analyst-card">
              <div className="card-avatar">
                <img
                  src={project.avatar ? `http://localhost:8000${project.avatar}` : '/default-project.png'}
                  alt={project.title}
                />
              </div>
              <div className="card-info">
                <h3 className="card-name">{project.title}</h3>
                {project.company && (
                  <div className="company-mini">
                    <img
                      src={project.company.logo ? `http://localhost:8000${project.company.logo}` : '/default-company.png'}
                      alt={project.company.company_name}
                      className="company-mini-logo"
                    />
                    <span className="company-mini-name">{project.company.company_name}</span>
                  </div>
                )}
                {project.required_specializations && (
                  <div className="card-specialization">
                    {project.required_specializations.slice(0, 2).map(spec => spec.specialization).join(', ')}
                    {project.required_specializations.length > 2 && '...'}
                  </div>
                )}
                <div className="card-price">
                  от {Math.min(...project.required_specializations.map(s => s.hourly_rate))} ₽/час
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

export default ProjectsPage;
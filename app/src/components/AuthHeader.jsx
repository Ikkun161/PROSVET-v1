import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';
import logo from '../img/logo-test.svg';

function AuthHeader() {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [role, setRole] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserData = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;

            try {
                // Получаем данные пользователя через apiFetch
                const userRes = await apiFetch('/users/me');
                if (userRes.status === 401) {
                    // Токен истёк – ничего не делаем, модалка откроется глобально
                    return;
                }
                if (!userRes.ok) {
                    console.error('Ошибка загрузки пользователя');
                    return;
                }
                const userData = await userRes.json();
                setUser(userData);
                setRole(userData.role);

                // Загружаем профиль в зависимости от роли
                if (userData.role === 'analyst') {
                    const profileRes = await apiFetch('/profiles/me');
                    if (profileRes.status === 401) return;
                    if (profileRes.ok) {
                        const profileData = await profileRes.json();
                        setProfile(profileData);
                    } else {
                        console.error('Ошибка загрузки профиля аналитика');
                    }
                } else if (userData.role === 'client') {
                    const profileRes = await apiFetch('/client/profiles/me');
                    if (profileRes.status === 401) return;
                    if (profileRes.ok) {
                        const profileData = await profileRes.json();
                        setProfile(profileData);
                    } else {
                        console.error('Ошибка загрузки профиля компании');
                    }
                }
            } catch (error) {
                console.error('Ошибка загрузки данных пользователя', error);
            }
        };

        fetchUserData();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    // Определяем отображаемое имя
    let displayName = user?.email || 'Профиль';
    if (role === 'analyst' && profile?.full_name) {
        displayName = profile.full_name;
    } else if (role === 'client' && profile?.company_name) {
        displayName = profile.company_name;
    }

    // Определяем URL аватара
    let avatarUrl = '/default-avatar.png';
    if (role === 'analyst' && profile?.avatar) {
        avatarUrl = `http://localhost:8000${profile.avatar}`;
    } else if (role === 'client' && profile?.logo) {
        avatarUrl = `http://localhost:8000${profile.logo}`;
    }

    // Определяем ссылку на профиль
    const profileLink = role === 'analyst' ? '/profile/my' : '/client/profile/my';

    return (
        <header className="header">
            <div className="container">
                <Link to="/">
                    <img src={logo} className="logo" alt="ПРОСВЕТ" />
                </Link>
                <div className="nav-group">
                    <Link to="/analysts" className="nav-link">Аналитики</Link>
                    <Link to="/clients" className="nav-link">Заказчики</Link>
                    <Link to="/projects" className="nav-link">Проекты</Link>
                    {role === 'client' && (
                        <Link to="/forecast" className="nav-link">Прогноз продаж</Link>
                    )}
                    <div className="profile-menu">
                        <Link to={profileLink} className="profile-link">
                            <img src={avatarUrl} alt="avatar" className="mini-avatar" />
                            <span>{displayName}</span>
                        </Link>
                        <button onClick={handleLogout} className="btn-logout">Выйти</button>
                    </div>
                </div>
            </div>
        </header>
    );
}

export default AuthHeader;
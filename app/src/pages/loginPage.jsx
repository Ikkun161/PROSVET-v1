import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api'; // используем apiFetch
import regLogo from '../img/logo-reglog.svg';
import errorIcon from '../img/error-pass.svg';
import './AuthPages.css';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
  e.preventDefault();
  console.log('1. Форма отправлена');
  setLoading(true);
  setError('');

  try {
    console.log('2. Отправляем запрос к /auth/login');
    const loginRes = await apiFetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    console.log('3. Ответ получен, статус:', loginRes.status);

    if (!loginRes.ok) {
      const errData = await loginRes.json();
      console.log('4. Ошибка логина:', errData);
      throw new Error(errData.detail || 'Ошибка входа');
    }

    const { access_token } = await loginRes.json();
    console.log('5. Токен получен:', access_token);
    localStorage.setItem('token', access_token);

    console.log('6. Запрашиваем /users/me');
    const userRes = await apiFetch('/users/me');
    console.log('7. Ответ /users/me, статус:', userRes.status);

    if (!userRes.ok) {
      const errData = await userRes.json();
      console.log('8. Ошибка получения пользователя:', errData);
      throw new Error('Не удалось получить данные пользователя');
    }
    const userData = await userRes.json();
    console.log('9. Данные пользователя:', userData);

    if (userData.role === 'analyst') {
      console.log('10. Редирект на /profile/my');
      navigate('/profile/my');
    } else if (userData.role === 'client') {
      console.log('10. Редирект на /client/profile/my');
      navigate('/client/profile/my');
    } else {
      console.log('10. Неизвестная роль, редирект на главную');
      navigate('/');
    }
  } catch (err) {
    console.log('11. Поймана ошибка:', err.message);
    setError(err.message);
  } finally {
    setLoading(false);
    console.log('12. Завершение');
  }
};

  return (
    <div className="auth-page">
      <div className="auth-container">
        <img src={regLogo} alt="ПРОСВЕТ" className="auth-logo" />
        <p className="auth-subtitle">Вход в систему</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              placeholder="введите email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Пароль</label>
            <input
              type="password"
              id="password"
              placeholder="введите пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="error-message">
              <img src={errorIcon} alt="" className="error-icon" />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Забыли пароль? <Link to="/reset-password">Сбросить пароль</Link>
          </p>
          <p>
            Нет аккаунта? <Link to="/register/analyst">Зарегистрироваться как аналитик</Link> |{' '}
            <Link to="/register/client">как заказчик</Link>
          </p>
        </div>

        <Link to="/" className="back-home">← На главную</Link>
      </div>
    </div>
  );
}

export default LoginPage;
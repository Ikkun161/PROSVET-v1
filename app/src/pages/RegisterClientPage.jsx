import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import regLogo from '../img/logo-reglog.svg';
import errorIcon from '../img/error-pass.svg';
import './AuthPages.css';

function RegisterClientPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handlePasswordChange = (value, field) => {
    if (field === 'password') {
      setPassword(value);
    } else {
      setConfirmPassword(value);
    }
    if (field === 'password' && confirmPassword) {
      setPasswordError(value !== confirmPassword);
    } else if (field === 'confirmPassword' && password) {
      setPasswordError(password !== value);
    } else {
      setPasswordError(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setPasswordError(true);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          role: 'client',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Ошибка регистрации');
      }

      // Сохраняем токен
      localStorage.setItem('token', data.access_token);
      // Редирект на заполнение профиля заказчика
      navigate('/client/profile/fill');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <img src={regLogo} alt="ПРОСВЕТ" className="auth-logo" />
        <p className="auth-subtitle">Регистрация заказчика</p>
        <p className="auth-subtitle" style={{ fontSize: '18px', marginTop: '-15px', marginBottom: '30px' }}>
          Найдите аналитика для вашего бизнеса
        </p>

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
              onChange={(e) => handlePasswordChange(e.target.value, 'password')}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Подтвердите пароль</label>
            <input
              type="password"
              id="confirmPassword"
              placeholder="повторите пароль"
              value={confirmPassword}
              onChange={(e) => handlePasswordChange(e.target.value, 'confirmPassword')}
              required
            />
          </div>

          {passwordError && (
            <div className="error-message">
              <img src={errorIcon} alt="" className="error-icon" />
              <span>Пароли не совпадают</span>
            </div>
          )}

          {error && (
            <div className="error-message" style={{ marginBottom: '20px' }}>
              <img src={errorIcon} alt="" className="error-icon" />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Уже есть аккаунт? <Link to="/login">Войти</Link>
          </p>
        </div>

        <Link to="/" className="back-home">← На главную</Link>
      </div>
    </div>
  );
}

export default RegisterClientPage;
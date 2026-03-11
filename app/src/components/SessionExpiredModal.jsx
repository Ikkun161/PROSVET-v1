import { useNavigate } from 'react-router-dom';
import './SessionExpiredModal.css';

function SessionExpiredModal({ isOpen, onClose }) {
  const navigate = useNavigate();

  const handleLogin = () => {
    onClose();
    navigate('/login');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Время сеанса истекло</h2>
        <p>Пожалуйста, войдите снова</p>
        <button onClick={handleLogin}>Войти</button>
      </div>
    </div>
  );
}

export default SessionExpiredModal;
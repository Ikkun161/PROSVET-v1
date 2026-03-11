import { useState, useRef, useEffect } from 'react';

// Стили – используем абсолютные пути от корня проекта (папка src)
import '/src/styles/fonts.css';
import '/src/styles/global.css';
import '/src/styles/header.css';
import '/src/styles/hero.css';
import '/src/styles/features.css';
import '/src/styles/pricing.css';
import '/src/styles/footer.css';
import '/src/styles/responsive.css';

// Импорты изображений (если они в src/img)
import logo from '/src/img/logo-test.svg';
import dashboardIcon from '/src/img/dashboard-icon.svg';
import aiIcon from '/src/img/ai-icon.svg';
import mpIcon from '/src/img/mp-icon.svg';
import footerLogo from '/src/img/logo-with-white-backgr.svg';

// Данные для аккордеона
const accordionItems = [
  {
    title: 'Профиль аналитика',
    icon: dashboardIcon,
    content: 'Каждый аналитик создает подробный профиль с информацией о компетенциях, опыте, образовании. Загружает примеры работ, кейсы, указывает специализацию (BA/DS) и предпочтительный формат работы. Вы сразу видите, подходит ли специалист под вашу задачу.'
  },
  {
    title: 'Умный поиск и фильтры',
    icon: aiIcon,
    content: 'Ищите по ключевым навыкам (SQL, Python, BPMN, ML), по опыту работы, по стоимости часа или проекта. Используйте фильтры, чтобы сузить круг до идеальных кандидатов. А если нужен нестандартный запрос — воспользуйтесь поиском по ключевым словам.'
  },
  {
    title: 'Безопасная сделка',
    icon: mpIcon,
    content: 'Все финансовые взаимодействия проходят через платформу. Заказчик вносит оплату на эскроу-счет, аналитик получает деньги только после успешной сдачи работы. Мы выступаем гарантом честной сделки для обеих сторон.'
  }
];

// Компонент Header
function Header() {
  const [registerOpen, setRegisterOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const registerRef = useRef(null);
  const loginRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (registerRef.current && !registerRef.current.contains(event.target)) {
        setRegisterOpen(false);
      }
      if (loginRef.current && !loginRef.current.contains(event.target)) {
        setLoginOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="header">
      <div className="container">
        <img src={logo} className="logo" alt="ПРОСВЕТ" />
        <div className="nav-group">
          <a href="#features" className="nav-link">Функционал</a>
          <a href="#for-whom" className="nav-link">Для кого</a>
          <div className="auth-buttons">
            <div className="dropdown" ref={registerRef}>
              <button 
                className="btn-register" 
                onClick={() => setRegisterOpen(!registerOpen)}
              >
                <span>Зарегистрироваться</span>
                <span className="arrow-icon">{registerOpen ? '▶' : '▼'}</span>
              </button>
              {registerOpen && (
                <div className="dropdown-menu">
                  <a href="/register/analyst" className="dropdown-item">Как аналитик</a>
                  <a href="/register/client" className="dropdown-item">Как заказчик</a>
                </div>
              )}
            </div>

            <div className="dropdown" ref={loginRef}>
              <button 
                className="btn-login" 
                onClick={() => setLoginOpen(!loginOpen)}
              >
                <span>Войти</span>
                <span className="arrow-icon">{loginOpen ? '▶' : '▼'}</span>
              </button>
              {loginOpen && (
                <div className="dropdown-menu">
                  <a href="/login" className="dropdown-item">Как аналитик</a>
                  <a href="/login" className="dropdown-item">Как заказчик</a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

// Hero
function Hero() {
  return (
    <section className="hero" id="hero">
      <div className="container">
        <h1>
          Найдите идеального <span className="accent">аналитика</span><br />
          для вашего бизнеса за <span className="accent">24 часа</span>
        </h1>
        <p className="hero-sub">
          BA и DS на временные проекты. Просматривайте портфолио,<br />
          читайте отзывы и нанимайте проверенных специалистов.
        </p>
        <a href="#for-whom" className="btn btn-primary">Узнать больше</a>
      </div>
    </section>
  );
}

// Features
function Features() {
  const [activeIndex, setActiveIndex] = useState(0);
  const itemRefs = useRef([]);
  const prevActiveIndexRef = useRef(activeIndex);

  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, accordionItems.length);
  }, []);

  const handleToggle = (index) => {
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  const isElementInViewport = (el) => {
    const rect = el.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight)
    );
  };

  useEffect(() => {
    if (prevActiveIndexRef.current !== activeIndex) {
      const currentItem = itemRefs.current[activeIndex];
      if (currentItem && !isElementInViewport(currentItem)) {
        currentItem.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
      prevActiveIndexRef.current = activeIndex;
    }
  }, [activeIndex]);

  return (
    <section className="features" id="features">
      <div className="container">
        <h2 className="section-title features-title">Как это работает</h2>
        <div className="accordion">
          {accordionItems.map((item, index) => (
            <div
              key={index}
              ref={(el) => (itemRefs.current[index] = el)}
              className={`accordion-item ${activeIndex === index ? 'active' : ''}`}
            >
              <div className="accordion-header" onClick={() => handleToggle(index)}>
                <span className="accordion-icon">
                  <img src={item.icon} alt="" />
                </span>
                <span className="accordion-title">{item.title}</span>
                <span className="accordion-toggle">
                  {activeIndex === index ? '−' : '+'}
                </span>
              </div>
              <div className={`accordion-content-wrapper ${activeIndex === index ? 'open' : ''}`}>
                <div className="accordion-content">
                  {item.content}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ForWhom
function ForWhom() {
  return (
    <section className="for-whom" id="for-whom">
      <div className="container">
        <h2 className="section-title for-whom-title">Кому подойдет платформа</h2>
        <div className="for-whom-grid">
          <div className="for-whom-card">
            <h3>Для заказчиков</h3>
            <ul className="for-whom-list">
              <li>Найдите проверенных BA и DS</li>
              <li>Экономьте время на поиске</li>
              <li>Работайте с портфолио и отзывами</li>
              <li>Безопасная сделка</li>
            </ul>
            <a href="/register/client" className="btn-card">Начать как заказчик</a>
          </div>
          <div className="for-whom-card">
            <h3>Для аналитиков</h3>
            <ul className="for-whom-list">
              <li>Получайте заказы на проекты</li>
              <li>Покажите свои кейсы и навыки</li>
              <li>Доступ к заказчикам со всего бизнеса</li>
              <li>Выплаты без задержек</li>
            </ul>
            <a href="/register/analyst" className="btn-card">Стать аналитиком</a>
          </div>
        </div>
      </div>
    </section>
  );
}

// Footer
function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <img src={footerLogo} className="footer-logo" alt="ПРОСВЕТ" />
            <div className="footer-description-wrapper">
              <p className="footer-description">Найдите идеального аналитика для вашего бизнеса. BA и DS на временные проекты.</p>
            </div>
          </div>
          <div className="footer-nav footer-nav--nav">
            <h4>Навигация</h4>
            <ul>
              <li><a href="#hero">В начало</a></li>
              <li><a href="#features">Функционал</a></li>
              <li><a href="#for-whom">Для кого</a></li>
            </ul>
          </div>
          <div className="footer-nav footer-nav--legal">
            <h4>Юридическая информация</h4>
            <ul>
              <li><a href="#">Политика конфиденциальности</a></li>
              <li><a href="#">Пользовательское соглашение</a></li>
              <li><a href="#">Согласие на обработку персональных данных</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          © 2025 ПРОСВЕТ. Все права защищены.
        </div>
      </div>
    </footer>
  );
}

// Основной компонент страницы
export default function LandingPage() {
  return (
    <>
      <Header />
      <Hero />
      <Features />
      <ForWhom />
      <Footer />
    </>
  );
}
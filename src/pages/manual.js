import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './manual.css';

const stylesList = [
  { id: 'photographic', name: 'Фотография', img: '/images/photographic.png', tooltip: 'Реалистичное изображение с высокой детализацией, естественным освещением и текстурами, как на фото.' },
  { id: 'anime', name: 'Аниме', img: '/images/anime.png', tooltip: 'Стиль японской анимации с яркими цветами, выразительными глазами и четкими контурами.' },
  { id: 'comic-book', name: 'Комикс', img: '/images/comic.png', tooltip: 'Стиль комиксов с выразительной линией, контрастными цветами и стилизованными эффектами, напоминающими графические новеллы.' },
];

export default function Manual() {
  const [style, setStyle] = useState(null);
  const [loading, setLoading] = useState(false);

  const [question1, setQuestion1] = useState('');
  const [question2, setQuestion2] = useState('');
  const [question3, setQuestion3] = useState('');
  const [numImages, setNumImages] = useState(4);

  const [isAuthorized, setIsAuthorized] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [errors, setErrors] = useState({});

  const modalRef = useRef(null);
  const navigate = useNavigate();

  // Проверка авторизации при загрузке
  useEffect(() => {
    fetch('http://storysight.ru/api/auth/me', {
      credentials: 'include',
    })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(() => {
        setIsAuthorized(true);
        setShowModal(false);
      })
      .catch(() => {
        setIsAuthorized(false);
        setShowModal(true);
      });
  }, []);

  // Обработчик Telegram авторизации
  useEffect(() => {
    window.onTelegramAuth = (user) => {
      fetch('http://storysight.ru/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(user),
      })
        .then(res => {
          if (res.ok) {
            setIsAuthorized(true);
            setShowModal(false);
          } else {
            alert('Ошибка авторизации через Telegram');
          }
        })
        .catch((err) => {
          console.error('Auth error', err);
          alert('Ошибка авторизации через Telegram');
        });
    };

    return () => {
      window.onTelegramAuth = null;
    };
  }, []);

  // Вставка Telegram-виджета
  useEffect(() => {
    if (showModal && modalRef.current) {
      modalRef.current.innerHTML = '';

      const existingScript = document.querySelector('script[src="https://telegram.org/js/telegram-widget.js?22"]');
      if (existingScript) existingScript.remove();

      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-widget.js?22';
      script.async = true;
      script.setAttribute('data-telegram-login', 'zavod_worker_bot');
      script.setAttribute('data-size', 'large');
      script.setAttribute('data-userpic', 'false');
      script.setAttribute('data-onauth', 'onTelegramAuth(user)');
      script.setAttribute('data-request-access', 'write');

      modalRef.current.appendChild(script);
    }
  }, [showModal]);

  const validate = () => {
    const newErrors = {};
    if (!style) newErrors.style = 'Выберите стиль';
    if (!question1.trim()) newErrors.question1 = 'Это поле обязательно';
    if (!question2.trim()) newErrors.question2 = 'Это поле обязательно';
    if (!question3.trim()) newErrors.question3 = 'Это поле обязательно';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGenerate = async () => {
    if (!isAuthorized) {
      setShowModal(true);
      return;
    }

    if (!validate()) return;
    setLoading(true);

    try {
      const res = await fetch('http://storysight.ru/api/generate-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          style,
          question1,
          question2,
          question3,
          num_images: numImages,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        const images = data.images.map(img => `data:image/webp;base64,${img}`);
        navigate('/result-main', {
          state: {
            images,
            storyline: data.storyline,
            prompts: data.prompts,
          },
        });
      } else {
        alert(data.error || 'Ошибка при генерации');
      }
    } catch (err) {
      console.error(err);
      alert('Ошибка соединения');
    } finally {
      setLoading(false);
    }
  };

  if (isAuthorized === null) return <div className="manual-container">Загрузка...</div>;

  return (
    <div className="manual-container">
      <h1 className="manual-title">Пользовательская генерация</h1>

      <label className="manual-label">Выберите стиль:</label>
      <div className="styles-grid">
        {stylesList.map(({ id, name, img, tooltip }) => (
          <div
            key={id}
            className={`style-box flip-card ${style === id ? 'selected' : ''}`}
            onClick={() => setStyle(id)}
            title={tooltip}
          >
            <div className="flip-card-inner">
              <div className="flip-card-front">
                <img src={img} alt={name} className="style-image" />
                <div className="style-name">{name}</div>
              </div>
              <div className="flip-card-back">
                <p className="style-description">{tooltip}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      {errors.style && <div className="error-text">{errors.style}</div>}

      <div className="manual-questions">
        <label className="manual-label">1. Каким вы видите своего персонажа?</label>
        <textarea
          className="manual-textarea"
          value={question1}
          onChange={(e) => setQuestion1(e.target.value)}
        />
        {errors.question1 && <div className="error-text">{errors.question1}</div>}

        <label className="manual-label">2. Чем вы занимаетесь или какой продукт/товар создаёте?</label>
        <textarea
          className="manual-textarea"
          value={question2}
          onChange={(e) => setQuestion2(e.target.value)}
        />
        {errors.question2 && <div className="error-text">{errors.question2}</div>}

        <label className="manual-label">3. Кратко опишите сюжет вашей истории</label>
        <textarea
          className="manual-textarea"
          value={question3}
          onChange={(e) => setQuestion3(e.target.value)}
        />
        {errors.question3 && <div className="error-text">{errors.question3}</div>}
      </div>

      <div className="manual-slider-block">
        <label className="manual-label">
          Количество сцен: {numImages}
        </label>
        <input
          type="range"
          min={1}
          max={8}
          value={numImages}
          onChange={(e) => setNumImages(Number(e.target.value))}
          className="manual-slider"
        />
      </div>

      <div className="button-row">
        <button className="btn btn-gray" onClick={() => navigate('/create-choice')}>
          Назад
        </button>
        <button
          className="btn btn-purple"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? 'Генерация...' : 'Сгенерировать'}
        </button>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <h2 id="modal-title">Вход через Telegram</h2>
            <p>Пожалуйста, войдите, чтобы продолжить</p>
            <div ref={modalRef} />
            <button className="btn btn-gray" onClick={() => setShowModal(false)}>
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

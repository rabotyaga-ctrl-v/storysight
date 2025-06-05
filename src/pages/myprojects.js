import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import "./myprojects.css";

const MyProjects = () => {
  const [user, setUser] = useState(null);
  const [images, setImages] = useState([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingImages, setLoadingImages] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const modalRef = useRef(null);

  // Получаем пользователя при загрузке страницы
  useEffect(() => {
    axios
      .get("http://storysight.ru:8000/auth/me", { withCredentials: true })
      .then((res) => {
        setUser(res.data);
        setShowModal(false);
      })
      .catch(() => {
        setUser(null);
        setShowModal(true); // Если не авторизован — показать модалку
      })
      .finally(() => setLoadingUser(false));
  }, []);

  // Загрузка изображений пользователя
  useEffect(() => {
    if (user) {
      setLoadingImages(true);
      axios
        .get("http://storysight.ru:8000/my-projects", { withCredentials: true })
        .then((res) => setImages(res.data))
        .catch((err) => console.error("Ошибка при загрузке изображений:", err))
        .finally(() => setLoadingImages(false));
    }
  }, [user]);

  // Обработчик Telegram авторизации — слушаем событие, вызываем API и закрываем модалку
  useEffect(() => {
    // Функция, вызываемая из виджета Telegram (будет доступна в window)
    window.onTelegramAuth = function (user) {
      // Генерируем и диспатчим кастомное событие с данными телеги
      const event = new CustomEvent("tg-auth", { detail: user });
      window.dispatchEvent(event);
    };

    const handleTelegramAuth = async (e) => {
      const telegramUser = e.detail;

      try {
        await axios.post("http://storysight.ru:8000/auth/login", telegramUser, {
          withCredentials: true,
        });
        const res = await axios.get("http://storysight.ru:8000/auth/me", {
          withCredentials: true,
        });
        setUser(res.data);
        setShowModal(false);
      } catch (error) {
        console.error("Ошибка авторизации через Telegram:", error);
        alert("Ошибка авторизации через Telegram");
      }
    };

    window.addEventListener("tg-auth", handleTelegramAuth);
    return () => {
      window.removeEventListener("tg-auth", handleTelegramAuth);
      window.onTelegramAuth = null;
    };
  }, []);

  // Вставка Telegram-виджета в модальное окно
  useEffect(() => {
    if (showModal && modalRef.current) {
      // Очищаем контейнер
      modalRef.current.innerHTML = "";

      // Удаляем предыдущий скрипт виджета, если есть
      const existingScript = document.querySelector(
        'script[src="https://telegram.org/js/telegram-widget.js?22"]'
      );
      if (existingScript) existingScript.remove();

      // Создаем новый скрипт виджета
      const script = document.createElement("script");
      script.src = "https://telegram.org/js/telegram-widget.js?22";
      script.async = true;
      script.setAttribute("data-telegram-login", "zavod_worker_bot");
      script.setAttribute("data-size", "large");
      script.setAttribute("data-userpic", "false");
      script.setAttribute("data-onauth", "onTelegramAuth(user)");
      script.setAttribute("data-request-access", "write");

      // Вставляем скрипт в контейнер
      modalRef.current.appendChild(script);
    }
  }, [showModal]);

  // Скачать изображение
  const downloadImage = (url, title, id) => {
    const link = document.createElement("a");
    link.href = url;
    const safeTitle = title ? title.replace(/[^a-z0-9]/gi, "_").toLowerCase() : `image_${id}`;
    link.download = `${safeTitle}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Рендер состояния загрузки пользователя
  if (loadingUser) return <p className="myprojects-message">Проверка авторизации...</p>;

  // Модальное окно с Telegram виджетом
  const Modal = () => (
    <div className="modal-overlay" onClick={() => setShowModal(false)}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <h2 id="modal-title" style={{ color: "black" }}>Пожалуйста, авторизуйтесь через Telegram</h2>
        <p>Пожалуйста, войдите, чтобы продолжить</p>
        <div ref={modalRef} />
        <button className="btn btn-gray" onClick={() => setShowModal(false)}>
          Закрыть
        </button>
      </div>
    </div>
  );

  return (
    <div className="myprojects-container">
      <h1 className="myprojects-title">Мои проекты</h1>

      {!user && <p className="myprojects-message">Для просмотра проектов необходимо войти в аккаунт.</p>}

      {loadingImages && <p className="myprojects-message">Загрузка проектов...</p>}

      {user && !loadingImages && images.length === 0 && (
        <p className="myprojects-message">Пока нет ни одного изображения</p>
      )}

      {user && !loadingImages && images.length > 0 && (
        <>
          {Object.entries(
            images.reduce((acc, img) => {
              let datePart = "неизвестно";
              try {
                const parsedDate = new Date(img.created_at);
                if (!isNaN(parsedDate)) {
                  datePart = parsedDate.toISOString().slice(0, 16);
                }
              } catch {}
              const storylineText = img.storyline?.trim() || "Без описания";
              const key = `${datePart}||${storylineText}`;
              if (!acc[key]) acc[key] = [];
              acc[key].push(img);
              return acc;
            }, {})
          )
            .sort((a, b) => new Date(b[0].split("||")[0]) - new Date(a[0].split("||")[0]))
            .map(([key, group], index) => {
              const [, storyline] = key.split("||");
              return (
                <div key={index} className="project-group">
                  <div className="storyline">{storyline}</div>
                  <div className="myprojects-grid">
                    {group.map((img) => (
                      <div key={img.id} className="project-card">
                        <img
                          src={img.url}
                          alt={img.title || "Изображение"}
                          className="project-image"
                        />
                        {img.title && <div className="project-prompt">{img.title}</div>}
                        <button
                          className="download-button"
                          onClick={() => downloadImage(img.url, img.title, img.id)}
                        >
                          Скачать
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
        </>
      )}

      {showModal && <Modal />}
    </div>
  );
};

export default MyProjects;

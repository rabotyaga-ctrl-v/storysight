import React, { useEffect, useState } from "react";
import axios from "axios";
import "./myprojects.css";

const MyProjects = () => {
  const [user, setUser] = useState(null);
  const [images, setImages] = useState([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingImages, setLoadingImages] = useState(false);

  // Получаем пользователя при загрузке страницы
  useEffect(() => {
    axios
        .get("http://localhost:8000/auth/me", { withCredentials: true })
        .then((res) => setUser(res.data))
        .catch(() => setUser(null))
        .finally(() => setLoadingUser(false));
  }, []);

  // Загрузка изображений пользователя
  useEffect(() => {
    if (user) {
      setLoadingImages(true);
      axios
          .get(`http://localhost:8000/my-projects?telegram_id=${user.telegram_id}`, {
            withCredentials: true,
          })
          .then((res) => setImages(res.data))
          .catch((err) => console.error("Ошибка при загрузке изображений:", err))
          .finally(() => setLoadingImages(false));
    }
  }, [user]);

  // Обработчик Telegram авторизации
  useEffect(() => {
    const handleTelegramAuth = async (e) => {
      const telegramUser = e.detail;

      try {
        await axios.post("http://localhost:8000/auth/login", telegramUser, {
          withCredentials: true,
        });
        const res = await axios.get("http://localhost:8000/auth/me", {
          withCredentials: true,
        });
        setUser(res.data);
      } catch (error) {
        console.error("Ошибка авторизации через Telegram:", error);
      }
    };

    window.addEventListener("tg-auth", handleTelegramAuth);
    return () => {
      window.removeEventListener("tg-auth", handleTelegramAuth);
    };
  }, []);

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

  // Состояние: загрузка пользователя
  if (loadingUser) return <p className="myprojects-message">Проверка авторизации...</p>;

  // Состояние: не авторизован
  if (!user) {
    return (
        <div className="myprojects-container">
          <h1 className="myprojects-title">Мои проекты</h1>
          <p className="myprojects-message">Пожалуйста, авторизуйтесь через Telegram</p>
          <div id="telegram-login" className="telegram-login-button">
            <script
                async
                src="https://telegram.org/js/telegram-widget.js?7"
                data-telegram-login="zavod_worker_bot" // <-- ЗАМЕНИ на имя твоего бота
                data-size="large"
                data-userpic="false"
                data-request-access="write"
                data-on-auth="onTelegramAuth"
            ></script>
          </div>
        </div>
    );
  }

  // Состояние: загрузка изображений
  if (loadingImages) return <p className="myprojects-message">Загрузка проектов...</p>;

  // Состояние: нет изображений
  if (images.length === 0) {
    return (
        <div className="myprojects-container">
          <h1 className="myprojects-title">Мои проекты</h1>
          <p className="myprojects-message">Пока нет ни одного изображения</p>
        </div>
    );
  }

  // Группировка и сортировка изображений
  const groupedImages = images.reduce((acc, img) => {
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
  }, {});

  const sortedGroups = Object.entries(groupedImages).sort((a, b) => {
    const dateA = new Date(a[0].split("||")[0]);
    const dateB = new Date(b[0].split("||")[0]);
    return dateB - dateA;
  });

  return (
      <div className="myprojects-container">
        <h1 className="myprojects-title">Мои проекты</h1>
        {sortedGroups.map(([key, group], index) => {
          const [, storyline] = key.split("||");
          return (
              <div key={index} className="project-group">
                <div className="storyline">{storyline}</div>
                <div className="myprojects-grid">
                  {group.map((img) => (
                      <div key={img.id} className="project-card">
                        <img src={img.url} alt={img.title || "Изображение"} className="project-image" />
                        {img.title && <div className="project-prompt">{img.title}</div>}
                        <button className="download-button" onClick={() => downloadImage(img.url, img.title, img.id)}>
                          Скачать
                        </button>
                      </div>
                  ))}
                </div>
              </div>
          );
        })}
      </div>
  );
};

export default MyProjects;

import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Typewriter } from "react-simple-typewriter";
import "./Home.css";

const works = [
  { id: 1, image: "/images/work1.png", description: "Ваша чистота - ваше спокойствие" },
  { id: 2, image: "/images/work2.png", description: "Продавец шаурмы, который старается привлечь клиентов" },
  { id: 3, image: "/images/work3.png", description: "Магазин комнатных растений" },
  { id: 4, image: "/images/work4.png", description: "Блокнот, который меняет всё" },
  { id: 5, image: "/images/work5.png", description: "Сапожник и путь за гвоздями" },
  { id: 6, image: "/images/work6.png", description: "Маркетинг через историю героя-путешественника" },
  { id: 7, image: "/images/work7.png", description: "Владелица пекарни и неожиданный успех" },
  { id: 8, image: "/images/work8.png", description: "Умный дом — уют по щелчку" },
  { id: 9, image: "/images/work9.png", description: "Ремонт старинных часов" },
  { id: 10, image: "/images/work10.png", description: "Крафтовая упаковка подарков" },
  { id: 11, image: "/images/work11.png", description: "Пекарня — аромат и уют" },
  { id: 12, image: "/images/work12.png", description: "Воспоминания из одного путешествия" },
  { id: 13, image: "/images/work13.png", description: "Продавец машин — контраст «до и после»" },
  { id: 14, image: "/images/work14.png", description: "Онлайн-курс по мышлению" },
];

function TelegramStatus() {
  const [user, setUser] = useState(null);
  const widgetRef = useRef(null);

  useEffect(() => {
    fetch("http://storysight.ru:8000/auth/me", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Не авторизован");
        return res.json();
      })
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (!user && widgetRef.current) {
      widgetRef.current.innerHTML = "";
      const script = document.createElement("script");
      script.src = "https://telegram.org/js/telegram-widget.js?7";
      script.setAttribute("data-telegram-login", "zavod_worker_bot");
      script.setAttribute("data-size", "large");
      script.setAttribute("data-userpic", "false");
      script.setAttribute("data-lang", "ru");
      script.setAttribute("data-request-access", "write");
      script.setAttribute("data-onauth", "onTelegramAuth(user)");
      script.async = true;
      widgetRef.current.appendChild(script);
    }
  }, [user]);

  window.onTelegramAuth = function (user) {
    fetch("http://storysight.ru:8000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
      credentials: "include",
    })
      .then((res) => res.json())
      .then(() => {
        setUser(user);
        localStorage.setItem("telegramUser", JSON.stringify(user));
      })
      .catch(() => {});
  };

  function logout() {
    fetch("http://storysight.ru:8000/auth/logout", { method: "POST", credentials: "include" }).then(() => {
      setUser(null);
      localStorage.removeItem("telegramUser");
    });
  }

  if (!user) {
    return <div ref={widgetRef} id="telegram-widget-container"></div>;
  }

  return (
    <div className="telegram-status">
      {user.photo_url && <img src={user.photo_url} alt="avatar" className="telegram-avatar" />}
      <span className="telegram-username">{user.first_name || user.username || "Пользователь"}</span>
      <button onClick={logout} className="logout-button">
        Выйти
      </button>
    </div>
  );
}

const Home = () => {
  const navigate = useNavigate();

  const fullHeadline = "Создавай мини-комиксы для бизнеса";
  const fullSubtitle =
    "Визуализируй свои маркетинговые истории с помощью ИИ - просто опиши сюжет, выбери стиль, и получи яркий комикс, который запомнится вашим клиентам.";

  const [showSubtitle, setShowSubtitle] = useState(false);

  useEffect(() => {
    // Через примерное время завершения печати заголовка показываем подзаголовок
    const timer = setTimeout(() => setShowSubtitle(true), 2200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="home-container">
      <nav className="top-tabs">
        <div
          className="logo-text"
          style={{
            fontWeight: "900",
            fontSize: "28px",
            color: "#fff",
            marginRight: "auto",
            userSelect: "none",
            cursor: "default",
          }}
        >
          storysight
        </div>

        <span className="tab" onClick={() => navigate("/generate-character")}>
          Конструктор персонажа
        </span>
        <span className="tab" onClick={() => navigate("/my-projects")}>
          Мои проекты
        </span>
      </nav>

      <main className="main-content">
        <h1 className="headline">
          <Typewriter
            words={[fullHeadline]}
            cursor
            cursorStyle="|"
            typeSpeed={60}
            deleteSpeed={50}
            delaySpeed={1000}
            loop={1}
          />
        </h1>

        <p className="subtitle" style={{ minHeight: "3em" }}>
          {showSubtitle && (
            <Typewriter
              words={[fullSubtitle]}
              cursor
              cursorStyle="|"
              typeSpeed={40}
              deleteSpeed={30}
              delaySpeed={500}
              loop={1}
            />
          )}
        </p>

        <div className="start-widget-wrapper">
          <button className="btn" onClick={() => navigate("/create-choice")}>
            Начать
          </button>
          <div className="telegram-login-container">
            <TelegramStatus />
          </div>
        </div>
      </main>

      <section className="portfolio">
        {works.map((work) => (
          <div key={work.id} className="work-item">
            <img src={work.image} alt={`Work ${work.id}`} />
            <div className="work-overlay">
              <p>{work.description}</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

export default Home;

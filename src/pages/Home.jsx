import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
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

const Home = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    // Проверка авторизации
    useEffect(() => {
        axios
            .get("http://localhost:8000/auth/me", { withCredentials: true })
            .then((res) => setUser(res.data))
            .catch(() => setUser(null));
    }, []);

    // Telegram авторизация
    useEffect(() => {
        window.onTelegramAuth = async (userData) => {
            try {
                await axios.post("http://localhost:8000/auth/login", userData, {
                    withCredentials: true,
                });
                const res = await axios.get("http://localhost:8000/auth/me", {
                    withCredentials: true,
                });
                setUser(res.data);
            } catch (err) {
                console.error("Ошибка при Telegram входе:", err);
            }
        };
    }, []);

    const handleLogout = async () => {
        try {
            await axios.post("http://localhost:8000/auth/logout", {}, { withCredentials: true });
            setUser(null);
        } catch (err) {
            console.error("Ошибка при выходе:", err);
        }
    };

    return (
        <div className="home-container">
            <nav className="top-tabs">
                <span className="tab" onClick={() => navigate("/generate-character")}>
                    Конструктор персонажа
                </span>
                <span className="tab" onClick={() => navigate("/my-projects")}>
                    Мои проекты
                </span>
            </nav>

            <main className="main-content">
                <h1 className="headline">Создай свою историю</h1>
                <p className="subtitle">
                    Сделай запоминающуюся историю для своего бизнеса за 3 шага.
                </p>

                <div className="button-group">
                    <button className="btn" onClick={() => navigate("/create-choice")}>
                        Начать
                    </button>

                    {!user ? (
                        <div id="telegram-login" className="telegram-login-wrapper">
                            <script
                                async
                                src="https://telegram.org/js/telegram-widget.js?7"
                                data-telegram-login="zavod_worker_bot" // ЗАМЕНИ на имя своего бота без @
                                data-size="large"
                                data-userpic="true"
                                data-request-access="write"
                                data-on-auth="onTelegramAuth"
                            ></script>
                        </div>
                    ) : (
                        <div className="user-info">
                            {user.photo_url && (
                                <img src={user.photo_url} alt="avatar" className="user-avatar" />
                            )}
                            <span className="user-name">{user.first_name}</span>
                            <button className="btn logout-btn" onClick={handleLogout}>
                                Выйти
                            </button>
                        </div>
                    )}
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

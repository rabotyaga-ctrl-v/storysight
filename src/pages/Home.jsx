import React from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

const works = [
    { id: 1, image: "/images/work1.png", description: "Бренд кофе с легендой о путешественнике." },
    { id: 2, image: "/images/work2.png", description: "Ювелирный бренд с историей из будущего." },
    { id: 3, image: "/images/work3.png", description: "Арт-магазин, вдохновлённый снами художника." },
    { id: 4, image: "/images/work4.png", description: "Крафтовая пекарня — сказка о потерянном рецепте." },
    { id: 5, image: "/images/work5.png", description: "Винтажный бутик — дух 60-х в современности." },
    { id: 6, image: "/images/work4.png", description: "Маркетинг через историю героя-путешественника." },
    { id: 7, image: "/images/work3.png", description: "Салон, вдохновлённый мифами и метаморфозами." },
    { id: 8, image: "/images/work8.png", description: "Проект об утерянной цивилизации и бизнесе." },
    { id: 9, image: "/images/work10.png", description: "Эко-бренд, построенный на легенде о новом мире." },
    { id: 10, image: "/images/work10.png", description: "Эко-бренд2, построенный на легенде о новом мире." },
    { id: 11, image: "/images/work10.png", description: "Эко-бренд3, построенный на легенде о новом мире." },
    { id: 12, image: "/images/work10.png", description: "Эко-бренд4, построенный на легенде о новом мире." },
    { id: 13, image: "/images/work10.png", description: "Эко-бренд5, построенный на легенде о новом мире." },
    { id: 14, image: "/images/work10.png", description: "Эко-бренд6, построенный на легенде о новом мире." },
];

const Home = () => {
    const navigate = useNavigate();

    return (
        <div className="home-container">
            <nav className="top-tabs">
                <span className="tab" onClick={() => navigate("/generate-character")}>
                    Персонаж
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
                    <button className="btn" onClick={() => navigate("/choise")}>
                        Начать
                    </button>
                    <button className="btn" onClick={() => navigate("/login")}>
                        Войти в аккаунт
                    </button>
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

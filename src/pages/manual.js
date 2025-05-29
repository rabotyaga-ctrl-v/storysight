import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './manual.css';

const stylesList = [
    {
        id: 'photographic',
        name: 'Фотография',
        img: '/images/photographic.png',
        tooltip: 'Яркие цвета, упрощённые формы, динамичный мультяшный стиль.',
    },
    {
        id: 'anime',
        name: 'Аниме',
        img: '/images/anime.png',
        tooltip: 'Стиль японской анимации с выразительными глазами и детализированными персонажами.',
    },
    {
        id: 'comic-book',
        name: 'Комикс',
        img: '/images/comic.png',
        tooltip: 'Импрессионизм, мазки кисти и живописные текстуры как у Ван Гога.',
    },
];

export default function Manual() {
    // description убрал, он не нужен
    const [style, setStyle] = useState(null);
    const [loading, setLoading] = useState(false);
    const [resultPrompt, setResultPrompt] = useState('');
    const [imageBase64, setImageBase64] = useState(null);
    const [question1, setQuestion1] = useState('');
    const [question2, setQuestion2] = useState('');
    const [question3, setQuestion3] = useState('');
    const [numImages, setNumImages] = useState(4);

    const navigate = useNavigate();

    const handleGenerate = async () => {
        if (!style) {
            alert('Пожалуйста, выберите стиль.');
            return;
        }
        if (!question1.trim() || !question2.trim() || !question3.trim()) {
            alert('Пожалуйста, заполните все вопросы.');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/generate-character/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    style: style,
                    question1: question1.trim(),
                    question2: question2.trim(),
                    question3: question3.trim(),
                    num_images: numImages,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setResultPrompt(data.prompt_with_style || '');
                setImageBase64(data.image_base64 || null);
            } else {
                alert(data.error || 'Ошибка при генерации');
            }
        } catch (err) {
            alert('Произошла ошибка. Попробуйте позже.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="manual-container">
            <h1 className="manual-title">Ручной ввод идеи</h1>

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

            <div className="manual-questions">
                <label className="manual-label">1. Каким вы видите своего персонажа?</label>
                <textarea
                    className="manual-textarea"
                    rows={3}
                    placeholder="Опишите персонажа как можно подробнее (до 128 слов)"
                    value={question1}
                    onChange={(e) => setQuestion1(e.target.value)}
                />

                <label className="manual-label">2. Чем вы занимаетесь или какой продукт/товар создаёте?</label>
                <textarea
                    className="manual-textarea"
                    rows={2}
                    placeholder="Что будем рекламировать?"
                    value={question2}
                    onChange={(e) => setQuestion2(e.target.value)}
                />

                <label className="manual-label">3. Кратко опишите сюжет вашей истории</label>
                <textarea
                    className="manual-textarea"
                    rows={2}
                    placeholder="Самые невероятные идеи приветствуются!"
                    value={question3}
                    onChange={(e) => setQuestion3(e.target.value)}
                />
            </div>

            <div className="manual-slider-block">
                <label className="manual-label">
                    Количество изображений: {numImages}
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
                <button className="btn btn-purple" onClick={handleGenerate} disabled={loading}>
                    {loading ? 'Генерация...' : 'Сгенерировать'}
                </button>
            </div>

            {imageBase64 && (
                <div className="result-block">
                    <h2>Результат:</h2>
                    <p className="result-prompt">{resultPrompt}</p>
                    <img
                        src={`data:image/webp;base64,${imageBase64}`}
                        alt="Результат генерации"
                        className="result-image"
                    />
                    <button className="btn btn-green" onClick={() => navigate('/result-main')}>
                        Далее
                    </button>
                </div>
            )}
        </div>
    );
}

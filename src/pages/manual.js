import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './manual.css';

const stylesList = [
    {
        id: 'cartoon',
        name: 'Мультяшный стиль',
        img: '/images/photo4.jpg',
        tooltip: 'Яркие цвета, упрощённые формы, динамичный мультяшный стиль.',
    },
    {
        id: 'anime',
        name: 'Аниме стиль',
        img: '/images/photo2.jpg',
        tooltip: 'Стиль японской анимации с выразительными глазами и детализированными персонажами.',
    },
    {
        id: 'vangogh',
        name: 'Стиль Ван Гога',
        img: '/images/photo3.jpg',
        tooltip: 'Импрессионизм, мазки кисти и живописные текстуры как у Ван Гога.',
    },
];

export default function Manual() {
    const [description, setDescription] = useState('');
    const [style, setStyle] = useState(null);
    const [loading, setLoading] = useState(false);
    const [resultPrompt, setResultPrompt] = useState('');
    const [imageBase64, setImageBase64] = useState(null);
    const navigate = useNavigate();

    const handleGenerate = async () => {
        if (!description.trim()) {
            alert('Пожалуйста, опишите вашу идею.');
            return;
        }
        if (!style) {
            alert('Выберите стиль изображения.');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/generate-character/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: description.trim(),
                    style: style,
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

            <textarea
                className="manual-textarea"
                placeholder="Опишите персонажа, сцену или сюжет, который хотите создать..."
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
            />

            <label className="manual-label">Выберите стиль:</label>
            <div className="styles-grid">
                {stylesList.map(({ id, name, img, tooltip }) => (
                    <div
                        key={id}
                        className={`style-box ${style === id ? 'selected' : ''}`}
                        onClick={() => setStyle(id)}
                        title={tooltip}
                    >
                        <img src={img} alt={name} className="style-image" />
                        <div className="style-name">{name}</div>
                    </div>
                ))}
            </div>

            <div className="button-row">
                <button className="btn btn-gray" onClick={() => navigate('/choise')}>
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

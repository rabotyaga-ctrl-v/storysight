import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Generate.css';

const artStyles = [
    {
        id: 'cartoon',
        label: 'Мультяшный стиль',
        img: '/images/photo4.jpg',
        tooltip: 'Яркие цвета, упрощённые формы, динамичный мультяшный стиль.',
    },
    {
        id: 'anime',
        label: 'Аниме стиль',
        img: '/images/photo2.jpg',
        tooltip: 'Стиль японской анимации с выразительными глазами и детализированными персонажами.',
    },
    {
        id: 'vangogh',
        label: 'Стиль Ван Гога',
        img: '/images/photo3.jpg',
        tooltip: 'Импрессионизм, мазки кисти и живописные текстуры как у Ван Гога.',
    },
];

export default function GenerateCharacter() {
    const navigate = useNavigate();

    const [description, setDescription] = useState('');
    const [selectedStyle, setSelectedStyle] = useState(null);
    const [loadingGenerate, setLoadingGenerate] = useState(false);
    const [generatedPrompt, setGeneratedPrompt] = useState('');
    const [imageBase64, setImageBase64] = useState(null);
    const [showResult, setShowResult] = useState(false);
    const [saving, setSaving] = useState(false);

    const promptInstructions = `
Как написать хороший промпт для изображения персонажа:
- Опишите внешний вид: возраст, пол, одежду, позу.
- Добавьте черты характера: улыбчивый, мрачный, решительный.
- Укажите фон или окружение, если важно.
- Можно добавить стилистические детали: яркие цвета, тёмный фон, фэнтези.
- Чем подробнее, тем лучше!
Например: "Молодой рыцарь в блестящих доспехах, с решительным взглядом, на фоне старинного замка при закате, в стиле мультфильма."
`.trim();

    const handleGenerateClick = async () => {
        if (!description.trim()) {
            alert('Пожалуйста, опишите вашего персонажа.');
            return;
        }
        if (!selectedStyle) {
            alert('Выберите стиль изображения.');
            return;
        }

        setLoadingGenerate(true);
        setShowResult(false);
        setGeneratedPrompt('');
        setImageBase64(null);

        try {
            const response = await fetch('/generate-character/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: description.trim(),
                    style: selectedStyle,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setGeneratedPrompt(data.prompt_with_style || '');
                setImageBase64(data.image_base64 || null);
                setShowResult(true);
            } else {
                alert(data.error || 'Ошибка при генерации.');
            }
        } catch (error) {
            console.error(error);
            alert('Ошибка при подключении к серверу.');
        } finally {
            setLoadingGenerate(false);
        }
    };

    const handleReset = () => {
        setDescription('');
        setSelectedStyle(null);
        setGeneratedPrompt('');
        setImageBase64(null);
        setShowResult(false);
    };

    const handleDownload = () => {
        if (!imageBase64) return;
        const link = document.createElement('a');
        link.href = `data:image/webp;base64,${imageBase64}`;
        link.download = 'character.webp';
        link.click();
    };

    const handleSaveProject = async () => {
        if (!imageBase64) {
            alert('Нет изображения для сохранения.');
            return;
        }
        setSaving(true);
        try {
            // Пример запроса на сохранение в "Мои проекты"
            const response = await fetch('/save-character-project/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    description,
                    style: selectedStyle,
                    prompt: generatedPrompt,
                    image_base64: imageBase64,
                }),
            });
            const data = await response.json();
            if (response.ok) {
                alert('Проект успешно сохранён!');
            } else {
                alert(data.error || 'Ошибка при сохранении проекта.');
            }
        } catch (error) {
            console.error(error);
            alert('Ошибка при подключении к серверу.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="generate-container">
            <h1 className="generate-title">Генерация персонажа</h1>

            <pre className="generate-result">{promptInstructions}</pre>

            <textarea
                className="generate-textarea"
                placeholder="Опишите вашего персонажа..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loadingGenerate || saving}
            />

            <div className="input-group" style={{ marginTop: 20 }}>
                <label className="input-label">Выберите стиль:</label>
                <div className="generate-templates">
                    {artStyles.map(({ id, label, img, tooltip }) => (
                        <div
                            key={id}
                            className={`generate-template-box ${selectedStyle === id ? 'selected' : ''}`}
                            title={tooltip}
                            onClick={() => !loadingGenerate && !saving && setSelectedStyle(id)}
                        >
                            <img src={img} alt={label} />
                            <div>{label}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="generate-nav">
                <button onClick={() => navigate('/')} disabled={loadingGenerate || saving} className="generate-btn">
                    Назад
                </button>
                <button onClick={handleGenerateClick} disabled={loadingGenerate || saving} className="generate-btn">
                    {loadingGenerate ? 'Генерация...' : 'Отправить'}
                </button>
            </div>

            {showResult && imageBase64 && (
                <div className="generate-result" style={{ marginTop: 30 }}>
                    <h2 style={{ fontSize: 18, fontWeight: '700', marginBottom: 10 }}>Результат:</h2>
                    <p style={{ whiteSpace: 'pre-wrap' }}>{generatedPrompt}</p>
                    <img
                        src={`data:image/webp;base64,${imageBase64}`}
                        alt="Generated character"
                        style={{ maxWidth: '100%', marginTop: 20, borderRadius: 16 }}
                    />

                    <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
                        <button onClick={handleDownload} className="generate-btn" disabled={saving}>
                            Скачать изображение
                        </button>

                        <button onClick={handleSaveProject} className="generate-btn" disabled={saving}>
                            {saving ? 'Сохранение...' : 'Сохранить в мои проекты'}
                        </button>

                        <button
                            onClick={handleReset}
                            className="generate-btn"
                            style={{ backgroundColor: '#ccc', color: '#000' }}
                            disabled={saving}
                        >
                            Начать заново
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

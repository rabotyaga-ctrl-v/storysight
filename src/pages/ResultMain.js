import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './ResultMain.css';

export default function ResultMain() {
    const location = useLocation();
    const navigate = useNavigate();

    const images = location.state?.images || [];
    const originalStoryline = location.state?.storyline || '';
    const originalPrompts = location.state?.prompts || [];

    const [translatedPrompts, setTranslatedPrompts] = useState([]);
    const [translatedStoryline, setTranslatedStoryline] = useState(originalStoryline);

    useEffect(() => {
        const translateAll = async () => {
            try {
                // Переводим промпты
                const promptsRes = await fetch('http://storysight.ru/api/translate-prompts', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ prompts: originalPrompts })
                });

                const promptsData = await promptsRes.json();
                setTranslatedPrompts(promptsData.translated_prompts || originalPrompts);
            } catch (error) {
                console.error('Ошибка перевода промптов:', error);
                setTranslatedPrompts(originalPrompts);
            }

            try {
                // Переводим сюжет
                const storylineRes = await fetch('http://storysight.ru/api/translate-prompts', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ prompts: [originalStoryline] })
                });

                const storylineData = await storylineRes.json();
                setTranslatedStoryline(storylineData.translated_prompts?.[0] || originalStoryline);
            } catch (error) {
                console.error('Ошибка перевода сюжета:', error);
                setTranslatedStoryline(originalStoryline);
            }
        };

        if (originalPrompts.length > 0 || originalStoryline) {
            translateAll();
        }
    }, [originalPrompts, originalStoryline]);

    if (images.length === 0) {
        return (
            <div className="result-empty">
                <h2>Нет изображений для отображения</h2>
                <button onClick={() => navigate('/')}>На главную</button>
            </div>
        );
    }

    const handleDownload = (url, index) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = `comic_scene_${index + 1}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleSaveProject = async () => {
        const projectData = {
            storyline: translatedStoryline,
            prompts: translatedPrompts,
            images
        };

        try {
            const response = await fetch('http://storysight.ru/api/save-project', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(projectData)
            });

            if (!response.ok) {
                throw new Error('Ошибка при сохранении проекта');
            }

            const result = await response.json();
            alert('Проект успешно сохранён!');
            console.log(result);
        } catch (error) {
            console.error('Ошибка сохранения:', error);
            alert('Не удалось сохранить проект.');
        }
    };

    return (
        <div className="result-main-wrapper">
            <h1 className="title">Ваш комикс</h1>

            <div className="story-block">
                <h2>Сюжет</h2>
                <p>{translatedStoryline}</p>
            </div>

            <div className="images-grid">
                {images.map((url, i) => (
                    <div key={i} className="image-card">
                        <div className="image-wrapper">
                            <img src={url} alt={`Сцена ${i + 1}`} />
                        </div>
                        <div className="image-overlay">
                            <strong>{i + 1}.</strong> {translatedPrompts[i] || originalPrompts[i]}
                        </div>
                        <button className="download-btn" onClick={() => handleDownload(url, i)}>
                            Скачать
                        </button>
                    </div>
                ))}
            </div>

            <div className="buttons-row">
                <button className="btn-home" onClick={() => navigate('/')}>На главную</button>
                <button className="btn-home" onClick={() => navigate(-1)}>Назад</button>
                <button className="btn-save" onClick={handleSaveProject}>Сохранить в проекты</button>
            </div>
        </div>
    );
}

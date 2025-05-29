import React, { useState } from 'react';
import './Template.css';
import { useNavigate } from 'react-router-dom';

export default function Template() {
    const [storyText, setStoryText] = useState('');
    const [selectedCharacter, setSelectedCharacter] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();

    const characterTemplates = [
        {
            id: 'cockatiel',
            title: 'Cockatiel',
            description: 'Весёлые и неугомонные попугаи. Прорекламируют ваш продукт, если вы, конечно, их поймаете.',
        },
        {
            id: 'cat',
            title: 'Cat',
            description: 'Ловкий, пушистый и абсолютно не заинтересован в вашем проекте. Но выглядит шикарно, признайте!',
        },
        {
            id: 'black_bear',
            title: 'Black bear',
            description: 'Интроверт из мира медведей. Теперь он путешествует и даже пишет свою книгу. Раньше проживал в России.',
        },
        {
            id: 'raven',
            title: 'Raven',
            description: 'Ворон-минималист. Немногословен. Оно и понятно, ведь птицы не говорят. Самое главное, что он здесь.',
        },
        {
            id: 'tiger',
            title: 'Tiger',
            description: 'Уверенный, красивый и всё такой же опасный. Харизма на максималках. Хищник, инфлюенсер и икона стиля.',
        },
    ];

    const handleSubmit = () => {
        if (!storyText.trim()) {
            setErrorMessage('Пожалуйста, введите сюжет.');
            return;
        }
        if (!selectedCharacter) {
            setErrorMessage('Пожалуйста, выберите персонажа.');
            return;
        }

        setErrorMessage('');
        console.log('Отправка на сервер:', {
            text: storyText,
            character: selectedCharacter,
        });

        // TODO: Отправка на сервер
    };

    return (
        <div className="choise-wrapper">
            <h1 className="choise-heading">Создайте свой сторителлинг</h1>

            <textarea
                className="story-textarea"
                placeholder="Напишите здесь небольшой сюжет вашей истории..."
                value={storyText}
                onChange={(e) => setStoryText(e.target.value)}
            />

            <div className="character-grid">
                {characterTemplates.map((template) => (
                    <div
                        key={template.id}
                        className={`character-card-container ${selectedCharacter === template.id ? 'selected' : ''}`}
                        onClick={() => setSelectedCharacter(template.id)}
                    >
                        <div className="character-card-inner">
                            <div className="character-card-front">
                                <img
                                    src={`/images/${template.id}.jpg`}
                                    alt={template.title}
                                    className="character-img"
                                />
                                <h3 className="character-title">{template.title}</h3>
                            </div>
                            <div className="character-card-back">
                                <p>{template.description}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {errorMessage && <div className="error-message">{errorMessage}</div>}

            <button className="generate-btn" onClick={handleSubmit}>
                Сгенерировать комикс
            </button>

            <button className="back-btn" onClick={() => navigate("/create-choice")}>
                Назад
            </button>
        </div>
    );
}

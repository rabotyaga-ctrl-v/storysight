// Template.js
import React, { useState } from 'react';
import './Template.css';
import { useNavigate } from 'react-router-dom';

export default function Template() {
  const [storyText, setStoryText] = useState('');
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [numImages, setNumImages] = useState(1);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const characterTemplates = [
    { id: 'cockatiel', title: 'Cockatiel', description: 'Весёлые и неугомонные попугаи. Прорекламируют ваш продукт, если вы, конечно, их поймаете.' },
    { id: 'cat', title: 'Cat', description: 'Ловкий, пушистый и абсолютно не заинтересован в вашем проекте. Но выглядит шикарно, признайте!' },
    { id: 'black_bear', title: 'Black bear', description: 'Интроверт из мира медведей. Теперь он путешествует и даже пишет свою книгу. Раньше проживал в России.' },
    { id: 'raven', title: 'Raven', description: 'Ворон-минималист. Немногословен. Оно и понятно, ведь птицы не говорят. Самое главное, что он здесь.' },
    { id: 'tiger', title: 'Tiger', description: 'УУверенный, красивый и всё такой же опасный. Харизма на максималках. Хищник, инфлюенсер и икона стиля.' },
  ];

  const API_URL = 'http://localhost:8000/generate-comic';

  const handleSubmit = async () => {
    if (!storyText.trim()) {
      setErrorMessage('Пожалуйста, введите сюжет.');
      return;
    }
    if (!selectedCharacter) {
      setErrorMessage('Пожалуйста, выберите персонажа.');
      return;
    }

    setErrorMessage('');

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: storyText,
          character_name: selectedCharacter,
          num_images: numImages,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ошибка при генерации: ${response.statusText}`);
      }

      const data = await response.json();

      const imageBase64List = data.images.map((img) => `data:image/png;base64,${img}`);

      navigate('/result-main', {
        state: {
          images: imageBase64List,
          storyline: data.storyline,
          prompts: data.prompts || [], // на всякий случай
        }
      });
    } catch (error) {
      console.error('Ошибка:', error);
      setErrorMessage('Произошла ошибка при генерации. Проверьте подключение и попробуйте снова.');
    }
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
                  loading="lazy"
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

      <div className="slider-wrapper">
        <label htmlFor="numImages" className="slider-label">
          Количество изображений: {numImages}
        </label>
        <input
          type="range"
          id="numImages"
          min="1"
          max="8"
          value={numImages}
          onChange={(e) => setNumImages(parseInt(e.target.value))}
          className="slider"
        />
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

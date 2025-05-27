import React, { useState } from 'react';

export default function AssistantForm({ onSubmit }) {
    const [business, setBusiness] = useState('');
    const [character, setCharacter] = useState('');
    const [scene, setScene] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!business.trim()) return alert('Пожалуйста, расскажите о вашем бизнесе.');

        const formData = {
            business: business.trim(),
            character: character.trim() || 'любой',
            scene: scene.trim() || 'любой',
        };

        setSubmitted(true);
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="assistant-form-wrapper">
            <label htmlFor="business" className="assistant-label">
                1. Чем вы занимаетесь или какой продукт/товар создаёте?
            </label>
            <textarea
                id="business"
                value={business}
                onChange={(e) => setBusiness(e.target.value)}
                className="assistant-textarea"
                placeholder="Кстати, это место для вашего текста :)"
            />
            <div className="assistant-example">
                Пример: Я создаю натуральные сладости без сахара для детей.
            </div>

            <label htmlFor="character" className="assistant-label">
                2. Есть ли пожелания по созданию персонажа?
            </label>
            <textarea
                id="character"
                value={character}
                onChange={(e) => setCharacter(e.target.value)}
                className="assistant-input"
                placeholder="Можете оставить поле пустым"
            />
            <div className="assistant-example">
                Пример: Забавный ёжик в очках.
            </div>

            <label htmlFor="scene" className="assistant-label">
                3. Есть ли пожелания по выбору локации и сюжету?
            </label>

            <textarea
                id="scene"
                value={scene}
                onChange={(e) => setScene(e.target.value)}
                className="assistant-input"
                placeholder="Можете оставить поле пустым"
            />
            <div className="assistant-example">
                Пример: в лесу у костра или на берегу моря.
            </div>

            <button
                type="submit"
                disabled={submitted}
                className="assistant-submit-btn"
            >
                {submitted ? 'Отправлено...' : 'Сгенерировать'}
            </button>
        </form>
    );
}

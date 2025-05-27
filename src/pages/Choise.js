import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AssistantForm from './AssistantForm';
import './Choise.css';

export default function Choise() {
    const [mode, setMode] = useState(null); // 'manual' | 'assistant'
    const navigate = useNavigate();

    const handleAssistantSubmit = (data) => {
        console.log("Ответы пользователя:", data);
        navigate('/result', { state: { dataFromForm: data } });
    };

    return (
        <div className="choise-wrapper">
            <h1 className="choise-heading">Как вы хотите создать сторителлинг?</h1>

            {!mode && (
                <div className="choise-buttons">
                    <button
                        className="choise-option-btn"
                        onClick={() => navigate('/manual')}
                    >
                        Я буду создавать сам
                    </button>
                    <button
                        className="choise-option-btn"
                        onClick={() => setMode('assistant')}
                    >
                        С помощью ChatGPT
                    </button>
                </div>
            )}

            {mode === 'assistant' && (
                <div className="assistant-form-wrapper">
                    <AssistantForm onSubmit={handleAssistantSubmit} />
                </div>
            )}
        </div>
    );
}

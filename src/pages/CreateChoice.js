import React from 'react';
import { useNavigate } from 'react-router-dom';
import './CreateChoice.css';



export default function CreateChoice() {
    const navigate = useNavigate();

    return (
        <div className="create-choice-container">
            <h1>Выберите способ создания истории</h1>

            <div className="button-group">
                <button
                    className="btn btn-primary"
                    onClick={() => navigate('/manual')}
                >
                    Создам сам
                </button>

                <button
                    className="btn btn-secondary"
                    onClick={() => navigate('/template')}
                >
                    Создание с помощью шаблонов
                </button>
            </div>
        </div>
    );
}

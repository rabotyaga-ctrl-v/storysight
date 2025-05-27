import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function ResultMain() {
    const location = useLocation();
    const navigate = useNavigate();
    const images = location.state?.images || [];

    if (images.length === 0) {
        return (
            <div>
                <h2>Нет изображений для отображения</h2>
                <button onClick={() => navigate('/')}>На главную</button>
            </div>
        );
    }

    const handleDownload = (url) => {
        // скачиваем картинку по url
        const link = document.createElement('a');
        link.href = url;
        link.download = url.split('/').pop();
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleSaveProject = () => {
        alert('Функция сохранения пока не реализована.');
    };

    return (
        <div className="result-main-wrapper">
            <h1>Ваши сгенерированные изображения</h1>

            <div className="images-grid">
                {images.map(({ url, prompt }, i) => (
                    <div className="image-card" key={i}>
                        <div className="image-wrapper">
                            <img src={url} alt={`Generated ${i}`} />
                            <div className="image-overlay">
                                <p>{prompt}</p>
                            </div>
                        </div>
                        <button onClick={() => handleDownload(url)} className="download-btn">Скачать</button>
                    </div>
                ))}
            </div>

            <div className="buttons-row">
                <button onClick={() => navigate('/')} className="btn-home">На главную</button>
                <button onClick={handleSaveProject} className="btn-save">Сохранить в мои проекты</button>
            </div>
        </div>
    );
}

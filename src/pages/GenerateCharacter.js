import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Generate.css';

export default function GenerateCharacter() {
    const navigate = useNavigate();

    const [prompt, setPrompt] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imageURL, setImageURL] = useState(null);
    const [loading, setLoading] = useState(false);

    const canvasRef = useRef(null);
    const imgRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

    // При загрузке файла создаём URL для показа
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImageFile(file);
        const url = URL.createObjectURL(file);
        setImageURL(url);
    };

    // Начало рисования
    const handleMouseDown = (e) => {
        if (!canvasRef.current) return;
        setIsDrawing(true);
        const rect = canvasRef.current.getBoundingClientRect();
        setLastPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    // Окончание рисования
    const handleMouseUp = () => {
        setIsDrawing(false);
    };

    // Рисуем линию на canvas (маску)
    const handleMouseMove = (e) => {
        if (!isDrawing || !canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        const rect = canvasRef.current.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;

        ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(lastPos.x, lastPos.y);
        ctx.lineTo(currentX, currentY);
        ctx.stroke();

        setLastPos({ x: currentX, y: currentY });
    };

    // Очищаем маску (canvas)
    const clearMask = () => {
        if (!canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    };

    // При смене изображения нужно сбрасывать canvas
    useEffect(() => {
        clearMask();
    }, [imageURL]);

    const handleGenerateClick = () => {
        if (!prompt.trim()) {
            alert('Пожалуйста, введите промпт.');
            return;
        }
        if (!imageFile) {
            alert('Пожалуйста, загрузите изображение.');
            return;
        }
        setLoading(true);

        // Здесь будет вызов бекенда с отправкой изображения и маски
        setTimeout(() => {
            alert('Генерация пока не реализована. Это заглушка.');
            setLoading(false);
        }, 1000);
    };

    return (
        <div className="generate-container" style={{ maxWidth: 600, margin: '30px auto', padding: 20 }}>
            <h1 style={{ textAlign: 'center', marginBottom: 20 }}>Редактирование изображения (Image2Image с маской)</h1>

            <p style={{ fontSize: 14, color: '#555', marginBottom: 20 }}>
                Загрузите ваше изображение, выделите кисточкой область для изменения, введите промпт и нажмите "Начать генерацию".
            </p>

            <textarea
                placeholder="Опишите, что хотите добавить или изменить..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                style={{
                    width: '100%',
                    padding: 10,
                    fontSize: 16,
                    borderRadius: 6,
                    border: '1px solid #ccc',
                    marginBottom: 20,
                    resize: 'none',
                    fontFamily: 'Arial, sans-serif',
                }}
                disabled={loading}
            />

            <div style={{ marginBottom: 20 }}>
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={loading}
                    style={{ marginBottom: 10 }}
                />

                {imageURL && (
                    <div style={{ position: 'relative', border: '1px solid #ddd', borderRadius: 6 }}>
                        <img
                            ref={imgRef}
                            src={imageURL}
                            alt="Загруженное"
                            style={{ display: 'block', maxWidth: '100%', borderRadius: 6 }}
                            onLoad={() => {
                                // Устанавливаем размер canvas равным размеру изображения
                                if (imgRef.current && canvasRef.current) {
                                    canvasRef.current.width = imgRef.current.width;
                                    canvasRef.current.height = imgRef.current.height;
                                }
                                clearMask();
                            }}
                        />
                        <canvas
                            ref={canvasRef}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                cursor: 'crosshair',
                                borderRadius: 6,
                                userSelect: 'none',
                            }}
                            onMouseDown={handleMouseDown}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            onMouseMove={handleMouseMove}
                        />
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <button
                    onClick={() => navigate(-1)}
                    disabled={loading}
                    style={{
                        flex: 1,
                        padding: '10px 0',
                        borderRadius: 6,
                        border: '1px solid #ccc',
                        background: '#fff',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                    }}
                >
                    Назад
                </button>

                <button
                    onClick={handleGenerateClick}
                    disabled={loading}
                    style={{
                        flex: 2,
                        padding: '10px 0',
                        borderRadius: 6,
                        border: 'none',
                        background: '#6c63ff',
                        color: 'white',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                    }}
                >
                    {loading ? 'Генерация...' : 'Начать генерацию'}
                </button>
            </div>
        </div>
    );
}

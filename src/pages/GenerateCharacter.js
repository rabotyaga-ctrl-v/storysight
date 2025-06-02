import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Generate.css';

export default function GenerateCharacter() {
    const navigate = useNavigate();

    const [prompt, setPrompt] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imageURL, setImageURL] = useState(null);
    const [loading, setLoading] = useState(false);
    const [, setResultImage] = useState(null); // для результата

    const canvasRef = useRef(null);
    const imgRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImageFile(file);
        const url = URL.createObjectURL(file);
        setImageURL(url);
        setResultImage(null); // сброс результата при новом файле
    };

    const handleMouseDown = (e) => {
        if (!canvasRef.current) return;
        setIsDrawing(true);
        const rect = canvasRef.current.getBoundingClientRect();
        setLastPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    const handleMouseUp = () => {
        setIsDrawing(false);
    };

    const handleMouseMove = (e) => {
        if (!isDrawing || !canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        const rect = canvasRef.current.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;

        ctx.strokeStyle = 'white';  // белая кисть
        ctx.lineWidth = 20;
        ctx.lineCap = 'round';
        ctx.globalAlpha = 1.0; // полностью непрозрачная кисть

        ctx.beginPath();
        ctx.moveTo(lastPos.x, lastPos.y);
        ctx.lineTo(currentX, currentY);
        ctx.stroke();

        setLastPos({ x: currentX, y: currentY });
    };


    const clearMask = () => {
        if (!canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    };

    useEffect(() => {
        clearMask();
        setResultImage(null);
    }, [imageURL]);

    const handleGenerateClick = async () => {
        if (!prompt.trim()) {
            alert('Пожалуйста, введите промпт.');
            return;
        }
        if (!imageFile) {
            alert('Пожалуйста, загрузите изображение.');
            return;
        }

        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('prompt', prompt);
            formData.append('character_name', 'MyCharacter'); // обязательно!
            formData.append('init_image', imageFile);

            // Получаем blob маски из canvas (формат PNG)
            const maskBlob = await new Promise((resolve) =>
                canvasRef.current.toBlob(resolve, 'image/png')
            );
            formData.append('mask_image', maskBlob);

            const response = await fetch('http://localhost:8000/edit-character', { // полный адрес
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Ошибка на сервере');
            }

            const data = await response.json();

            navigate('/result-main', {
                state: {
                    images: [`data:image/png;base64,${data.images[0]}`], // оборачиваем в массив
                    prompts: [prompt], // тоже массив
                    storyline: 'Изменено в редакторе', // можно оставить пустым, если не используется
                },
            });


        } catch (error) {
            alert('Ошибка генерации: ' + error.message);
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="generate-container" style={{ maxWidth: 600, margin: '30px auto', padding: 20 }}>
            <h1 style={{ textAlign: 'center', marginBottom: 20 }}>
                Редактирование изображения (Image2Image с маской)
            </h1>

            <p style={{ fontSize: 14, color: '#555', marginBottom: 20 }}>
                Загрузите ваше изображение, выделите кисточкой область для изменения, введите промпт и нажмите
                "Начать генерацию".
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

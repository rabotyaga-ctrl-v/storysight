import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Generate.css';

export default function GenerateCharacter() {
    const navigate = useNavigate();

    const [prompt, setPrompt] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imageURL, setImageURL] = useState(null);
    const [loading, setLoading] = useState(false);

    const [isLoggedIn, setIsLoggedIn] = useState(null);
    const [showLoginModal, setShowLoginModal] = useState(false);

    const canvasRef = useRef(null);
    const imgRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        fetch('http://storysight.ru/api/auth/me', {
            credentials: 'include',
        })
            .then(res => {
                if (res.ok) return res.json();
                throw new Error('Неавторизован');
            })
            .then(() => setIsLoggedIn(true))
            .catch(() => setIsLoggedIn(false));
    }, []);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImageFile(file);
        const url = URL.createObjectURL(file);
        setImageURL(url);
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

        ctx.strokeStyle = 'white';
        ctx.lineWidth = 20;
        ctx.lineCap = 'round';
        ctx.globalAlpha = 1.0;

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
    }, [imageURL]);

    const handleGenerateClick = async () => {
        if (!isLoggedIn) {
            setShowLoginModal(true);
            return;
        }

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
            formData.append('character_name', 'MyCharacter');
            formData.append('init_image', imageFile);

            const maskBlob = await new Promise((resolve) =>
                canvasRef.current.toBlob(resolve, 'image/png')
            );
            formData.append('mask_image', maskBlob);

            const response = await fetch('http://storysight.ru/api/edit-character', {
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
                    images: [`data:image/png;base64,${data.images[0]}`],
                    prompts: [prompt],
                    storyline: 'Изменено в редакторе',
                },
            });
        } catch (error) {
            alert('Ошибка генерации: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Telegram Login Widget
    useEffect(() => {
        if (!showLoginModal) return;

        window.TelegramLoginWidget = {
            dataOnauth: function (user) {
                fetch('http://storysight.ru/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify(user),
                })
                    .then((res) => {
                        if (!res.ok) throw new Error('Ошибка авторизации');
                        return res.json();
                    })
                    .then(() => {
                        setIsLoggedIn(true);
                        setShowLoginModal(false);
                    })
                    .catch((err) => alert('Ошибка авторизации: ' + err.message));
            },
        };

        const script = document.createElement('script');
        script.src = 'https://telegram.org/js/telegram-widget.js?22';
        script.setAttribute('data-telegram-login', 'zavod_worker_bot'); // без @
        script.setAttribute('data-size', 'large');
        script.setAttribute('data-userpic', 'false');
        script.setAttribute('data-request-access', 'write');
        script.setAttribute('data-onauth', 'TelegramLoginWidget.dataOnauth(user)');
        script.async = true;

        const container = document.getElementById('tg-login-button');
        container.innerHTML = '';
        container.appendChild(script);
    }, [showLoginModal]);

    return (
        <div className="generate-container" style={{ maxWidth: 600, margin: '30px auto', padding: 20 }}>
            <h1 className="generate-title" style={{ marginBottom: 20 }}>
                Редактирование изображения (Image2Image с маской)
            </h1>

            <p style={{ fontSize: 14, color: '#555', marginBottom: 20 }}>
                Загрузите изображение, выделите область для изменения, введите промпт и нажмите "Начать генерацию".
            </p>

            <textarea
                className="generate-textarea"
                placeholder="Опишите, что хотите добавить или изменить..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
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

            <div className="generate-nav">
                <button
                    onClick={() => navigate(-1)}
                    disabled={loading}
                    className="generate-btn"
                    style={{ flex: 1, backgroundColor: '#fff', color: '#6b4c9a', border: '2px solid #b76aff' }}
                >
                    Назад
                </button>

                <button
                    onClick={handleGenerateClick}
                    disabled={loading}
                    className="generate-btn"
                    style={{ flex: 2 }}
                >
                    {loading ? 'Генерация...' : 'Начать генерацию'}
                </button>
            </div>

            {showLoginModal && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 1000,
                    }}
                    onClick={() => setShowLoginModal(false)}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            backgroundColor: 'white',
                            padding: 20,
                            borderRadius: 10,
                            maxWidth: 400,
                            width: '90%',
                            textAlign: 'center',
                            color: '#000'
                        }}
                    >
                        <p>Для генерации нужно войти через Telegram</p>
                        <div id="tg-login-button" style={{ marginBottom: 10 }} />
                        <button
                            onClick={() => setShowLoginModal(false)}
                            style={{
                                padding: '6px 12px',
                                borderRadius: 6,
                                border: '1px solid #ccc',
                                backgroundColor: 'white',
                                cursor: 'pointer',
                            }}
                        >
                            Отмена
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

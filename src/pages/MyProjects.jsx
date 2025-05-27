import React, { useEffect, useState } from "react";

export default function MyProjects() {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("tg_user"));
        if (!user) {
            console.error("Пользователь не авторизован");
            return;
        }

        fetch("http://localhost:8000/api/my-projects/", {
            headers: {
                "X-Telegram-ID": user.id,
            },
        })
            .then((res) => {
                if (!res.ok) {
                    throw new Error("Ошибка при получении проектов");
                }
                return res.json();
            })
            .then((data) => {
                console.log("Полученные изображения:", data);
                setImages(data);
            })
            .catch((err) => {
                console.error("Ошибка загрузки:", err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    return (
        <div style={{ padding: "20px" }}>
            <h2>Мои проекты</h2>

            {loading ? (
                <p>Загрузка...</p>
            ) : images.length === 0 ? (
                <p>Проекты не найдены.</p>
            ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
                    {images.map((image) => {
                        const imgSrc = image.image_data.startsWith("data:")
                            ? image.image_data
                            : `data:image/webp;base64,${image.image_data}`;

                        return (
                            <div key={image.id} style={{ width: "200px" }}>
                                <img
                                    src={imgSrc}
                                    alt={`Проект ${image.id}`}
                                    style={{
                                        width: "100%",
                                        borderRadius: "8px",
                                        boxShadow: "0 0 5px rgba(0,0,0,0.3)",
                                    }}
                                />
                                <p style={{ fontSize: "0.85rem", marginTop: "5px" }}>
                                    {image.prompt}
                                </p>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

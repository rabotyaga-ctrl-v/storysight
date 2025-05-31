// src/pages/myprojects.js
import React, { useEffect, useState } from "react";
import axios from "axios";

const MyProjects = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("http://storysight.ru/my-projects")
      .then((res) => {
        setImages(res.data);
      })
      .catch((err) => {
        console.error("Ошибка при загрузке изображений:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen px-6 py-10 bg-gradient-to-br from-pink-200 to-purple-300">
      <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">Мои проекты</h1>

      {loading ? (
        <p className="text-center text-gray-600">Загрузка...</p>
      ) : images.length === 0 ? (
        <p className="text-center text-gray-600">Пока нет ни одного изображения</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {images.map((img) => (
            <div key={img.id} className="bg-white rounded-2xl shadow-lg p-4">
              <img
                src={`data:image/png;base64,${img.url}`}
                alt={img.title || "Изображение"}
                className="rounded-xl mb-2"
              />
              {img.title && <p className="text-center text-sm text-gray-700">{img.title}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyProjects;


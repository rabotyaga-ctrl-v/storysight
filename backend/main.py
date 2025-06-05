# main.py

import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from db import init_db
from auth import auth_router
from generate import generate_router
from manual import manual_router
from edit import edit_router
from translate import translate_router

# Устанавливаем прокси перед всеми запросами
os.environ["HTTP_PROXY"] = "socks5h://127.0.0.1:1080"
os.environ["HTTPS_PROXY"] = "socks5h://127.0.0.1:1080"

# Загрузка переменных окружения
load_dotenv()

# Инициализация БД
init_db()

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("backend.log"),
        logging.StreamHandler()
    ]
)

# Инициализация FastAPI
app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://storysight.ru"],  # На проде заменить на домен
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Роуты
app.include_router(auth_router)
app.include_router(generate_router)
app.include_router(manual_router)
app.include_router(edit_router)
app.include_router(translate_router)

# Запуск сервера
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

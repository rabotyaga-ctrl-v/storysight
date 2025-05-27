import logging
import base64
import requests
from fastapi import FastAPI, HTTPException, Depends
from sqlalchemy.orm import Session
from db import SessionLocal, init_db, User
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import openai
import os

init_db()

# Настройка базового логирования
logging.basicConfig(
    level=logging.INFO,  # уровень логирования — можно DEBUG, INFO, WARNING, ERROR
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("backend.log"),  # пишет логи в файл backend.log
        logging.StreamHandler()  # и одновременно в консоль
    ]
)

logger = logging.getLogger(__name__)

# --- Загрузка переменных из .env ---
load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
STABILITY_API_KEY = os.getenv("STABILITY_API_KEY")
TELEGRAM_BOT_TOKEN = os.getenv("BOT_TOKEN")

if not OPENAI_API_KEY or STABILITY_API_KEY == "placeholder_key_for_now":
    print("Внимание: используется заглушка OPENAI_API_KEY. Замените на реальный ключ.")
#if not STABILITY_API_KEY:
    #raise RuntimeError("Не найден STABILITY_API_KEY в переменных окружения. Проверьте файл .env")

if not TELEGRAM_BOT_TOKEN:
    print("Внимание: не найден TELEGRAM_BOT_TOKEN. Добавьте BOT_TOKEN в .env")


openai.api_key = OPENAI_API_KEY

# --- Модели данных ---
class CharacterPrompt(BaseModel):
    text: str
    style: str  # cartoon, anime, vangogh

class PlotExpandRequest(BaseModel):
    text: str

class PlotGenerateRequest(BaseModel):
    prompt: str

# --- FastAPI ---
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # на проде заменить на конкретный домен
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Получаем сессию БД в запросах
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

#проверка всех пользователей

@app.get("/users/")
async def get_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [{"id": u.id, "telegram_id": u.telegram_id, "username": u.username, "created_at": u.created_at.isoformat()} for u in users]

class TelegramUserData(BaseModel):
    id: int  # telegram_id
    username: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    auth_date: int  # timestamp

@app.post("/auth/telegram/")
async def save_telegram_user(user_data: TelegramUserData, db: Session = Depends(get_db)):
    logger.info(f"Получен запрос на сохранение пользователя: telegram_id={user_data.id}, username={user_data.username}")
    # Проверка есть ли пользователь в БД
    db_user = db.query(User).filter(User.telegram_id == user_data.id).first()

    if not db_user:
        # Создаём нового
        db_user = User(
            telegram_id=user_data.id,
            username=user_data.username,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            auth_date=datetime.utcfromtimestamp(user_data.auth_date)
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        logger.info(f"Создан новый пользователь с telegram_id={user_data.id}")
    else:
        # Можно обновить данные, если нужно
        db_user.username = user_data.username
        db_user.first_name = user_data.first_name
        db_user.last_name = user_data.last_name
        db_user.auth_date = datetime.utcfromtimestamp(user_data.auth_date)
        db.commit()
        logger.info(f"Обновлены данные пользователя с telegram_id={user_data.id}")

    return {"message": "Пользователь сохранён", "user_id": db_user.telegram_id}

# --- Функция генерации изображения SD ---
def generate_sd_image(prompt: str) -> str:
    url = "https://api.stability.ai/v2beta/stable-image/generate/ultra"

    headers = {
        "authorization": f"Bearer {STABILITY_API_KEY}",
        "accept": "image/*",
    }

    files = {"none": ""}
    data = {
        "prompt": prompt,
        "output_format": "webp",
        "samples": 1,
    }

    response = requests.post(url, headers=headers, files=files, data=data)
    if response.status_code != 200:
        raise HTTPException(status_code=500, detail=f"Ошибка генерации изображения: {response.text}")

    img_base64 = base64.b64encode(response.content).decode("utf-8")
    return img_base64

# --- Эндпоинт генерации персонажа ---
@app.post("/generate-character/")
async def generate_character(prompt: CharacterPrompt):
    style_map = {
        "cartoon": "cartoon style",
        "anime": "anime style",
        "vangogh": "vangogh style"
    }
    style_suffix = style_map.get(prompt.style, "")
    full_prompt = f"{prompt.text} {style_suffix}".strip()

    img_base64 = generate_sd_image(full_prompt)

    return {"prompt_with_style": full_prompt, "image_base64": img_base64}

# --- Эндпоинт расширения и улучшения сюжета ---
@app.post("/plot/expand/")
async def plot_expand(request: PlotExpandRequest):
    try:
        # Перевод на английский
        translation_response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant translator."},
                {"role": "user", "content": f"Please translate the following text into English: {request.text}"}
            ],
            temperature=0.3,
            max_tokens=1000,
        )
        translated_text = translation_response['choices'][0]['message']['content']

        # Расширение и улучшение текста
        expanded_response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a creative writing assistant specialized in plot enhancement."},
                {"role": "user", "content": f"Please elaborate and enrich this story plot in English: {translated_text}"}
            ],
            temperature=0.7,
            max_tokens=1500,
        )
        expanded_text = expanded_response['choices'][0]['message']['content']

        return {"expanded_plot": expanded_text}
    except Exception as e:
        logger.error(f"Ошибка генерации сюжета: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Ошибка генерации сюжета: {str(e)}")

# --- Эндпоинт генерации изображений сюжета ---
@app.post("/plot/generate/")
async def plot_generate(request: PlotGenerateRequest):
    prompt = request.prompt

    images = []
    try:
        for _ in range(4):
            img = generate_sd_image(prompt)
            images.append(img)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка генерации изображений: {str(e)}")

    return {"images": images}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)

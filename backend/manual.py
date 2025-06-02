from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import List, Generator
import os
import requests
import logging
from sqlalchemy.orm import Session
from sqlalchemy import desc
from db import SessionLocal, User, Image  # Твои ORM модели и сессия

manual_router = APIRouter()
logger = logging.getLogger(__name__)

# --- Pydantic модели ---

class ManualRequest(BaseModel):
    style: str
    question1: str
    question2: str
    question3: str
    num_images: int

class ImageWithPrompt(BaseModel):
    url: str
    prompt: str

class ManualResponse(BaseModel):
    images: List[ImageWithPrompt]
    storyline: str

class SaveProjectRequest(BaseModel):
    storyline: str
    prompts: List[str]
    images: List[str]  # base64 изображения или ссылки

# --- DB Dependency ---

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Генерация сцен с ChatGPT ---

def generate_scenes_with_chatgpt(prompt_text: str, style: str, num_images: int):
    from openai import OpenAI

    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY не найден в окружении")

    client = OpenAI(api_key=OPENAI_API_KEY)

    system = "Ты помогаешь создавать короткие сценки для иллюстраций."
    user_prompt = f"""
Translate and improve the following text into English. Then divide it into exactly {num_images} scenes for images. 
Each scene must be up to 20 words and numbered. 
Use style: {style}. 
Do not invent new characters or change the description. 
Format response:

Storyline: <improved translated text>

1: <scene 1>
...
{num_images}: <scene {num_images}>

Text: {prompt_text}
"""

    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.3,
        top_p=0.9
    )

    content = response.choices[0].message.content.strip()
    logger.info(f"ChatGPT response content:\n{content}")

    lines = content.splitlines()

    storyline_lines = []
    prompts = []
    reading_storyline = False

    for line in lines:
        if line.lower().startswith("storyline:"):
            reading_storyline = True
            storyline_line = line.split(":", 1)[1].strip()
            if storyline_line:
                storyline_lines.append(storyline_line)
            continue

        if reading_storyline:
            if not line.strip():
                reading_storyline = False
                continue
            storyline_lines.append(line.strip())
            continue

        if ":" in line:
            parts = line.split(":", 1)
            if parts[0].strip().isdigit():
                prompts.append(parts[1].strip())

    storyline = " ".join(storyline_lines).strip()

    if not storyline or len(prompts) < num_images:
        raise HTTPException(status_code=500, detail="Не удалось распарсить ответ ChatGPT")

    return storyline, prompts

# --- Генерация изображений с Stability API ---

def generate_image_stability(prompt: str, style: str) -> str:
    STABILITY_API_KEY = os.getenv("STABILITY_API_KEY")
    if not STABILITY_API_KEY:
        raise HTTPException(status_code=500, detail="STABILITY_API_KEY не найден в окружении")

    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": f"Bearer {STABILITY_API_KEY}"
    }

    json_data = {
        "text_prompts": [
            {"text": prompt, "weight": 1.0},
            {"text": "blurry, low quality, distorted, watermark, bad anatomy", "weight": -1}
        ],
        "cfg_scale": 7,
        "height": 1024,
        "width": 1024,
        "samples": 1,
        "steps": 40,
        "style_preset": style,
    }

    response = requests.post(
        "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image",
        headers=headers,
        json=json_data
    )

    if response.status_code != 200:
        logger.error(f"Stability API error: {response.text}")
        raise HTTPException(status_code=500, detail=f"Генерация изображения не удалась: {response.text}")

    base64_image = response.json()["artifacts"][0]["base64"]
    return base64_image

# --- Эндпоинты ---

@manual_router.post("/generate-manual")
def generate_manual(req: ManualRequest, request: Request, db: Session = Depends(get_db)):
    combined_text = (
        f"Describe the character: {req.question1}\n"
        f"Product or service: {req.question2}\n"
        f"Story plot: {req.question3}"
    )

    telegram_id = request.cookies.get("telegram_id")
    if not telegram_id:
        raise HTTPException(status_code=401, detail="Неавторизован")

    try:
        telegram_id = int(telegram_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Некорректный telegram_id")

    user = db.query(User).filter(User.telegram_id == telegram_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    try:
        storyline, prompts = generate_scenes_with_chatgpt(combined_text, req.style, req.num_images)

        images_with_prompts = []
        for prompt in prompts[:req.num_images]:
            base64_img = generate_image_stability(prompt, req.style)
            images_with_prompts.append({
                "url": base64_img,
                "prompt": prompt
            })

        return {
            "storyline": storyline,
            "images": images_with_prompts
        }

    except Exception as e:
        logger.exception("Ошибка в /generate-manual")
        raise HTTPException(status_code=500, detail=str(e))

@manual_router.post("/save-project")
def save_project(data: SaveProjectRequest, request: Request, db: Session = Depends(get_db)):
    telegram_id = request.cookies.get("telegram_id")
    if not telegram_id:
        raise HTTPException(status_code=401, detail="Неавторизован")

    try:
        telegram_id = int(telegram_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Некорректный telegram_id")

    user = db.query(User).filter(User.telegram_id == telegram_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    if len(data.images) != len(data.prompts):
        raise HTTPException(status_code=400, detail="Количество изображений и подсказок не совпадает")

    saved_count = 0
    for i, (url, prompt) in enumerate(zip(data.images, data.prompts)):
        existing = db.query(Image).filter_by(user_id=user.id, url=url).first()
        if existing:
            continue  # пропускаем, если уже есть такое изображение для пользователя

        img = Image(
            user_id=user.id,
            title=f"Сцена {i + 1}: {prompt}",
            url=url,
            storyline=data.storyline
        )
        db.add(img)
        saved_count += 1

    if saved_count > 0:
        db.commit()
        return {"message": f"Сохранено изображений: {saved_count}"}
    else:
        return {"message": "Все изображения уже сохранены ранее"}

@manual_router.get("/my-projects")
def get_my_projects(request: Request, db: Session = Depends(get_db)):
    telegram_id = request.cookies.get("telegram_id")
    if not telegram_id:
        raise HTTPException(status_code=401, detail="Неавторизован")

    try:
        telegram_id = int(telegram_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Некорректный telegram_id")

    user = db.query(User).filter(User.telegram_id == telegram_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    images = db.query(Image).filter(Image.user_id == user.id).order_by(desc(Image.created_at)).all()

    return [
        {
            "id": img.id,
            "url": img.url,
            "title": img.title,
            "storyline": img.storyline,
            "created_at": img.created_at.isoformat() if img.created_at else None
        }
        for img in images
    ]

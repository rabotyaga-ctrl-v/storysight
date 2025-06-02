# generate.py

import os
import logging
from typing import List, Tuple

import requests
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from db import SessionLocal, User, Image
from auth import get_current_user  # предполагаю, что get_current_user отдаёт User модель из БД

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None

generate_router = APIRouter()
logger = logging.getLogger(__name__)

CHARACTER_LIST = [
    {"name": "black bear", "seed": 987987},
    {"name": "cat", "seed": 597524},
    {"name": "cockatiel", "seed": 757511},
    {"name": "raven", "seed": 588768},
    {"name": "tiger", "seed": 328513}
]

class ComicRequest(BaseModel):
    prompt: str
    character_name: str
    num_images: int

class ComicResponse(BaseModel):
    images: List[str]
    storyline: str
    prompts: List[str]

class SaveProjectRequest(BaseModel):
    storyline: str
    prompts: List[str]
    images: List[str]

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_seed_by_character(name: str) -> int:
    for character in CHARACTER_LIST:
        if character["name"] == name:
            return character["seed"]
    raise HTTPException(status_code=400, detail="Unknown character")

def process_prompt_with_chatgpt(prompt: str, num: int, selected_character_name: str) -> Tuple[str, List[str]]:
    if OpenAI is None:
        raise HTTPException(status_code=500, detail="OpenAI SDK not installed")

    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")

    client = OpenAI(api_key=OPENAI_API_KEY)

    system_msg = "Ты помогаешь создавать короткие сценки для комиксов."
    user_msg = f"""
Переведи и улучшИ следующий текст на английский язык. Затем разбей его точно на {num} сцену(ы) для комикса. 
Каждая сцена должна содержать максимум 20 слов и быть пронумерована. 
Строго соблюдай количество сцен — не больше и не меньше числа: {num}.

Используй только выбранного персонажа: {selected_character_name}. Не придумывай новых имён и не меняй вид персонажа.
Все сцены описывают действия только этого персонажа.

Формат ответа:

Storyline: <переведённый и улучшенный текст>

1: <scene 1>
...
{num}: <scene {num}>

Текст: {prompt}
"""

    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": system_msg},
            {"role": "user", "content": user_msg}
        ],
        temperature=0.2,
        top_p=0.8,
    )

    content = response.choices[0].message.content.strip()
    logger.debug(f"ChatGPT response:\n{content}")

    lines = [line.strip() for line in content.splitlines() if line.strip()]

    storyline = ""
    prompts = []

    for line in lines:
        if line.lower().startswith("storyline:"):
            storyline = line.split(":", 1)[1].strip()
        elif ":" in line:
            num_part, text_part = line.split(":", 1)
            if num_part.strip().isdigit():
                prompts.append(text_part.strip())

    if not storyline or len(prompts) < num:
        raise HTTPException(status_code=500, detail="Ошибка разбора ответа ChatGPT")

    return storyline, prompts[:num]

def generate_image(prompt: str, seed: int) -> str:
    STABILITY_API_KEY = os.getenv("STABILITY_API_KEY")
    if not STABILITY_API_KEY:
        raise HTTPException(status_code=500, detail="Stability API key not configured")

    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": f"Bearer {STABILITY_API_KEY}"
    }

    json_data = {
        "text_prompts": [
            {"text": prompt, "weight": 0.5},
            {"text": "blurry, low quality, distorted, watermark, bad anatomy", "weight": -1}
        ],
        "cfg_scale": 7,
        "height": 1024,
        "width": 1024,
        "samples": 1,
        "steps": 40,
        "style_preset": "comic-book",
        "seed": seed,
    }

    response = requests.post(
        "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image",
        headers=headers,
        json=json_data
    )

    if response.status_code != 200:
        logger.error(f"Stability API error: {response.status_code} - {response.text}")
        raise HTTPException(status_code=500, detail=f"Image generation failed: {response.text}")

    base64_image = response.json()["artifacts"][0]["base64"]
    return base64_image

@generate_router.post("/generate-comic", response_model=ComicResponse)
def generate_comic(req: ComicRequest, db: Session = Depends(get_db)):
    try:
        seed = get_seed_by_character(req.character_name)
        storyline, prompts = process_prompt_with_chatgpt(req.prompt, req.num_images, req.character_name)

        images = [generate_image(p, seed) for p in prompts]
        return ComicResponse(images=images, storyline=storyline, prompts=prompts)

    except Exception as e:
        logger.error(f"Ошибка генерации комикса: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@generate_router.post("/save-project")
def save_project(
    data: SaveProjectRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    saved_count = 0

    try:
        for i, image_url in enumerate(data.images):
            prompt_text = data.prompts[i] if i < len(data.prompts) else "Без промпта"

            existing = db.query(Image).filter_by(user_id=current_user.id, url=image_url).first()
            if existing:
                continue  # пропускаем дубликаты

            img = Image(
                user_id=current_user.id,
                title=f"Сцена {i + 1}: {prompt_text}",
                url=image_url,
                storyline=data.storyline
            )
            db.add(img)
            saved_count += 1

        if saved_count > 0:
            db.commit()
            return {"status": "ok", "message": f"Сохранено изображений: {saved_count}"}
        else:
            return {"status": "ok", "message": "Все изображения уже были сохранены"}

    except Exception as e:
        logger.error(f"Ошибка сохранения проекта: {str(e)}")
        raise HTTPException(status_code=500, detail="Ошибка при сохранении проекта")

@generate_router.get("/my-projects")
def get_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    images = db.query(Image).filter_by(user_id=current_user.id).order_by(Image.id.desc()).all()
    result = [
        {
            "id": img.id,
            "title": img.title,
            "url": img.url,
            "storyline": img.storyline,
            "created_at": img.created_at.isoformat() if img.created_at else None,
        }
        for img in images
    ]
    return JSONResponse(content=result)

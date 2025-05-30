# generate.py

import os
import requests
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List

generate_router = APIRouter()
logger = logging.getLogger(__name__)

# --- Константы и модели ---
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

# --- Логика генерации ---

def get_seed_by_character(name: str) -> int:
    for character in CHARACTER_LIST:
        if character["name"] == name:
            return character["seed"]
    raise ValueError("Unknown character")

def process_prompt_with_chatgpt(prompt: str, num: int, selected_character_name: str) -> (str, List[str]):
    from openai import OpenAI  # безопасно импортировать тут
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    client = OpenAI(api_key=OPENAI_API_KEY)

    system = "Ты помогаешь создавать короткие сценки для комиксов."
    user = f"""
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
            {"role": "system", "content": system},
            {"role": "user", "content": user}
        ],
        temperature=0.2,
        top_p=0.8
    )

    content = response.choices[0].message.content.strip()
    print(content)
    lines = [line for line in content.splitlines() if line.strip()]

    storyline = ""
    prompts = []

    for line in lines:
        if line.lower().startswith("storyline:"):
            storyline = line.split(":", 1)[1].strip()
        elif ":" in line:
            parts = line.split(":", 1)
            if parts[0].strip().isdigit():
                prompts.append(parts[1].strip())

    if not storyline or len(prompts) < num:
        raise HTTPException(status_code=500, detail="Ошибка разбора ответа ChatGPT")

    return storyline, prompts[:num]

def generate_image(prompt: str, seed: int) -> str:
    STABILITY_API_KEY = os.getenv("STABILITY_API_KEY")

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
        raise HTTPException(status_code=500, detail=f"Image generation failed: {response.text}")

    base64_image = response.json()["artifacts"][0]["base64"]
    return base64_image

# --- Endpoint генерации комикса ---
@generate_router.post("/generate-comic", response_model=ComicResponse)
def generate_comic(req: ComicRequest):
    try:
        seed = get_seed_by_character(req.character_name)
        # Передаём имя персонажа в функцию генерации текста
        storyline, prompts = process_prompt_with_chatgpt(req.prompt, req.num_images, req.character_name)

        images = [generate_image(p, seed) for p in prompts]
        return ComicResponse(images=images, storyline=storyline)

    except Exception as e:
        logger.error(f"Ошибка генерации комикса: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

from db import User, SessionLocal, Image
import requests
import logging
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import List
from fastapi.responses import JSONResponse
from PIL import Image as PILImage  # Чтобы не путать с моделью Image из db
import os


edit_router = APIRouter()
logger = logging.getLogger(__name__)


# --- Вспомогательная функция для получения расширения файла ---
def get_file_extension(filename: str) -> str:
    ext = os.path.splitext(filename)[1]
    if ext == '':
        ext = '.png'  # дефолтное расширение, если отсутствует
    return ext


# --- Модели ---

class ComicResponse(BaseModel):
    images: List[str]
    storyline: str
    prompts: List[str]


class SaveProjectRequest(BaseModel):
    storyline: str
    prompts: List[str]
    images: List[str]


# --- Функция улучшения и перевода промпта + генерация негативного ---
def process_prompt_with_chatgpt_edit(original_prompt: str) -> tuple[str, str]:
    from openai import OpenAI
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    client = OpenAI(api_key=OPENAI_API_KEY)

    default_negative = (
        "extra limbs, extra heads, deformed body, distorted face, duplicated features, low quality, blurry, bad anatomy, "
        "missing fingers, fused limbs, mutated hands, long neck, unrealistic proportions"
    )

    system = "Ты помогаешь создавать хорошие промпты для генерации изображений. На выходе дай два текста: основной промпт и негативный (чего избегать)."
    user = f"""
Переведи и улучшИ следующий текст на английский язык для генерации изображения. Сделай промпт коротким и выразительным.

Затем составь негативный промпт: напиши, чего следует избегать при генерации (например: лишние конечности, искажённые лица, размытие и т.п.).

Текст: {original_prompt}

Ответ верни в формате:
PROMPT: ...
NEGATIVE: ...
"""

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user}
            ],
            temperature=0.7,
            top_p=0.9,
        )
        content = response.choices[0].message.content.strip()
        lines = content.splitlines()

        prompt_line = next((line for line in lines if line.startswith("PROMPT:")), "")
        negative_line = next((line for line in lines if line.startswith("NEGATIVE:")), "")

        prompt = prompt_line.replace("PROMPT:", "").strip() if prompt_line else original_prompt
        negative = negative_line.replace("NEGATIVE:", "").strip() if negative_line else default_negative

        return prompt, negative
    except Exception as e:
        logger.error(f"Ошибка ChatGPT в process_prompt_with_chatgpt_edit: {e}")
        return original_prompt, default_negative


# --- Изменение размера маски под init_image ---
def resize_mask_to_init(init_path: str, mask_path: str) -> None:
    init_img = PILImage.open(init_path)
    mask_img = PILImage.open(mask_path)

    if init_img.size != mask_img.size:
        logger.info(f"Размер init_image: {init_img.size}, размер mask_image: {mask_img.size}. Изменяем размер маски.")
        mask_resized = mask_img.resize(init_img.size, PILImage.LANCZOS)
    else:
        mask_resized = mask_img

    mask_resized = mask_resized.convert("L")

    threshold = 128
    mask_bin = mask_resized.point(lambda p: 255 if p > threshold else 0)

    mask_bin.save(mask_path)


# --- Генерация изображения с маской (inpainting) ---
def generate_inpaint_image(init_image_path: str, mask_image_path: str, prompt: str, negative_prompt: str) -> str:
    STABILITY_API_KEY = os.getenv("STABILITY_API_KEY")
    api_host = "https://api.stability.ai/v2beta"

    headers = {
        "Authorization": f"Bearer {STABILITY_API_KEY}",
        "accept": "image/*"
    }

    files = {
        "image": open(init_image_path, "rb"),
        "mask": open(mask_image_path, "rb"),
    }

    data = {
        "prompt": prompt,
        "negative_prompt": negative_prompt,
        "cfg_scale": 25,
        "steps": 40,
        "samples": 1,
        "output_format": "png"
    }

    try:
        mask_img_debug = PILImage.open(mask_image_path)
        logger.info(f"Маска перед отправкой в API: размер {mask_img_debug.size}, режим {mask_img_debug.mode}")
        mask_debug_path = os.path.join(os.path.dirname(mask_image_path), "debug_mask_check.png")
        mask_img_debug.save(mask_debug_path)
        logger.info(f"Маска сохранена для проверки: {mask_debug_path}")
    except Exception as e:
        logger.error(f"Ошибка при логировании маски: {e}")

    response = requests.post(
        f"{api_host}/stable-image/edit/inpaint",
        headers=headers,
        files=files,
        data=data
    )

    files["image"].close()
    files["mask"].close()

    if response.status_code != 200:
        logger.error(f"Ошибка генерации inpaint изображения: {response.text}")
        raise HTTPException(status_code=500, detail=f"Inpaint генерация не удалась: {response.text}")

    import base64
    base64_img = base64.b64encode(response.content).decode("utf-8")
    return base64_img


# --- Endpoint для редактирования персонажа ---
@edit_router.post("/edit-character", response_model=ComicResponse)
async def edit_character_inpaint(
        prompt: str = Form(...),
        character_name: str = Form(...),
        init_image: UploadFile = File(...),
        mask_image: UploadFile = File(...)
):
    import tempfile
    import shutil

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=get_file_extension(init_image.filename)) as tmp_init_file:
            shutil.copyfileobj(init_image.file, tmp_init_file)
            init_image_path = tmp_init_file.name
            logger.info(f"init_image сохранён во временный файл: {init_image_path}")

        with tempfile.NamedTemporaryFile(delete=False, suffix=get_file_extension(mask_image.filename)) as tmp_mask_file:
            shutil.copyfileobj(mask_image.file, tmp_mask_file)
            mask_image_path = tmp_mask_file.name
            logger.info(f"mask_image сохранён во временный файл: {mask_image_path}")

        # Улучшаем и получаем позитивный и негативный промпт
        improved_prompt, negative_prompt = process_prompt_with_chatgpt_edit(prompt)

        # Подгоняем размер маски
        resize_mask_to_init(init_image_path, mask_image_path)

        # Генерация
        base64_img = generate_inpaint_image(init_image_path, mask_image_path, improved_prompt, negative_prompt)

        # Очистка
        os.remove(init_image_path)
        os.remove(mask_image_path)

        return ComicResponse(
            images=[base64_img],
            storyline="Inpaint result generated",
            prompts=[improved_prompt]
        )

    except Exception as e:
        logger.error(f"Ошибка inpaint генерации изображения: {e}")
        try:
            if 'init_image_path' in locals() and os.path.exists(init_image_path):
                os.remove(init_image_path)
            if 'mask_image_path' in locals() and os.path.exists(mask_image_path):
                os.remove(mask_image_path)
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=str(e))

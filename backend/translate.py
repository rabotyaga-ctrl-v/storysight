from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from deep_translator import GoogleTranslator

translate_router = APIRouter()

class PromptRequest(BaseModel):
    prompts: list[str]

@translate_router.post("/translate-prompts")
async def translate_prompts(data: PromptRequest):
    try:
        translator = GoogleTranslator(source='auto', target='ru')
        translated = [translator.translate(p) for p in data.prompts]
        return {"translated_prompts": translated}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

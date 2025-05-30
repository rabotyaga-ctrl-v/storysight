# auth.py

import logging
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from db import SessionLocal, User

auth_router = APIRouter()
logger = logging.getLogger(__name__)


# Pydantic-модель данных пользователя Telegram
class TelegramUserData(BaseModel):
    id: int  # telegram_id
    username: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    auth_date: int  # timestamp


# Получаем сессию БД
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Получение всех пользователей
@auth_router.get("/users/")
async def get_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [
        {
            "id": u.id,
            "telegram_id": u.telegram_id,
            "username": u.username,
            "created_at": u.created_at.isoformat()
        }
        for u in users
    ]


# Сохранение или обновление пользователя Telegram
@auth_router.post("/auth/telegram/")
async def save_telegram_user(user_data: TelegramUserData, db: Session = Depends(get_db)):
    logger.info(f"Получен запрос на сохранение пользователя: telegram_id={user_data.id}, username={user_data.username}")

    db_user = db.query(User).filter(User.telegram_id == user_data.id).first()

    if not db_user:
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
        db_user.username = user_data.username
        db_user.first_name = user_data.first_name
        db_user.last_name = user_data.last_name
        db_user.auth_date = datetime.utcfromtimestamp(user_data.auth_date)
        db.commit()
        logger.info(f"Обновлены данные пользователя с telegram_id={user_data.id}")

    return {"message": "Пользователь сохранён", "user_id": db_user.telegram_id}

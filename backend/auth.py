import logging
from datetime import datetime
from fastapi import APIRouter, Depends, Request, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from db import SessionLocal, User, Image

auth_router = APIRouter()
logger = logging.getLogger(__name__)

class TelegramUserData(BaseModel):
    id: int
    username: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    auth_date: int

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

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

@auth_router.post("/auth/login")
async def login(user_data: TelegramUserData, db: Session = Depends(get_db)):
    logger.info(f"Логин пользователя: telegram_id={user_data.id}, username={user_data.username}")
    db_user = db.query(User).filter(User.telegram_id == user_data.id).first()

    if not db_user:
        db_user = User(
            telegram_id=user_data.id,
            username=user_data.username,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            auth_date=datetime.utcfromtimestamp(user_data.auth_date),
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

    response = JSONResponse(content={"message": "Успешный логин"})
    response.set_cookie(
        key="telegram_id",
        value=str(db_user.telegram_id),
        httponly=True,
        max_age=7 * 24 * 3600
    )
    return response

@auth_router.post("/auth/logout")
async def logout(response: JSONResponse):
    response = JSONResponse(content={"message": "Вы вышли из аккаунта"})
    # Удаляем куки с telegram_id
    response.delete_cookie(key="telegram_id")
    return response

@auth_router.get("/auth/me")
async def get_current_user(request: Request, db: Session = Depends(get_db)):
    telegram_id = request.cookies.get("telegram_id")
    if not telegram_id:
        raise HTTPException(status_code=401, detail="Неавторизован")

    try:
        telegram_id = int(telegram_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Неверный telegram_id")

    db_user = db.query(User).filter(User.telegram_id == telegram_id).first()
    if not db_user:
        raise HTTPException(status_code=401, detail="Пользователь не найден")

    return {
        "telegram_id": db_user.telegram_id,
        "username": db_user.username,
        "first_name": db_user.first_name,
        "last_name": db_user.last_name,
    }

@auth_router.get("/my-projects")
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

    images = db.query(Image).filter(Image.user_id == user.id).all()

    return [
        {
            "id": image.id,
            "title": image.title,
            "storyline": image.storyline,
            "url": image.url,
            "created_at": image.created_at.isoformat()
        }
        for image in images
    ]

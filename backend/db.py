from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func, create_engine
from sqlalchemy.orm import sessionmaker, relationship, declarative_base

Base = declarative_base()

# Подключение к базе (укажи свой URI)
engine = create_engine("sqlite:///./app.db", connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(bind=engine)

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, nullable=True)
    first_name = Column(String, nullable=True)   # добавлено
    last_name = Column(String, nullable=True)    # добавлено
    auth_date = Column(DateTime, nullable=True)  # добавлено
    created_at = Column(DateTime, default=func.now())
    images = relationship("Image", back_populates="user")

class Image(Base):
    __tablename__ = 'images'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    title = Column(String, nullable=True)
    url = Column(String, nullable=False)
    created_at = Column(DateTime, default=func.now())
    user = relationship("User", back_populates="images")

def init_db():
    Base.metadata.create_all(bind=engine)
    print("База данных и таблицы успешно созданы.")

if __name__ == "__main__":
    init_db()

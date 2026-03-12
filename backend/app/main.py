from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.core.database import engine, Base
from app.core.config import settings
from app.models import User  # импорт моделей для регистрации
from app.api import auth, profiles  # добавляем profiles
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api import users
from app.api import reviews
from app.api import company_profiles
from app.api import company_reviews
from app.api import projects
from app.api import applications

# Создаём папку для загружаемых файлов
os.makedirs("uploads", exist_ok=True)

app = FastAPI(title="ПРОСВЕТ API")
# Base.metadata.drop_all(bind=engine)   # удаляет все таблицы
Base.metadata.create_all(bind=engine) # создаёт заново
print("Таблицы созданы (если не было ошибок)")

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
# Убираем prefix для profiles.router, так как в самом роутере уже есть /profiles в декораторах
app.include_router(profiles.router, tags=["profiles"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(reviews.router, tags=["reviews"])
app.include_router(company_profiles.router, tags=["client"])
app.include_router(company_reviews.router, tags=["company-reviews"])
app.include_router(projects.router, tags=["projects"])
app.include_router(applications.router, tags=["applications"])

@app.get("/debug/users")
def debug_users(db: Session = Depends(get_db)):
    return db.query(User).all()

@app.get("/")
def root():
    return {"message": "API работает"}
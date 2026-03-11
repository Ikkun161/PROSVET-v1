from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import create_access_token  # для токена
from app.models.user import User
from pydantic import BaseModel, EmailStr

router = APIRouter()

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: str

@router.post("/register")
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Сохраняем пароль как есть (без хеширования)
    user = User(
        email=user_data.email,
        password=user_data.password,
        role=user_data.role
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Создаём JWT токен
    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

@router.post("/login")
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    # Пароль пока хранится открыто – просто сравниваем строки
    if not user or user.password != login_data.password:
        raise HTTPException(status_code=401, detail="Неверный email или пароль")
    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}
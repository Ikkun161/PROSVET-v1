import os
import shutil
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.profile import Profile
from app.schemas.profile import ProfileCreate, ProfileOut

router = APIRouter()

# Папка для сохранения аватаров (создаётся при необходимости)
UPLOAD_DIR = "uploads/avatars"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/profiles", response_model=ProfileOut)
def create_profile(
    profile_data: ProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "analyst":
        raise HTTPException(status_code=403, detail="Only analysts can create profile")
    existing = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Profile already exists")
    profile = Profile(
        user_id=current_user.id,
        **profile_data.dict()
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile

@router.get("/profiles/me", response_model=ProfileOut)
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

@router.put("/profiles/me", response_model=ProfileOut)
def update_profile(
    profile_data: ProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    for key, value in profile_data.dict(exclude_unset=True).items():
        setattr(profile, key, value)
    db.commit()
    db.refresh(profile)
    return profile

@router.post("/profiles/avatar", response_model=ProfileOut)
async def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found. Please create profile first.")
    
    ext = os.path.splitext(file.filename)[1]
    filename = f"user_{current_user.id}_{int(datetime.utcnow().timestamp())}{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    profile.avatar = f"/uploads/avatars/{filename}"
    db.commit()
    db.refresh(profile)
    return profile

@router.get("/profiles/user/{user_id}", response_model=ProfileOut)
def get_profile_by_user_id(user_id: int, db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

@router.get("/profiles/analysts", response_model=list[ProfileOut])
def get_analysts(db: Session = Depends(get_db)):
    profiles = db.query(Profile).join(User).filter(User.role == "analyst").all()
    return profiles

@router.get("/profiles/user/{user_id}", response_model=ProfileOut)
def get_profile_by_user_id(user_id: int, db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile
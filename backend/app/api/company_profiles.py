import os
import shutil
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.company_profile import CompanyProfile
from app.models.company_review import CompanyReview
from app.schemas.company_profile import (
    CompanyProfileCreate,
    CompanyProfileUpdate,
    CompanyProfileOut,
    CompanyProfileWithRatingOut
)

router = APIRouter()

UPLOAD_DIR = "uploads/logos"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ========== Создание профиля компании ==========
@router.post("/client/profiles", response_model=CompanyProfileOut)
def create_company_profile(
    profile_data: CompanyProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "client":
        raise HTTPException(status_code=403, detail="Only clients can create a company profile")
    existing = db.query(CompanyProfile).filter(CompanyProfile.user_id == current_user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Company profile already exists")
    profile = CompanyProfile(
        user_id=current_user.id,
        **profile_data.dict()
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile

# ========== Получение своего профиля ==========
@router.get("/client/profiles/me", response_model=CompanyProfileOut)
def get_my_company_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile = db.query(CompanyProfile).filter(CompanyProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Company profile not found")
    return profile

# ========== Обновление своего профиля ==========
@router.put("/client/profiles/me", response_model=CompanyProfileOut)
def update_company_profile(
    profile_data: CompanyProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile = db.query(CompanyProfile).filter(CompanyProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Company profile not found")
    for key, value in profile_data.dict(exclude_unset=True).items():
        setattr(profile, key, value)
    db.commit()
    db.refresh(profile)
    return profile

# ========== Загрузка логотипа ==========
@router.post("/client/profiles/logo", response_model=CompanyProfileOut)
async def upload_logo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile = db.query(CompanyProfile).filter(CompanyProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Company profile not found")

    ext = os.path.splitext(file.filename)[1]
    filename = f"company_{current_user.id}_{int(datetime.utcnow().timestamp())}{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    profile.logo = f"/uploads/logos/{filename}"
    db.commit()
    db.refresh(profile)
    return profile

# ========== Получение списка всех компаний (с рейтингом) ==========
@router.get("/client/profiles", response_model=list[CompanyProfileWithRatingOut])
def get_all_company_profiles(db: Session = Depends(get_db)):
    """Публичный список всех компаний с рейтингом и количеством отзывов"""
    profiles = db.query(CompanyProfile).join(User).filter(User.role == "client").all()
    result = []
    for profile in profiles:
        avg = db.query(func.avg(CompanyReview.rating)).filter(CompanyReview.company_id == profile.user_id).scalar() or 0
        count = db.query(CompanyReview).filter(CompanyReview.company_id == profile.user_id).count()
        result.append({
            "id": profile.id,
            "user_id": profile.user_id,
            "company_name": profile.company_name,
            "description": profile.description,
            "website": profile.website,
            "industry": profile.industry,
            "founded_year": profile.founded_year,
            "logo": profile.logo,
            "average_rating": round(avg, 2),
            "review_count": count,
        })
    return result

# ========== Получение публичного профиля компании по user_id ==========
@router.get("/client/profiles/user/{user_id}", response_model=CompanyProfileOut)
def get_company_profile_by_user_id(user_id: int, db: Session = Depends(get_db)):
    """Публичный профиль компании по user_id"""
    profile = db.query(CompanyProfile).filter(CompanyProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Company profile not found")
    return profile
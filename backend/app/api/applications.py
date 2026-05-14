from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

# Импортируем нашу формулу
from app.ranking import calculate_total_score

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.project import Project
from app.models.application import Application
from app.models.profile import Profile
from app.models.review import Review
from app.schemas.application import (
    ApplicationCreate,
    ApplicationUpdateStatus,
    ApplicationOut,
    ApplicationWithAnalystOut,
    AnalystInfo
)

router = APIRouter()

@router.post("/applications", response_model=ApplicationOut)
def create_application(
    application_data: ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "analyst":
        raise HTTPException(status_code=403, detail="Only analysts can apply to projects")
    
    project = db.query(Project).filter(Project.id == application_data.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Проверяем, есть ли у этого аналитика уже отклик на эту специализацию в этом проекте
    existing = db.query(Application).filter(
        Application.project_id == application_data.project_id,
        Application.analyst_id == current_user.id,
        Application.specialization == application_data.specialization
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You have already applied for this specialization in this project")
    
    application = Application(
        project_id=application_data.project_id,
        analyst_id=current_user.id,
        specialization=application_data.specialization,
        message=application_data.message
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    return application

@router.get("/applications/my", response_model=List[ApplicationOut])
def get_my_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "analyst":
        raise HTTPException(status_code=403, detail="Only analysts have own applications")
    applications = db.query(Application).filter(Application.analyst_id == current_user.id).all()
    return applications

@router.get("/applications/project/{project_id}", response_model=List[ApplicationWithAnalystOut])
def get_project_applications(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Находим проект
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Проверка доступа: только создатель проекта может видеть отклики
    if project.company_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your project")
    
    # Получаем все отклики
    applications = db.query(Application).filter(Application.project_id == project_id).all()
    result = []
    
    for app in applications:
        # Инфо профиля и статистика
        analyst_profile = db.query(Profile).filter(Profile.user_id == app.analyst_id).first()
        avg_rating = db.query(func.avg(Review.rating)).filter(Review.analyst_id == app.analyst_id).scalar() or 0
        review_count = db.query(Review).filter(Review.analyst_id == app.analyst_id).count()
        
        # --- ВЫЗОВ ФОРМУЛЫ РАНЖИРОВАНИЯ ---
        # В project.category уже лежит скрыто определенная категория
        score = calculate_total_score(
            analyst_id=app.analyst_id, 
            target_project=project, 
            app_specialization=app.specialization, 
            db=db
        )
        
        analyst_info = AnalystInfo(
            id=app.analyst_id,
            full_name=analyst_profile.full_name if analyst_profile else "Анонимный аналитик",
            specialization=analyst_profile.specialization if analyst_profile else app.specialization,
            avatar=analyst_profile.avatar if analyst_profile else None,
            average_rating=round(float(avg_rating), 2),
            review_count=review_count,
            matching_score=score  # Передаем в схему
        )
        
        app_dict = {
            "id": app.id,
            "project_id": app.project_id,
            "analyst_id": app.analyst_id,
            "specialization": app.specialization,
            "message": app.message,
            "status": app.status,
            "created_at": app.created_at,
            "updated_at": app.updated_at,
            "analyst": analyst_info,
            "matching_score": score
        }
        result.append(app_dict)
    
    # Сортируем список по убыванию скора (лучшие сверху)
    result.sort(key=lambda x: x["matching_score"], reverse=True)
    return result

@router.put("/applications/{app_id}/status", response_model=ApplicationOut)
def update_application_status(
    app_id: int,
    status_data: ApplicationUpdateStatus,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    application = db.query(Application).filter(Application.id == app_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    project = db.query(Project).filter(Project.id == application.project_id).first()
    if project.company_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your project")
    
    if status_data.status not in ["accepted", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    application.status = status_data.status
    db.commit()
    db.refresh(application)
    return application
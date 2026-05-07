from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.analyst_project import AnalystProject
from app.schemas.analyst_project import AnalystProjectCreate, AnalystProjectUpdate, AnalystProjectOut
from app.ml.semantic import predict_category

router = APIRouter(prefix="/analyst/projects", tags=["analyst_projects"])

@router.post("/", response_model=AnalystProjectOut)
def create_project(
    project_data: AnalystProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "analyst":
        raise HTTPException(status_code=403, detail="Only analysts can add projects")
    
    # 1. Сначала создаем объект базы
    project = AnalystProject(
        analyst_id=current_user.id,
        title=project_data.title,
        description=project_data.description,
        start_date=project_data.start_date,
        end_date=project_data.end_date,
        category=None, # Явно задаем начальное состояние
        confidence=0.0
    )
    
    # 2. Получаем текст для анализа (обязательно проверяем заголовок тоже)
    text_to_analyze = ""
    if project_data.description and project_data.description.strip():
        text_to_analyze = project_data.description
    else:
        text_to_analyze = project_data.title

    # 3. Пытаемся определить категорию
    if text_to_analyze:
        try:
            category, confidence = predict_category(text_to_analyze)
            
            # ВАЖНО: Если модель вернула None (недостаточно уверенности), 
            # мы оставляем как есть, но пишем это в лог
            if category:
                project.category = str(category)
                project.confidence = float(confidence)
                print(f"DEBUG: Category defined as {category} with confidence {confidence}")
            else:
                print(f"DEBUG: Model returned None for text: {text_to_analyze[:50]}...")
        except Exception as e:
            print(f"ERROR in ML module: {e}")
            # Не роняем всё API, если ML упал, просто сохраняем проект без категории
            project.category = "Не определено"

    db.add(project)
    db.commit()
    db.refresh(project)
    return project

@router.get("/", response_model=List[AnalystProjectOut])
def list_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    projects = db.query(AnalystProject).filter(AnalystProject.analyst_id == current_user.id).all()
    return projects

@router.put("/{project_id}", response_model=AnalystProjectOut)
def update_project(
    project_id: int,
    project_data: AnalystProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(AnalystProject).filter(
        AnalystProject.id == project_id,
        AnalystProject.analyst_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Обновляем основные поля
    update_data = project_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)
    
    # Пересчитываем категорию, если изменились текст или заголовок
    if "description" in update_data or "title" in update_data:
        text_to_predict = project.description or project.title
        if text_to_predict:
            category, confidence = predict_category(text_to_predict)
            project.category = category
            project.confidence = float(confidence) if confidence is not None else 0.0

    db.commit()
    db.refresh(project)
    return project

@router.delete("/{project_id}")
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(AnalystProject).filter(
        AnalystProject.id == project_id,
        AnalystProject.analyst_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()
    return {"msg": "deleted"}
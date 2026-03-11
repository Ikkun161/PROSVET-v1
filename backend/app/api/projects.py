import os
import shutil
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.project import Project
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectOut
from sqlalchemy.orm import joinedload
from app.models.company_profile import CompanyProfile
from app.schemas.project import ProjectListItemOut, CompanyInfo

router = APIRouter()

UPLOAD_DIR = "uploads/projects"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/projects", response_model=ProjectOut)
def create_project(
    project_data: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Только компании могут создавать проекты
    if current_user.role != "client":
        raise HTTPException(status_code=403, detail="Only clients can create projects")
    # Проверяем, есть ли у компании профиль (необязательно, но можно)
    # Создаём проект
    project = Project(
        company_id=current_user.id,
        **project_data.dict()
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project

@router.get("/projects/company/{company_id}", response_model=list[ProjectOut])
def get_company_projects(company_id: int, db: Session = Depends(get_db)):
    projects = db.query(Project).filter(Project.company_id == company_id).order_by(Project.created_at.desc()).all()
    return projects

@router.get("/projects/{project_id}", response_model=ProjectOut)
def get_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.post("/projects/{project_id}/avatar", response_model=ProjectOut)
async def upload_project_avatar(
    project_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    # Проверяем, что пользователь владелец проекта
    if project.company_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your project")
    ext = os.path.splitext(file.filename)[1]
    filename = f"project_{project_id}_{int(datetime.utcnow().timestamp())}{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    project.avatar = f"/uploads/projects/{filename}"
    db.commit()
    db.refresh(project)
    return project

@router.put("/projects/{project_id}", response_model=ProjectOut)
def update_project(
    project_id: int,
    project_data: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.company_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your project")
    for key, value in project_data.dict(exclude_unset=True).items():
        setattr(project, key, value)
    db.commit()
    db.refresh(project)
    return project



@router.get("/projects", response_model=list[ProjectListItemOut])
def get_all_projects(db: Session = Depends(get_db)):
    projects = db.query(Project).options(joinedload(Project.company)).all()
    result = []
    for project in projects:
        company_profile = db.query(CompanyProfile).filter(CompanyProfile.user_id == project.company_id).first()
        company_info = None
        if company_profile:
            company_info = CompanyInfo(
                id=company_profile.user_id,
                company_name=company_profile.company_name,
                logo=company_profile.logo
            )
        result.append({
            "id": project.id,
            "company_id": project.company_id,
            "title": project.title,
            "description": project.description,
            "required_specializations": project.required_specializations,
            "avatar": project.avatar,
            "created_at": project.created_at,
            "company": company_info
        })
    return result
# Дополнительно можно добавить обновление и удаление проекта, но пока не нужно
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.company_review import CompanyReview
from app.schemas.company_review import CompanyReviewCreate, CompanyReviewOut

router = APIRouter()

@router.post("/company-reviews", response_model=CompanyReviewOut)
def create_company_review(
    review_data: CompanyReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "analyst":
        raise HTTPException(status_code=403, detail="Only analysts can leave company reviews")
    company = db.query(User).filter(User.id == review_data.company_id, User.role == "client").first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    existing = db.query(CompanyReview).filter(
        CompanyReview.reviewer_id == current_user.id,
        CompanyReview.company_id == review_data.company_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You already reviewed this company")
    review = CompanyReview(
        reviewer_id=current_user.id,
        company_id=review_data.company_id,
        rating=review_data.rating,
        text=review_data.text
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review

@router.get("/company-reviews/company/{company_id}", response_model=list[CompanyReviewOut])
def get_reviews_for_company(company_id: int, db: Session = Depends(get_db)):
    reviews = db.query(CompanyReview).filter(CompanyReview.company_id == company_id).order_by(CompanyReview.created_at.desc()).all()
    return reviews

@router.get("/company-reviews/company/{company_id}/rating")
def get_company_rating(company_id: int, db: Session = Depends(get_db)):
    result = db.query(func.avg(CompanyReview.rating)).filter(CompanyReview.company_id == company_id).first()
    avg = result[0] or 0
    count = db.query(CompanyReview).filter(CompanyReview.company_id == company_id).count()
    return {"average": round(avg, 2), "count": count}
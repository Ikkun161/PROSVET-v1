from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.review import Review
from app.schemas.review import ReviewCreate, ReviewOut

router = APIRouter()

# Создать отзыв (только заказчик аналитику)
@router.post("/reviews", response_model=ReviewOut)
def create_review(
    review_data: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Проверяем, что текущий пользователь — заказчик
    if current_user.role != "client":
        raise HTTPException(status_code=403, detail="Only clients can leave reviews")

    # Проверяем, что аналитик существует и является аналитиком
    analyst = db.query(User).filter(User.id == review_data.analyst_id, User.role == "analyst").first()
    if not analyst:
        raise HTTPException(status_code=404, detail="Analyst not found")

    # Проверяем, не оставлял ли уже этот заказчик отзыв этому аналитику
    existing = db.query(Review).filter(
        Review.reviewer_id == current_user.id,
        Review.analyst_id == review_data.analyst_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You already reviewed this analyst")

    # Создаём отзыв
    review = Review(
        reviewer_id=current_user.id,
        analyst_id=review_data.analyst_id,
        rating=review_data.rating,
        text=review_data.text
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review

# Получить отзывы для аналитика по его user_id
@router.get("/reviews/analyst/{analyst_id}", response_model=list[ReviewOut])
def get_reviews_for_analyst(analyst_id: int, db: Session = Depends(get_db)):
    reviews = db.query(Review).filter(Review.analyst_id == analyst_id).order_by(Review.created_at.desc()).all()
    return reviews

# Получить средний рейтинг аналитика
@router.get("/reviews/analyst/{analyst_id}/rating")
def get_analyst_rating(analyst_id: int, db: Session = Depends(get_db)):
    from sqlalchemy import func
    result = db.query(func.avg(Review.rating)).filter(Review.analyst_id == analyst_id).first()
    avg = result[0] or 0
    count = db.query(Review).filter(Review.analyst_id == analyst_id).count()
    return {"average": round(avg, 2), "count": count}
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class CompanyReview(Base):
    __tablename__ = "company_reviews"

    id = Column(Integer, primary_key=True, index=True)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # кто оставил (аналитик)
    company_id = Column(Integer, ForeignKey("users.id"), nullable=False)   # кому (заказчик)
    rating = Column(Float, nullable=False)
    text = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    reviewer = relationship("User", foreign_keys=[reviewer_id], back_populates="given_company_reviews")
    company = relationship("User", foreign_keys=[company_id], back_populates="received_company_reviews")
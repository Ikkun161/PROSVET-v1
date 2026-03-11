from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # кто оставил (заказчик)
    analyst_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # кому (аналитик)
    rating = Column(Float, nullable=False)  # оценка 1-5
    text = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    reviewer = relationship("User", foreign_keys=[reviewer_id], back_populates="given_reviews")
    analyst = relationship("User", foreign_keys=[analyst_id], back_populates="received_reviews")    
from sqlalchemy import Column, Integer, String, Text, ForeignKey, Float, DateTime  # DateTime
from sqlalchemy.sql import func  # func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    full_name = Column(String, nullable=False)
    specialization = Column(String, nullable=False)
    experience = Column(Integer, nullable=True)
    description = Column(Text, nullable=True)
    portfolio = Column(String, nullable=True)
    hourly_rate = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    avatar = Column(String, nullable=True)

    user = relationship("User", back_populates="profile")
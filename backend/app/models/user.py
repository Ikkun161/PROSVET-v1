from sqlalchemy import Column, Integer, String, Enum
from app.core.database import Base
from sqlalchemy.orm import relationship 
import enum

class UserRole(str, enum.Enum):
    analyst = "analyst"
    client = "client"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)   # временно открытый пароль
    ##hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    profile = relationship("Profile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    given_reviews = relationship("Review", foreign_keys="Review.reviewer_id", back_populates="reviewer", cascade="all, delete-orphan")
    received_reviews = relationship("Review", foreign_keys="Review.analyst_id", back_populates="analyst", cascade="all, delete-orphan")
    company_profile = relationship("CompanyProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    # внутри класса User
    given_company_reviews = relationship("CompanyReview", foreign_keys="CompanyReview.reviewer_id", back_populates="reviewer", cascade="all, delete-orphan")
    received_company_reviews = relationship("CompanyReview", foreign_keys="CompanyReview.company_id", back_populates="company", cascade="all, delete-orphan")
    projects = relationship("Project", back_populates="company", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="analyst", foreign_keys="Application.analyst_id")
    analyst_projects = relationship("AnalystProject", back_populates="analyst", cascade="all, delete-orphan")
from sqlalchemy import Column, Integer, String, Text, ForeignKey, Date, Float
from sqlalchemy.orm import relationship
from app.core.database import Base

class AnalystProject(Base):
    __tablename__ = "analyst_projects"

    id = Column(Integer, primary_key=True, index=True)
    analyst_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    category = Column(String, nullable=True)
    confidence = Column(Float, nullable=True)

    analyst = relationship("User", back_populates="analyst_projects")
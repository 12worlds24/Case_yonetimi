"""
Support Status model for dynamic status management
"""
from sqlalchemy import Column, String, Text, Integer
from app.models.base import BaseModel


class SupportStatus(BaseModel):
    """Support status model"""
    __tablename__ = "support_statuses"
    
    name = Column(String(100), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    color = Column(String(7), nullable=True)  # Hex color code (e.g., #f59e0b)
    is_active = Column(Integer, default=1, nullable=False)  # 1=active, 0=inactive
    sort_order = Column(Integer, default=0, nullable=False)  # For ordering
    
    def __repr__(self):
        return f"<SupportStatus(id={self.id}, name='{self.name}')>"


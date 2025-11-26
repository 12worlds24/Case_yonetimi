"""
Support Type model for dynamic support type management
"""
from sqlalchemy import Column, String, Text, Integer
from app.models.base import BaseModel


class SupportType(BaseModel):
    """Support type model"""
    __tablename__ = "support_types"
    
    name = Column(String(100), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    is_active = Column(Integer, default=1, nullable=False)  # 1=active, 0=inactive
    sort_order = Column(Integer, default=0, nullable=False)  # For ordering
    
    def __repr__(self):
        return f"<SupportType(id={self.id}, name='{self.name}')>"


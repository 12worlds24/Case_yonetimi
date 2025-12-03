"""
Priority Type model for configurable SLA/priority definitions
"""
from sqlalchemy import Column, String, Text, Integer
from app.models.base import BaseModel


class PriorityType(BaseModel):
    """Priority type model"""
    __tablename__ = "priority_types"

    name = Column(String(100), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    color = Column(String(7), nullable=True)  # Hex color code like #FF0000
    response_time_minutes = Column(Integer, nullable=True)  # SLA target (minutes)
    is_active = Column(Integer, default=1, nullable=False)  # 1=active, 0=inactive
    sort_order = Column(Integer, default=0, nullable=False)

    def __repr__(self):
        return f"<PriorityType(id={self.id}, name='{self.name}')>"










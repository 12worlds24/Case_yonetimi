"""
Product Category model for dynamic product category management
"""
from sqlalchemy import Column, String, Text, Integer
from app.models.base import BaseModel


class ProductCategory(BaseModel):
    """Product category model"""
    __tablename__ = "product_categories"
    
    name = Column(String(100), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    is_active = Column(Integer, default=1, nullable=False)  # 1=active, 0=inactive
    sort_order = Column(Integer, default=0, nullable=False)
    
    def __repr__(self):
        return f"<ProductCategory(id={self.id}, name='{self.name}')>"






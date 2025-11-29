"""
Product Brand model for dynamic product brand management
"""
from sqlalchemy import Column, String, Text, Integer
from app.models.base import BaseModel


class ProductBrand(BaseModel):
    """Product brand model"""
    __tablename__ = "product_brands"
    
    name = Column(String(100), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    is_active = Column(Integer, default=1, nullable=False)  # 1=active, 0=inactive
    sort_order = Column(Integer, default=0, nullable=False)
    
    def __repr__(self):
        return f"<ProductBrand(id={self.id}, name='{self.name}')>"




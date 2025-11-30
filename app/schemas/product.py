"""
Product schemas
"""
from pydantic import BaseModel
from typing import Optional, Dict, Any, TYPE_CHECKING
from datetime import datetime

if TYPE_CHECKING:
    from app.schemas.product_category import ProductCategoryResponse
    from app.schemas.product_brand import ProductBrandResponse


class ProductBase(BaseModel):
    """Base product schema"""
    name: str
    code: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[int] = None
    brand_id: Optional[int] = None
    attributes: Optional[Dict[str, Any]] = None


class ProductCreate(ProductBase):
    """Product creation schema"""
    pass


class ProductUpdate(BaseModel):
    """Product update schema"""
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[int] = None
    brand_id: Optional[int] = None
    attributes: Optional[Dict[str, Any]] = None


class ProductResponse(ProductBase):
    """Product response schema"""
    id: int
    created_at: datetime
    updated_at: datetime
    category: Optional['ProductCategoryResponse'] = None
    brand: Optional['ProductBrandResponse'] = None
    
    class Config:
        from_attributes = True


# Resolve forward references
from app.schemas.product_category import ProductCategoryResponse
from app.schemas.product_brand import ProductBrandResponse
ProductResponse.model_rebuild()









"""
Pydantic schemas for Product Brand management
"""
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from pydantic import BaseModel, Field

if TYPE_CHECKING:
    from app.schemas.product_category import ProductCategoryResponse


class ProductBrandBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    category_id: Optional[int] = None
    is_active: Optional[int] = Field(default=1, ge=0, le=1)
    sort_order: Optional[int] = Field(default=0, ge=0, le=10000)


class ProductBrandCreate(ProductBrandBase):
    pass


class ProductBrandUpdate(ProductBrandBase):
    name: Optional[str] = None


class ProductBrandResponse(ProductBrandBase):
    id: int
    created_at: datetime
    updated_at: datetime
    category: Optional['ProductCategoryResponse'] = None

    class Config:
        from_attributes = True


# Resolve forward reference
from app.schemas.product_category import ProductCategoryResponse
ProductBrandResponse.model_rebuild()





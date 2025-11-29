"""
Pydantic schemas for Product Category management
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ProductCategoryBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    is_active: Optional[int] = Field(default=1, ge=0, le=1)
    sort_order: Optional[int] = Field(default=0, ge=0, le=10000)


class ProductCategoryCreate(ProductCategoryBase):
    pass


class ProductCategoryUpdate(ProductCategoryBase):
    name: Optional[str] = None


class ProductCategoryResponse(ProductCategoryBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True




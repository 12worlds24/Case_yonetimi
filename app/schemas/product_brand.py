"""
Pydantic schemas for Product Brand management
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ProductBrandBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
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

    class Config:
        from_attributes = True




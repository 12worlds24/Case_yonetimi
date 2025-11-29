"""
Product schemas
"""
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime


class ProductBase(BaseModel):
    """Base product schema"""
    name: str
    code: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    attributes: Optional[Dict[str, Any]] = None


class ProductCreate(ProductBase):
    """Product creation schema"""
    pass


class ProductUpdate(BaseModel):
    """Product update schema"""
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    attributes: Optional[Dict[str, Any]] = None


class ProductResponse(ProductBase):
    """Product response schema"""
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True








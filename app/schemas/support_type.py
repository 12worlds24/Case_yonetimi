"""
Support Type schemas
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class SupportTypeBase(BaseModel):
    """Base support type schema"""
    name: str
    description: Optional[str] = None
    is_active: Optional[int] = 1
    sort_order: Optional[int] = 0


class SupportTypeCreate(SupportTypeBase):
    """Support type creation schema"""
    pass


class SupportTypeUpdate(BaseModel):
    """Support type update schema"""
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[int] = None
    sort_order: Optional[int] = None


class SupportTypeResponse(SupportTypeBase):
    """Support type response schema"""
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True









"""
Support Status schemas
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class SupportStatusBase(BaseModel):
    """Base support status schema"""
    name: str
    description: Optional[str] = None
    color: Optional[str] = None
    is_active: Optional[int] = 1
    sort_order: Optional[int] = 0


class SupportStatusCreate(SupportStatusBase):
    """Support status creation schema"""
    pass


class SupportStatusUpdate(BaseModel):
    """Support status update schema"""
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    is_active: Optional[int] = None
    sort_order: Optional[int] = None


class SupportStatusResponse(SupportStatusBase):
    """Support status response schema"""
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True





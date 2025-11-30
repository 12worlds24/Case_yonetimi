"""
Customer Contact schemas
"""
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class CustomerContactBase(BaseModel):
    """Base customer contact schema"""
    full_name: str
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    title: Optional[str] = None  # Ünvan


class CustomerContactCreate(CustomerContactBase):
    """Customer contact creation schema"""
    customer_id: int


class CustomerContactUpdate(BaseModel):
    """Customer contact update schema"""
    full_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    title: Optional[str] = None


class CustomerContactResponse(CustomerContactBase):
    """Customer contact response schema"""
    id: int
    customer_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True




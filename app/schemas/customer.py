"""
Customer schemas
"""
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any, List
from datetime import datetime


class CustomerBase(BaseModel):
    """Base customer schema"""
    name: str
    company_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    contact_person: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    custom_fields: Optional[Dict[str, Any]] = None


class CustomerCreate(CustomerBase):
    """Customer creation schema"""
    product_ids: Optional[List[int]] = None


class CustomerUpdate(BaseModel):
    """Customer update schema"""
    name: Optional[str] = None
    company_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    contact_person: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    custom_fields: Optional[Dict[str, Any]] = None


class CustomerResponse(CustomerBase):
    """Customer response schema"""
    id: int
    created_at: datetime
    updated_at: datetime
    products: Optional[List[dict]] = None
    
    class Config:
        from_attributes = True








"""
Customer schemas
"""
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


class CustomerContactInSchema(BaseModel):
    """Customer contact schema for create/update"""
    full_name: str
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    title: Optional[str] = None  # Ünvan


class CustomerBase(BaseModel):
    """Base customer schema"""
    company_name: str  # Firma İsmi
    address: Optional[str] = None  # Adres
    email: Optional[EmailStr] = None  # Email
    tax_office: Optional[str] = None  # Vergi Dairesi
    tax_number: Optional[str] = None  # Vergi No
    notes: Optional[str] = None  # Notlar


class CustomerCreate(CustomerBase):
    """Customer creation schema"""
    product_ids: Optional[List[int]] = None
    contacts: Optional[List[CustomerContactInSchema]] = None  # Yetkili Kişiler


class CustomerUpdate(BaseModel):
    """Customer update schema"""
    company_name: Optional[str] = None
    address: Optional[str] = None
    email: Optional[EmailStr] = None
    tax_office: Optional[str] = None
    tax_number: Optional[str] = None
    notes: Optional[str] = None
    product_ids: Optional[List[int]] = None
    contacts: Optional[List[CustomerContactInSchema]] = None


class CustomerResponse(CustomerBase):
    """Customer response schema"""
    id: int
    created_at: datetime
    updated_at: datetime
    products: Optional[List[dict]] = None
    contacts: Optional[List[dict]] = None
    
    class Config:
        from_attributes = True








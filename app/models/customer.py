"""
Customer model
"""
from sqlalchemy import Column, String, Text
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class Customer(BaseModel):
    """Customer model"""
    __tablename__ = "customers"
    
    company_name = Column(String(255), nullable=False, index=True)  # Firma İsmi
    address = Column(Text, nullable=True)  # Adres
    email = Column(String(255), nullable=True, index=True)  # Email
    tax_office = Column(String(255), nullable=True)  # Vergi Dairesi
    tax_number = Column(String(50), nullable=True, index=True)  # Vergi No
    notes = Column(Text, nullable=True)  # Notlar
    
    # Relationships
    products = relationship("CustomerProduct", back_populates="customer", cascade="all, delete-orphan")
    cases = relationship("Case", back_populates="customer")
    contacts = relationship("CustomerContact", back_populates="customer", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Customer(id={self.id}, company_name='{self.company_name}')>"








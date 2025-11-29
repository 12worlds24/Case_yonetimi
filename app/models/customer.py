"""
Customer model
"""
from sqlalchemy import Column, String, Text, JSON
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class Customer(BaseModel):
    """Customer model with JSONB support for custom fields"""
    __tablename__ = "customers"
    
    name = Column(String(255), nullable=False, index=True)
    company_name = Column(String(255), nullable=True)
    email = Column(String(255), nullable=True, index=True)
    phone = Column(String(50), nullable=True)
    address = Column(Text, nullable=True)
    contact_person = Column(String(255), nullable=True)
    contact_email = Column(String(255), nullable=True)
    contact_phone = Column(String(50), nullable=True)
    custom_fields = Column(JSON, nullable=True)  # JSONB for flexible fields
    
    # Relationships
    products = relationship("CustomerProduct", back_populates="customer", cascade="all, delete-orphan")
    cases = relationship("Case", back_populates="customer")
    
    def __repr__(self):
        return f"<Customer(id={self.id}, name='{self.name}')>"








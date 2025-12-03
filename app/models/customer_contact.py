"""
Customer Contact model - Yetkili kişiler
"""
from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class CustomerContact(BaseModel):
    """Customer Contact - Yetkili kişiler"""
    __tablename__ = "customer_contacts"
    
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True)
    title = Column(String(100), nullable=True)  # Ünvan
    
    # Relationships
    customer = relationship("Customer", back_populates="contacts")
    
    def __repr__(self):
        return f"<CustomerContact(id={self.id}, name='{self.full_name}', customer_id={self.customer_id})>"






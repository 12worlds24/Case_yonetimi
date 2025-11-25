"""
Product model
"""
from sqlalchemy import Column, String, Text, JSON, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class Product(BaseModel):
    """Product model with JSONB support for attributes"""
    __tablename__ = "products"
    
    name = Column(String(255), nullable=False, index=True)
    code = Column(String(100), nullable=True, unique=True, index=True)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=True)
    attributes = Column(JSON, nullable=True)  # JSONB for flexible attributes
    
    # Relationships
    customers = relationship("CustomerProduct", back_populates="product", cascade="all, delete-orphan")
    cases = relationship("Case", back_populates="product")
    
    def __repr__(self):
        return f"<Product(id={self.id}, name='{self.name}')>"


class CustomerProduct(BaseModel):
    """Many-to-many relationship between customers and products"""
    __tablename__ = "customer_products"
    
    customer_id = Column(Integer, ForeignKey('customers.id'), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey('products.id'), nullable=False, index=True)
    notes = Column(Text, nullable=True)
    
    # Relationships
    customer = relationship("Customer", back_populates="products")
    product = relationship("Product", back_populates="customers")
    
    def __repr__(self):
        return f"<CustomerProduct(customer_id={self.customer_id}, product_id={self.product_id})>"


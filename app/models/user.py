"""
User and role models
"""
from sqlalchemy import Column, String, Integer, ForeignKey, Table
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


# Many-to-many relationship table
user_roles = Table(
    'user_roles',
    BaseModel.metadata,
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('role_id', Integer, ForeignKey('roles.id'), primary_key=True)
)


class User(BaseModel):
    """User model"""
    __tablename__ = "users"
    
    email = Column(String(255), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    is_active = Column(Integer, default=1, nullable=False)  # 1=active, 0=inactive
    department_id = Column(Integer, ForeignKey('departments.id'), nullable=True, index=True)
    
    # Relationships
    department = relationship("Department", back_populates="users")
    roles = relationship("Role", secondary=user_roles, back_populates="users")
    created_cases = relationship("Case", foreign_keys="Case.created_by", back_populates="creator")
    assigned_cases = relationship("CaseAssignment", back_populates="user")
    comments = relationship("CaseComment", back_populates="user")
    
    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}')>"


class Department(BaseModel):
    """Department model"""
    __tablename__ = "departments"
    
    name = Column(String(100), nullable=False, unique=True, index=True)
    description = Column(String(255), nullable=True)
    
    # Relationships
    users = relationship("User", back_populates="department")
    cases = relationship("Case", back_populates="department")
    
    def __repr__(self):
        return f"<Department(id={self.id}, name='{self.name}')>"


class Role(BaseModel):
    """Role model"""
    __tablename__ = "roles"
    
    name = Column(String(100), nullable=False, unique=True, index=True)
    description = Column(String(255), nullable=True)
    
    # Relationships
    users = relationship("User", secondary=user_roles, back_populates="roles")
    
    def __repr__(self):
        return f"<Role(id={self.id}, name='{self.name}')>"





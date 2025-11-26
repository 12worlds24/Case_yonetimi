"""
User schemas
"""
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


class UserBase(BaseModel):
    """Base user schema"""
    email: EmailStr
    full_name: str
    department_id: Optional[int] = None


class UserCreate(UserBase):
    """User creation schema"""
    password: str
    role_ids: Optional[List[int]] = None


class UserUpdate(BaseModel):
    """User update schema"""
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None
    department_id: Optional[int] = None
    is_active: Optional[int] = None
    role_ids: Optional[List[int]] = None


class DepartmentBase(BaseModel):
    """Base department schema"""
    name: str
    description: Optional[str] = None


class DepartmentCreate(DepartmentBase):
    """Department creation schema"""
    pass


class DepartmentResponse(DepartmentBase):
    """Department response schema"""
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class RoleBase(BaseModel):
    """Base role schema"""
    name: str
    description: Optional[str] = None


class RoleCreate(RoleBase):
    """Role creation schema"""
    pass


class RoleResponse(RoleBase):
    """Role response schema"""
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class UserResponse(UserBase):
    """User response schema"""
    id: int
    is_active: int
    created_at: datetime
    updated_at: datetime
    department: Optional[DepartmentResponse] = None
    roles: Optional[List[RoleResponse]] = None
    
    class Config:
        from_attributes = True





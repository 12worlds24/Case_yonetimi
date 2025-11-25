"""Pydantic schemas for request/response validation"""
from app.schemas.auth import Token, LoginRequest, LoginResponse
from app.schemas.user import (
    UserBase, UserCreate, UserUpdate, UserResponse,
    DepartmentBase, DepartmentCreate, DepartmentResponse,
    RoleBase, RoleCreate, RoleResponse
)
from app.schemas.customer import CustomerBase, CustomerCreate, CustomerUpdate, CustomerResponse
from app.schemas.product import ProductBase, ProductCreate, ProductUpdate, ProductResponse
from app.schemas.case import (
    CaseBase, CaseCreate, CaseUpdate, CaseClose, CaseResponse,
    CaseCommentCreate, CaseCommentResponse, CaseAssignmentResponse
)

__all__ = [
    "Token",
    "LoginRequest",
    "LoginResponse",
    "UserBase",
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    "DepartmentBase",
    "DepartmentCreate",
    "DepartmentResponse",
    "RoleBase",
    "RoleCreate",
    "RoleResponse",
    "CustomerBase",
    "CustomerCreate",
    "CustomerUpdate",
    "CustomerResponse",
    "ProductBase",
    "ProductCreate",
    "ProductUpdate",
    "ProductResponse",
    "CaseBase",
    "CaseCreate",
    "CaseUpdate",
    "CaseClose",
    "CaseResponse",
    "CaseCommentCreate",
    "CaseCommentResponse",
    "CaseAssignmentResponse",
]

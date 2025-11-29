"""Database models"""
from app.models.base import BaseModel
from app.models.customer import Customer
from app.models.product import Product, CustomerProduct
from app.models.user import User, Department, Role
from app.models.case import (
    Case, CaseAssignment, CaseComment, CaseFile, CaseHistory
)
from app.models.report import CustomField, ReportTemplate, ReportDefinition
from app.models.support_status import SupportStatus
from app.models.support_type import SupportType
from app.models.priority_type import PriorityType
from app.models.product_category import ProductCategory
from app.models.product_brand import ProductBrand

__all__ = [
    "BaseModel",
    "Customer",
    "CustomerProduct",
    "Product",
    "User",
    "Department",
    "Role",
    "Case",
    "CaseAssignment",
    "CaseComment",
    "CaseFile",
    "CaseHistory",
    "PriorityType",
    "SupportType",
    "SupportStatus",
    "CustomField",
    "ReportTemplate",
    "ReportDefinition",
    "ProductCategory",
    "ProductBrand",
]

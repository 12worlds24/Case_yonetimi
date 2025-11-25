"""
Case/Ticket models
"""
from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, JSON, Enum as SQLEnum, func
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.models.base import BaseModel


class PriorityType(enum.Enum):
    """Priority types"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class SupportType(enum.Enum):
    """Support types"""
    EMAIL = "email"
    REMOTE = "uzaktan"
    ONSITE = "yerinde"


class CaseStatus(enum.Enum):
    """Case status types"""
    PENDING = "bekleyen"
    TRANSFER = "transfer"
    CANCELLED = "iptal"
    COMPLETED = "tamamlanan"


class Case(BaseModel):
    """Case/Ticket model"""
    __tablename__ = "cases"
    
    # Basic information
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=False)
    customer_id = Column(Integer, ForeignKey('customers.id'), nullable=False, index=True)
    customer_contact_id = Column(Integer, nullable=True)  # Customer contact person ID
    product_id = Column(Integer, ForeignKey('products.id'), nullable=True, index=True)
    
    # Assignment
    created_by = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    department_id = Column(Integer, ForeignKey('departments.id'), nullable=True, index=True)
    
    # Case details
    priority = Column(SQLEnum(PriorityType), nullable=False, default=PriorityType.MEDIUM)
    support_type = Column(SQLEnum(SupportType), nullable=False, default=SupportType.EMAIL)
    status = Column(SQLEnum(CaseStatus), nullable=False, default=CaseStatus.PENDING, index=True)
    
    # Resolution
    solution = Column(Text, nullable=True)
    start_date = Column(DateTime(timezone=True), nullable=True)
    end_date = Column(DateTime(timezone=True), nullable=True)
    time_spent_hours = Column(Integer, nullable=True)  # Hours spent (can be manually adjusted)
    
    # Flexible data
    custom_data = Column(JSON, nullable=True)  # JSONB for dynamic fields
    
    # Relationships
    customer = relationship("Customer", back_populates="cases")
    product = relationship("Product", back_populates="cases")
    creator = relationship("User", foreign_keys=[created_by], back_populates="created_cases")
    department = relationship("Department", back_populates="cases")
    assignments = relationship("CaseAssignment", back_populates="case", cascade="all, delete-orphan")
    comments = relationship("CaseComment", back_populates="case", cascade="all, delete-orphan")
    files = relationship("CaseFile", back_populates="case", cascade="all, delete-orphan")
    history = relationship("CaseHistory", back_populates="case", cascade="all, delete-orphan")
    
    def calculate_time_spent(self) -> int:
        """Calculate time spent in hours"""
        if self.start_date and self.end_date:
            delta = self.end_date - self.start_date
            return int(delta.total_seconds() / 3600)
        return 0
    
    def __repr__(self):
        return f"<Case(id={self.id}, title='{self.title[:50]}...', status='{self.status.value}')>"


class CaseAssignment(BaseModel):
    """Case assignment to support staff"""
    __tablename__ = "case_assignments"
    
    case_id = Column(Integer, ForeignKey('cases.id'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    assigned_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    notes = Column(Text, nullable=True)
    
    # Relationships
    case = relationship("Case", back_populates="assignments")
    user = relationship("User", back_populates="assigned_cases")
    
    def __repr__(self):
        return f"<CaseAssignment(case_id={self.case_id}, user_id={self.user_id})>"


class CaseComment(BaseModel):
    """Case comments"""
    __tablename__ = "case_comments"
    
    case_id = Column(Integer, ForeignKey('cases.id'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    comment = Column(Text, nullable=False)
    is_internal = Column(Integer, default=0, nullable=False)  # 0=public, 1=internal
    
    # Relationships
    case = relationship("Case", back_populates="comments")
    user = relationship("User", back_populates="comments")
    
    def __repr__(self):
        return f"<CaseComment(id={self.id}, case_id={self.case_id})>"


class CaseFile(BaseModel):
    """Case files/attachments"""
    __tablename__ = "case_files"
    
    case_id = Column(Integer, ForeignKey('cases.id'), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False)  # Size in bytes
    mime_type = Column(String(100), nullable=True)
    uploaded_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    
    # Relationships
    case = relationship("Case", back_populates="files")
    
    def __repr__(self):
        return f"<CaseFile(id={self.id}, filename='{self.filename}')>"


class CaseHistory(BaseModel):
    """Case history/audit log"""
    __tablename__ = "case_history"
    
    case_id = Column(Integer, ForeignKey('cases.id'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    action = Column(String(100), nullable=False)  # created, updated, assigned, closed, etc.
    old_value = Column(JSON, nullable=True)
    new_value = Column(JSON, nullable=True)
    description = Column(Text, nullable=True)
    
    # Relationships
    case = relationship("Case", back_populates="history")
    
    def __repr__(self):
        return f"<CaseHistory(id={self.id}, case_id={self.case_id}, action='{self.action}')>"


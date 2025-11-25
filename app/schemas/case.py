"""
Case/Ticket schemas
"""
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.models.case import PriorityType, SupportType, CaseStatus


class CaseBase(BaseModel):
    """Base case schema"""
    title: str
    description: str
    customer_id: int
    customer_contact_id: Optional[int] = None
    product_id: Optional[int] = None
    department_id: Optional[int] = None
    priority: PriorityType = PriorityType.MEDIUM
    support_type: SupportType = SupportType.EMAIL
    custom_data: Optional[Dict[str, Any]] = None


class CaseCreate(CaseBase):
    """Case creation schema"""
    assigned_user_ids: Optional[List[int]] = None


class CaseUpdate(BaseModel):
    """Case update schema"""
    title: Optional[str] = None
    description: Optional[str] = None
    customer_id: Optional[int] = None
    customer_contact_id: Optional[int] = None
    product_id: Optional[int] = None
    department_id: Optional[int] = None
    priority: Optional[PriorityType] = None
    support_type: Optional[SupportType] = None
    status: Optional[CaseStatus] = None
    solution: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    time_spent_hours: Optional[int] = None
    custom_data: Optional[Dict[str, Any]] = None


class CaseClose(BaseModel):
    """Case close schema"""
    solution: str
    end_date: Optional[datetime] = None
    time_spent_hours: Optional[int] = None
    assigned_user_ids: Optional[List[int]] = None


class CaseResponse(CaseBase):
    """Case response schema"""
    id: int
    created_by: int
    status: CaseStatus
    solution: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    time_spent_hours: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    customer: Optional[dict] = None
    product: Optional[dict] = None
    creator: Optional[dict] = None
    department: Optional[dict] = None
    assignments: Optional[List[dict]] = None
    comments: Optional[List[dict]] = None
    files: Optional[List[dict]] = None
    
    class Config:
        from_attributes = True


class CaseCommentCreate(BaseModel):
    """Case comment creation schema"""
    comment: str
    is_internal: int = 0


class CaseCommentResponse(BaseModel):
    """Case comment response schema"""
    id: int
    case_id: int
    user_id: int
    comment: str
    is_internal: int
    created_at: datetime
    updated_at: datetime
    user: Optional[dict] = None
    
    class Config:
        from_attributes = True


class CaseAssignmentResponse(BaseModel):
    """Case assignment response schema"""
    id: int
    case_id: int
    user_id: int
    assigned_at: datetime
    notes: Optional[str] = None
    user: Optional[dict] = None
    
    class Config:
        from_attributes = True


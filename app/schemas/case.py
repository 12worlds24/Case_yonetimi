"""
Case/Ticket schemas
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class CaseBase(BaseModel):
    """Base case schema"""
    title: str = Field(..., min_length=1, max_length=500)
    description: str = Field(..., min_length=1)
    request_date: Optional[datetime] = None
    customer_id: int
    customer_contact_id: Optional[int] = None
    product_id: Optional[int] = None
    department_id: Optional[int] = None
    assigned_to: Optional[int] = None
    priority_type_id: Optional[int] = None
    support_type_id: Optional[int] = None
    status_id: Optional[int] = None
    solution: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    time_spent_minutes: Optional[int] = None
    custom_data: Optional[Dict[str, Any]] = None


class CaseCreate(CaseBase):
    """Case creation schema"""
    assigned_user_ids: Optional[List[int]] = None  # Additional support staff


class CaseUpdate(BaseModel):
    """Case update schema"""
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = Field(None, min_length=1)
    request_date: Optional[datetime] = None
    customer_id: Optional[int] = None
    customer_contact_id: Optional[int] = None
    product_id: Optional[int] = None
    department_id: Optional[int] = None
    assigned_to: Optional[int] = None
    priority_type_id: Optional[int] = None
    support_type_id: Optional[int] = None
    status_id: Optional[int] = None
    solution: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    time_spent_minutes: Optional[int] = None
    custom_data: Optional[Dict[str, Any]] = None


class CaseClose(BaseModel):
    """Case close schema"""
    solution: str = Field(..., min_length=1)
    end_date: Optional[datetime] = None
    time_spent_minutes: Optional[int] = None
    assigned_user_ids: Optional[List[int]] = None


class CaseResponse(CaseBase):
    """Case response schema"""
    id: int
    ticket_number: str
    created_by: int
    created_at: datetime
    updated_at: datetime
    customer: Optional[dict] = None
    product: Optional[dict] = None
    creator: Optional[dict] = None
    assigned_user: Optional[dict] = None
    department: Optional[dict] = None
    priority_type: Optional[dict] = None
    support_type: Optional[dict] = None
    status: Optional[dict] = None
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







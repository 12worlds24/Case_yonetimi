"""
Pydantic schemas for Priority Type management
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class PriorityTypeBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    color: Optional[str] = Field(
        default=None,
        pattern=r"^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
    )
    response_time_minutes: Optional[int] = Field(default=None, ge=0, le=100000)
    is_active: Optional[int] = Field(default=1, ge=0, le=1)
    sort_order: Optional[int] = Field(default=0, ge=0, le=10000)


class PriorityTypeCreate(PriorityTypeBase):
    pass


class PriorityTypeUpdate(PriorityTypeBase):
    name: Optional[str] = None


class PriorityTypeResponse(PriorityTypeBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True










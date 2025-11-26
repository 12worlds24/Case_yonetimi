"""
Support Type API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.support_type import SupportType
from app.schemas.support_type import SupportTypeCreate, SupportTypeUpdate, SupportTypeResponse
from app.auth.dependencies import get_current_active_user, require_admin
from app.models.user import User
from app.utils.logger import get_logger
from app.utils.retry import retry_database

logger = get_logger("api.support_type")
router = APIRouter(prefix="/api/support-types", tags=["Support Types"])


@router.get("/", response_model=List[SupportTypeResponse])
@retry_database
async def get_support_types(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get list of support types"""
    try:
        types = db.query(SupportType).order_by(SupportType.sort_order, SupportType.name).all()
        return types
    except Exception as e:
        logger.exception(f"Error getting support types: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve support types")


@router.post("/", response_model=SupportTypeResponse, status_code=status.HTTP_201_CREATED)
@retry_database
async def create_support_type(
    type_data: SupportTypeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Create new support type (Admin only)"""
    try:
        # Check if type with same name exists
        existing = db.query(SupportType).filter(SupportType.name == type_data.name).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Support type with this name already exists")
        
        type_obj = SupportType(**type_data.dict())
        db.add(type_obj)
        db.commit()
        db.refresh(type_obj)
        logger.info(f"Support type created: {type_obj.id} by admin {current_user.id}")
        return type_obj
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.exception(f"Error creating support type: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create support type")


@router.put("/{type_id}", response_model=SupportTypeResponse)
@retry_database
async def update_support_type(
    type_id: int,
    type_data: SupportTypeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update support type (Admin only)"""
    type_obj = db.query(SupportType).filter(SupportType.id == type_id).first()
    if not type_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Support type not found")
    
    try:
        # Check if name already exists (excluding current type)
        if type_data.name:
            existing = db.query(SupportType).filter(SupportType.name == type_data.name, SupportType.id != type_id).first()
            if existing:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Support type with this name already exists")
        
        update_data = type_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(type_obj, field, value)
        db.commit()
        db.refresh(type_obj)
        logger.info(f"Support type updated: {type_id} by admin {current_user.id}")
        return type_obj
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.exception(f"Error updating support type: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update support type")


@router.delete("/{type_id}", status_code=status.HTTP_204_NO_CONTENT)
@retry_database
async def delete_support_type(
    type_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Delete support type (Admin only)"""
    type_obj = db.query(SupportType).filter(SupportType.id == type_id).first()
    if not type_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Support type not found")
    
    try:
        db.delete(type_obj)
        db.commit()
        logger.info(f"Support type deleted: {type_id} by admin {current_user.id}")
    except Exception as e:
        db.rollback()
        logger.exception(f"Error deleting support type: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete support type")


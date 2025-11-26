"""
Support Status API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.support_status import SupportStatus
from app.schemas.support_status import SupportStatusCreate, SupportStatusUpdate, SupportStatusResponse
from app.auth.dependencies import get_current_active_user, require_admin
from app.models.user import User
from app.utils.logger import get_logger
from app.utils.retry import retry_database

logger = get_logger("api.support_status")
router = APIRouter(prefix="/api/support-statuses", tags=["Support Statuses"])


@router.get("/", response_model=List[SupportStatusResponse])
@retry_database
async def get_support_statuses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get list of support statuses"""
    try:
        statuses = db.query(SupportStatus).order_by(SupportStatus.sort_order, SupportStatus.name).all()
        return statuses
    except Exception as e:
        logger.exception(f"Error getting support statuses: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve support statuses")


@router.post("/", response_model=SupportStatusResponse, status_code=status.HTTP_201_CREATED)
@retry_database
async def create_support_status(
    status_data: SupportStatusCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Create new support status (Admin only)"""
    try:
        # Check if status with same name exists
        existing = db.query(SupportStatus).filter(SupportStatus.name == status_data.name).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Support status with this name already exists")
        
        status_obj = SupportStatus(**status_data.dict())
        db.add(status_obj)
        db.commit()
        db.refresh(status_obj)
        logger.info(f"Support status created: {status_obj.id} by admin {current_user.id}")
        return status_obj
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.exception(f"Error creating support status: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create support status")


@router.put("/{status_id}", response_model=SupportStatusResponse)
@retry_database
async def update_support_status(
    status_id: int,
    status_data: SupportStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update support status (Admin only)"""
    status_obj = db.query(SupportStatus).filter(SupportStatus.id == status_id).first()
    if not status_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Support status not found")
    
    try:
        # Check if name already exists (excluding current status)
        if status_data.name:
            existing = db.query(SupportStatus).filter(SupportStatus.name == status_data.name, SupportStatus.id != status_id).first()
            if existing:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Support status with this name already exists")
        
        update_data = status_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(status_obj, field, value)
        db.commit()
        db.refresh(status_obj)
        logger.info(f"Support status updated: {status_id} by admin {current_user.id}")
        return status_obj
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.exception(f"Error updating support status: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update support status")


@router.delete("/{status_id}", status_code=status.HTTP_204_NO_CONTENT)
@retry_database
async def delete_support_status(
    status_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Delete support status (Admin only)"""
    status_obj = db.query(SupportStatus).filter(SupportStatus.id == status_id).first()
    if not status_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Support status not found")
    
    try:
        db.delete(status_obj)
        db.commit()
        logger.info(f"Support status deleted: {status_id} by admin {current_user.id}")
    except Exception as e:
        db.rollback()
        logger.exception(f"Error deleting support status: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete support status")


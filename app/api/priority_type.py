"""
Priority Type API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.priority_type import PriorityType
from app.schemas.priority_type import (
    PriorityTypeCreate,
    PriorityTypeUpdate,
    PriorityTypeResponse,
)
from app.auth.dependencies import get_current_active_user, require_admin
from app.models.user import User
from app.utils.logger import get_logger
from app.utils.retry import retry_database

logger = get_logger("api.priority_type")
router = APIRouter(prefix="/api/priority-types", tags=["Priority Types"])


@router.get("/", response_model=List[PriorityTypeResponse])
@retry_database
async def get_priority_types(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List priority types"""
    try:
        priorities = (
            db.query(PriorityType)
            .order_by(PriorityType.sort_order, PriorityType.name)
            .all()
        )
        return priorities
    except Exception as exc:
        logger.exception("Error getting priority types: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve priority types",
        )


@router.post("/", response_model=PriorityTypeResponse, status_code=status.HTTP_201_CREATED)
@retry_database
async def create_priority_type(
    priority_data: PriorityTypeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Create priority type (admin)"""
    try:
        existing = db.query(PriorityType).filter(PriorityType.name == priority_data.name).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Öncelik adı zaten kullanılıyor",
            )

        priority = PriorityType(**priority_data.dict(exclude_unset=True))
        db.add(priority)
        db.commit()
        db.refresh(priority)
        logger.info("Priority type created: %s by admin %s", priority.id, current_user.id)
        return priority
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        logger.exception("Error creating priority type: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create priority type",
        )


@router.put("/{priority_id}", response_model=PriorityTypeResponse)
@retry_database
async def update_priority_type(
    priority_id: int,
    priority_data: PriorityTypeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Update priority type (admin)"""
    priority = db.query(PriorityType).filter(PriorityType.id == priority_id).first()
    if not priority:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Öncelik tipi bulunamadı")

    try:
        if priority_data.name:
            existing = (
                db.query(PriorityType)
                .filter(PriorityType.name == priority_data.name, PriorityType.id != priority_id)
                .first()
            )
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Öncelik adı zaten kullanılıyor",
                )

        update_data = priority_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(priority, field, value)

        db.commit()
        db.refresh(priority)
        logger.info("Priority type updated: %s by admin %s", priority_id, current_user.id)
        return priority
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        logger.exception("Error updating priority type: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update priority type",
        )


@router.delete("/{priority_id}", status_code=status.HTTP_204_NO_CONTENT)
@retry_database
async def delete_priority_type(
    priority_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Delete priority type (admin)"""
    priority = db.query(PriorityType).filter(PriorityType.id == priority_id).first()
    if not priority:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Öncelik tipi bulunamadı")

    try:
        db.delete(priority)
        db.commit()
        logger.info("Priority type deleted: %s by admin %s", priority_id, current_user.id)
    except Exception as exc:
        db.rollback()
        logger.exception("Error deleting priority type: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete priority type",
        )










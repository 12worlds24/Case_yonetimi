"""
Case/Ticket API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.models.case import Case, CaseAssignment, CaseComment, CaseFile, CaseStatus, PriorityType, SupportType
from app.schemas.case import CaseCreate, CaseUpdate, CaseClose, CaseResponse, CaseCommentCreate
from app.auth.dependencies import get_current_active_user
from app.models.user import User
from app.utils.logger import get_logger
from app.utils.retry import retry_database, retry_file_system
from pathlib import Path
import shutil

logger = get_logger("api.cases")
router = APIRouter(prefix="/api/cases", tags=["Cases"])

UPLOAD_DIR = Path("uploads")


@router.get("/", response_model=List[CaseResponse])
@retry_database
async def get_cases(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status_filter: Optional[CaseStatus] = None,
    priority_filter: Optional[PriorityType] = None,
    customer_id: Optional[int] = None,
    assigned_to_me: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get list of cases with filters"""
    try:
        query = db.query(Case)
        
        if status_filter:
            query = query.filter(Case.status == status_filter)
        if priority_filter:
            query = query.filter(Case.priority == priority_filter)
        if customer_id:
            query = query.filter(Case.customer_id == customer_id)
        if assigned_to_me:
            query = query.join(CaseAssignment).filter(CaseAssignment.user_id == current_user.id)
        
        cases = query.order_by(Case.created_at.desc()).offset(skip).limit(limit).all()
        return cases
    except Exception as e:
        logger.exception(f"Error getting cases: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve cases")


@router.get("/{case_id}", response_model=CaseResponse)
@retry_database
async def get_case(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get case by ID"""
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")
    return case


@router.post("/", response_model=CaseResponse, status_code=status.HTTP_201_CREATED)
@retry_database
async def create_case(
    case_data: CaseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create new case"""
    try:
        case = Case(
            **case_data.dict(exclude={"assigned_user_ids"}),
            created_by=current_user.id
        )
        db.add(case)
        db.flush()
        
        # Assign users if provided
        if case_data.assigned_user_ids:
            for user_id in case_data.assigned_user_ids:
                assignment = CaseAssignment(case_id=case.id, user_id=user_id)
                db.add(assignment)
        
        db.commit()
        db.refresh(case)
        logger.info(f"Case created: {case.id} by user {current_user.id}")
        return case
    except Exception as e:
        db.rollback()
        logger.exception(f"Error creating case: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create case")


@router.put("/{case_id}", response_model=CaseResponse)
@retry_database
async def update_case(
    case_id: int,
    case_data: CaseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update case"""
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")
    
    try:
        update_data = case_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(case, field, value)
        db.commit()
        db.refresh(case)
        logger.info(f"Case updated: {case.id} by user {current_user.id}")
        return case
    except Exception as e:
        db.rollback()
        logger.exception(f"Error updating case: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update case")


@router.post("/{case_id}/close", response_model=CaseResponse)
@retry_database
async def close_case(
    case_id: int,
    close_data: CaseClose,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Close case"""
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")
    
    try:
        case.solution = close_data.solution
        case.status = CaseStatus.COMPLETED
        case.end_date = close_data.end_date or datetime.utcnow()
        
        if close_data.time_spent_hours:
            case.time_spent_hours = close_data.time_spent_hours
        else:
            case.time_spent_hours = case.calculate_time_spent()
        
        # Add assigned users if provided
        if close_data.assigned_user_ids:
            for user_id in close_data.assigned_user_ids:
                existing = db.query(CaseAssignment).filter(
                    CaseAssignment.case_id == case.id,
                    CaseAssignment.user_id == user_id
                ).first()
                if not existing:
                    assignment = CaseAssignment(case_id=case.id, user_id=user_id)
                    db.add(assignment)
        
        db.commit()
        db.refresh(case)
        logger.info(f"Case closed: {case.id} by user {current_user.id}")
        return case
    except Exception as e:
        db.rollback()
        logger.exception(f"Error closing case: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to close case")


@router.post("/{case_id}/assign", response_model=CaseResponse)
@retry_database
async def assign_case(
    case_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Assign case to user"""
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")
    
    try:
        assignment = CaseAssignment(case_id=case.id, user_id=user_id)
        db.add(assignment)
        db.commit()
        db.refresh(case)
        logger.info(f"Case {case.id} assigned to user {user_id} by user {current_user.id}")
        return case
    except Exception as e:
        db.rollback()
        logger.exception(f"Error assigning case: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to assign case")


@router.post("/{case_id}/comments", response_model=dict)
@retry_database
async def add_comment(
    case_id: int,
    comment_data: CaseCommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Add comment to case"""
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")
    
    try:
        comment = CaseComment(
            case_id=case.id,
            user_id=current_user.id,
            comment=comment_data.comment,
            is_internal=comment_data.is_internal
        )
        db.add(comment)
        db.commit()
        db.refresh(comment)
        logger.info(f"Comment added to case {case.id} by user {current_user.id}")
        return {"id": comment.id, "message": "Comment added successfully"}
    except Exception as e:
        db.rollback()
        logger.exception(f"Error adding comment: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to add comment")


@router.post("/{case_id}/files", response_model=dict)
@retry_file_system
async def upload_file(
    case_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Upload file to case"""
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")
    
    try:
        UPLOAD_DIR.mkdir(exist_ok=True)
        file_path = UPLOAD_DIR / f"{case_id}_{file.filename}"
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        case_file = CaseFile(
            case_id=case.id,
            filename=str(file_path),
            original_filename=file.filename,
            file_path=str(file_path),
            file_size=file_path.stat().st_size,
            mime_type=file.content_type,
            uploaded_by=current_user.id
        )
        db.add(case_file)
        db.commit()
        logger.info(f"File uploaded to case {case.id} by user {current_user.id}")
        return {"id": case_file.id, "message": "File uploaded successfully"}
    except Exception as e:
        db.rollback()
        logger.exception(f"Error uploading file: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to upload file")


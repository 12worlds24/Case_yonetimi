"""
User management API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.user import User, Department, Role
from app.schemas.user import UserCreate, UserUpdate, UserResponse, DepartmentCreate, DepartmentResponse, RoleCreate, RoleResponse
from app.auth.dependencies import get_current_active_user, require_admin
from app.auth.security import hash_password
from app.models.user import User as UserModel
from app.utils.logger import get_logger
from app.utils.retry import retry_database

logger = get_logger("api.users")
router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("/", response_model=List[UserResponse])
@retry_database
async def get_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(require_admin)
):
    """Get list of users (Admin only)"""
    try:
        users = db.query(UserModel).offset(skip).limit(limit).all()
        return users
    except Exception as e:
        logger.exception(f"Error getting users: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve users")


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@retry_database
async def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(require_admin)
):
    """Create new user (Admin only)"""
    try:
        # Check if user exists
        existing = db.query(UserModel).filter(UserModel.email == user_data.email).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User with this email already exists")
        
        # Create user
        user = UserModel(
            email=user_data.email,
            password_hash=hash_password(user_data.password),
            full_name=user_data.full_name,
            department_id=user_data.department_id,
            is_active=1
        )
        db.add(user)
        db.flush()
        
        # Assign roles
        if user_data.role_ids:
            for role_id in user_data.role_ids:
                role = db.query(Role).filter(Role.id == role_id).first()
                if role:
                    user.roles.append(role)
        
        db.commit()
        db.refresh(user)
        logger.info(f"User created: {user.id} by admin {current_user.id}")
        return user
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.exception(f"Error creating user: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create user")


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
@retry_database
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(require_admin)
):
    """Delete user (Admin only)"""
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    try:
        db.delete(user)
        db.commit()
        logger.info(f"User deleted: {user_id} by admin {current_user.id}")
    except Exception as e:
        db.rollback()
        logger.exception(f"Error deleting user: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete user")


@router.get("/departments", response_model=List[DepartmentResponse])
@retry_database
async def get_departments(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """Get list of departments"""
    try:
        departments = db.query(Department).all()
        return departments
    except Exception as e:
        logger.exception(f"Error getting departments: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve departments")


@router.post("/departments", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
@retry_database
async def create_department(
    dept_data: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(require_admin)
):
    """Create new department (Admin only)"""
    try:
        department = Department(**dept_data.dict())
        db.add(department)
        db.commit()
        db.refresh(department)
        logger.info(f"Department created: {department.id} by admin {current_user.id}")
        return department
    except Exception as e:
        db.rollback()
        logger.exception(f"Error creating department: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create department")


@router.get("/roles", response_model=List[RoleResponse])
@retry_database
async def get_roles(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """Get list of roles"""
    try:
        roles = db.query(Role).all()
        return roles
    except Exception as e:
        logger.exception(f"Error getting roles: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve roles")


@router.post("/roles", response_model=RoleResponse, status_code=status.HTTP_201_CREATED)
@retry_database
async def create_role(
    role_data: RoleCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(require_admin)
):
    """Create new role (Admin only)"""
    try:
        # Check if role exists
        existing = db.query(Role).filter(Role.name == role_data.name).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Role with this name already exists")
        
        role = Role(**role_data.dict())
        db.add(role)
        db.commit()
        db.refresh(role)
        logger.info(f"Role created: {role.id} by admin {current_user.id}")
        return role
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.exception(f"Error creating role: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create role")


"""
Customer API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.customer import Customer
from app.models.product import Product, CustomerProduct
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse
from app.auth.dependencies import get_current_active_user, require_admin_or_manager, require_admin
from app.models.user import User
from app.utils.logger import get_logger
from app.utils.retry import retry_database

logger = get_logger("api.customers")
router = APIRouter(prefix="/api/customers", tags=["Customers"])


@router.get("/", response_model=List[CustomerResponse])
@retry_database
async def get_customers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get list of customers with pagination and search"""
    try:
        query = db.query(Customer)
        
        if search:
            query = query.filter(
                Customer.name.ilike(f"%{search}%") |
                Customer.email.ilike(f"%{search}%") |
                Customer.company_name.ilike(f"%{search}%")
            )
        
        customers = query.offset(skip).limit(limit).all()
        return customers
    except Exception as e:
        logger.exception(f"Error getting customers: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve customers"
        )


@router.get("/{customer_id}", response_model=CustomerResponse)
@retry_database
async def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get customer by ID"""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    return customer


@router.post("/", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
@retry_database
async def create_customer(
    customer_data: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_manager)
):
    """Create new customer"""
    try:
        # Check if customer with same email exists
        if customer_data.email:
            existing = db.query(Customer).filter(Customer.email == customer_data.email).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Customer with this email already exists"
                )
        
        # Create customer
        customer = Customer(**customer_data.dict(exclude={"product_ids"}))
        db.add(customer)
        db.flush()
        
        # Add products if provided
        if customer_data.product_ids:
            for product_id in customer_data.product_ids:
                product = db.query(Product).filter(Product.id == product_id).first()
                if product:
                    customer_product = CustomerProduct(
                        customer_id=customer.id,
                        product_id=product_id
                    )
                    db.add(customer_product)
        
        db.commit()
        db.refresh(customer)
        
        logger.info(f"Customer created: {customer.id} by user {current_user.id}")
        return customer
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.exception(f"Error creating customer: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create customer"
        )


@router.put("/{customer_id}", response_model=CustomerResponse)
@retry_database
async def update_customer(
    customer_id: int,
    customer_data: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_manager)
):
    """Update customer"""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    
    try:
        update_data = customer_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(customer, field, value)
        
        db.commit()
        db.refresh(customer)
        
        logger.info(f"Customer updated: {customer.id} by user {current_user.id}")
        return customer
    
    except Exception as e:
        db.rollback()
        logger.exception(f"Error updating customer: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update customer"
        )


@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
@retry_database
async def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Delete customer"""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    
    try:
        db.delete(customer)
        db.commit()
        logger.info(f"Customer deleted: {customer_id} by user {current_user.id}")
    except Exception as e:
        db.rollback()
        logger.exception(f"Error deleting customer: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete customer"
        )


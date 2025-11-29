"""
Product API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse
from app.auth.dependencies import get_current_active_user, require_admin_or_manager, require_admin
from app.models.user import User
from app.utils.logger import get_logger
from app.utils.retry import retry_database

logger = get_logger("api.products")
router = APIRouter(prefix="/api/products", tags=["Products"])


@router.get("/", response_model=List[ProductResponse])
@retry_database
async def get_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get list of products"""
    try:
        query = db.query(Product)
        if search:
            query = query.filter(Product.name.ilike(f"%{search}%"))
        products = query.offset(skip).limit(limit).all()
        return products
    except Exception as e:
        logger.exception(f"Error getting products: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve products")


@router.get("/{product_id}", response_model=ProductResponse)
@retry_database
async def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get product by ID"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
@retry_database
async def create_product(
    product_data: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_manager)
):
    """Create new product"""
    try:
        product = Product(**product_data.dict())
        db.add(product)
        db.commit()
        db.refresh(product)
        logger.info(f"Product created: {product.id} by user {current_user.id}")
        return product
    except Exception as e:
        db.rollback()
        logger.exception(f"Error creating product: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create product")


@router.put("/{product_id}", response_model=ProductResponse)
@retry_database
async def update_product(
    product_id: int,
    product_data: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_manager)
):
    """Update product"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    
    try:
        update_data = product_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(product, field, value)
        db.commit()
        db.refresh(product)
        logger.info(f"Product updated: {product.id} by user {current_user.id}")
        return product
    except Exception as e:
        db.rollback()
        logger.exception(f"Error updating product: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update product")


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
@retry_database
async def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Delete product"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    
    try:
        db.delete(product)
        db.commit()
        logger.info(f"Product deleted: {product_id} by user {current_user.id}")
    except Exception as e:
        db.rollback()
        logger.exception(f"Error deleting product: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete product")








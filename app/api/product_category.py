"""
Product Category API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.product_category import ProductCategory
from app.schemas.product_category import (
    ProductCategoryCreate,
    ProductCategoryUpdate,
    ProductCategoryResponse,
)
from app.auth.dependencies import get_current_active_user, require_admin
from app.models.user import User
from app.utils.logger import get_logger
from app.utils.retry import retry_database

logger = get_logger("api.product_category")
router = APIRouter(prefix="/api/product-categories", tags=["Product Categories"])


@router.get("/", response_model=List[ProductCategoryResponse])
@retry_database
async def get_product_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List product categories"""
    try:
        categories = (
            db.query(ProductCategory)
            .order_by(ProductCategory.sort_order, ProductCategory.name)
            .all()
        )
        return categories
    except Exception as exc:
        logger.exception("Error getting product categories: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve product categories",
        )


@router.post("/", response_model=ProductCategoryResponse, status_code=status.HTTP_201_CREATED)
@retry_database
async def create_product_category(
    category_data: ProductCategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Create product category (admin)"""
    try:
        existing = db.query(ProductCategory).filter(ProductCategory.name == category_data.name).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Kategori adı zaten kullanılıyor",
            )

        category = ProductCategory(**category_data.dict(exclude_unset=True))
        db.add(category)
        db.commit()
        db.refresh(category)
        logger.info("Product category created: %s by admin %s", category.id, current_user.id)
        return category
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        logger.exception("Error creating product category: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create product category",
        )


@router.put("/{category_id}", response_model=ProductCategoryResponse)
@retry_database
async def update_product_category(
    category_id: int,
    category_data: ProductCategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Update product category (admin)"""
    category = db.query(ProductCategory).filter(ProductCategory.id == category_id).first()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kategori bulunamadı")

    try:
        if category_data.name:
            existing = (
                db.query(ProductCategory)
                .filter(ProductCategory.name == category_data.name, ProductCategory.id != category_id)
                .first()
            )
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Kategori adı zaten kullanılıyor",
                )

        update_data = category_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(category, field, value)

        db.commit()
        db.refresh(category)
        logger.info("Product category updated: %s by admin %s", category_id, current_user.id)
        return category
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        logger.exception("Error updating product category: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update product category",
        )


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
@retry_database
async def delete_product_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Delete product category (admin)"""
    category = db.query(ProductCategory).filter(ProductCategory.id == category_id).first()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kategori bulunamadı")

    try:
        db.delete(category)
        db.commit()
        logger.info("Product category deleted: %s by admin %s", category_id, current_user.id)
    except Exception as exc:
        db.rollback()
        logger.exception("Error deleting product category: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete product category",
        )




"""
Product Brand API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.product_brand import ProductBrand
from app.schemas.product_brand import (
    ProductBrandCreate,
    ProductBrandUpdate,
    ProductBrandResponse,
)
from app.auth.dependencies import get_current_active_user, require_admin
from app.models.user import User
from app.utils.logger import get_logger
from app.utils.retry import retry_database

logger = get_logger("api.product_brand")
router = APIRouter(prefix="/api/product-brands", tags=["Product Brands"])


@router.get("/", response_model=List[ProductBrandResponse])
@retry_database
async def get_product_brands(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List product brands"""
    try:
        brands = (
            db.query(ProductBrand)
            .order_by(ProductBrand.sort_order, ProductBrand.name)
            .all()
        )
        return brands
    except Exception as exc:
        logger.exception("Error getting product brands: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve product brands",
        )


@router.post("/", response_model=ProductBrandResponse, status_code=status.HTTP_201_CREATED)
@retry_database
async def create_product_brand(
    brand_data: ProductBrandCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Create product brand (admin)"""
    try:
        existing = db.query(ProductBrand).filter(ProductBrand.name == brand_data.name).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Marka adı zaten kullanılıyor",
            )

        brand = ProductBrand(**brand_data.dict(exclude_unset=True))
        db.add(brand)
        db.commit()
        db.refresh(brand)
        logger.info("Product brand created: %s by admin %s", brand.id, current_user.id)
        return brand
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        logger.exception("Error creating product brand: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create product brand",
        )


@router.put("/{brand_id}", response_model=ProductBrandResponse)
@retry_database
async def update_product_brand(
    brand_id: int,
    brand_data: ProductBrandUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Update product brand (admin)"""
    brand = db.query(ProductBrand).filter(ProductBrand.id == brand_id).first()
    if not brand:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Marka bulunamadı")

    try:
        if brand_data.name:
            existing = (
                db.query(ProductBrand)
                .filter(ProductBrand.name == brand_data.name, ProductBrand.id != brand_id)
                .first()
            )
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Marka adı zaten kullanılıyor",
                )

        update_data = brand_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(brand, field, value)

        db.commit()
        db.refresh(brand)
        logger.info("Product brand updated: %s by admin %s", brand_id, current_user.id)
        return brand
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        logger.exception("Error updating product brand: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update product brand",
        )


@router.delete("/{brand_id}", status_code=status.HTTP_204_NO_CONTENT)
@retry_database
async def delete_product_brand(
    brand_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Delete product brand (admin)"""
    brand = db.query(ProductBrand).filter(ProductBrand.id == brand_id).first()
    if not brand:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Marka bulunamadı")

    try:
        db.delete(brand)
        db.commit()
        logger.info("Product brand deleted: %s by admin %s", brand_id, current_user.id)
    except Exception as exc:
        db.rollback()
        logger.exception("Error deleting product brand: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete product brand",
        )




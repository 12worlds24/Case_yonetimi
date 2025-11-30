-- Migration script to add category_id and brand_id to products table
-- Run this script to add category and brand relationships to products

-- Step 1: Add category_id column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS category_id INTEGER;

-- Step 2: Add brand_id column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS brand_id INTEGER;

-- Step 3: Add foreign key constraints
DO $$
BEGIN
    -- Add category foreign key
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'products_category_id_fkey'
        AND table_name = 'products'
    ) THEN
        ALTER TABLE products
        ADD CONSTRAINT products_category_id_fkey
        FOREIGN KEY (category_id) 
        REFERENCES product_categories(id) 
        ON DELETE SET NULL;
    END IF;
    
    -- Add brand foreign key
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'products_brand_id_fkey'
        AND table_name = 'products'
    ) THEN
        ALTER TABLE products
        ADD CONSTRAINT products_brand_id_fkey
        FOREIGN KEY (brand_id) 
        REFERENCES product_brands(id) 
        ON DELETE SET NULL;
    END IF;
END $$;

-- Step 4: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_products_category_id 
ON products(category_id) 
WHERE category_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_brand_id 
ON products(brand_id) 
WHERE brand_id IS NOT NULL;

-- Step 5: Drop old category column if it exists (string type)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'category' 
        AND data_type = 'character varying'
    ) THEN
        ALTER TABLE products DROP COLUMN category;
    END IF;
END $$;

-- Verification
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'products' 
AND column_name IN ('category_id', 'brand_id');



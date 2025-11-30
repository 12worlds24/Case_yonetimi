-- Migration script to add category_id to product_brands table
-- Run this script to add category relationship to product brands

-- Step 1: Add category_id column to product_brands table
ALTER TABLE product_brands 
ADD COLUMN IF NOT EXISTS category_id INTEGER;

-- Step 2: Add foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'product_brands_category_id_fkey'
        AND table_name = 'product_brands'
    ) THEN
        ALTER TABLE product_brands
        ADD CONSTRAINT product_brands_category_id_fkey
        FOREIGN KEY (category_id) 
        REFERENCES product_categories(id) 
        ON DELETE SET NULL;
    END IF;
END $$;

-- Step 3: Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_product_brands_category_id 
ON product_brands(category_id) 
WHERE category_id IS NOT NULL;

-- Verification
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'product_brands' 
AND column_name = 'category_id';



-- Migration script for Customer model restructure
-- This script updates the customers table to match the new structure

-- Step 1: Add new columns if they don't exist
DO $$ 
BEGIN
    -- Add tax_office if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='customers' AND column_name='tax_office') THEN
        ALTER TABLE customers ADD COLUMN tax_office VARCHAR(255);
    END IF;
    
    -- Add tax_number if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='customers' AND column_name='tax_number') THEN
        ALTER TABLE customers ADD COLUMN tax_number VARCHAR(50);
        CREATE INDEX IF NOT EXISTS idx_customers_tax_number ON customers(tax_number);
    END IF;
    
    -- Add notes if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='customers' AND column_name='notes') THEN
        ALTER TABLE customers ADD COLUMN notes TEXT;
    END IF;
    
    -- Rename name to company_name if name exists and company_name doesn't
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='customers' AND column_name='name')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name='customers' AND column_name='company_name') THEN
        ALTER TABLE customers RENAME COLUMN name TO company_name;
    END IF;
    
    -- If both name and company_name exist, copy name to company_name and drop name
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='customers' AND column_name='name')
       AND EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='customers' AND column_name='company_name') THEN
        UPDATE customers SET company_name = COALESCE(company_name, name) WHERE company_name IS NULL;
        ALTER TABLE customers DROP COLUMN IF EXISTS name;
    END IF;
    
    -- Make company_name NOT NULL if it's nullable
    ALTER TABLE customers ALTER COLUMN company_name SET NOT NULL;
    
    -- Drop old columns that are no longer needed
    ALTER TABLE customers DROP COLUMN IF EXISTS phone;
    ALTER TABLE customers DROP COLUMN IF EXISTS contact_person;
    ALTER TABLE customers DROP COLUMN IF EXISTS contact_email;
    ALTER TABLE customers DROP COLUMN IF EXISTS contact_phone;
    ALTER TABLE customers DROP COLUMN IF EXISTS custom_fields;
END $$;

-- Step 2: Create customer_contacts table
CREATE TABLE IF NOT EXISTS customer_contacts (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    title VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active INTEGER DEFAULT 1
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_customer_contacts_customer_id ON customer_contacts(customer_id);

-- Step 3: Migrate existing contact data if exists
-- This assumes old contact_person, contact_email, contact_phone data exists
DO $$
DECLARE
    rec RECORD;
    has_contact_person BOOLEAN;
    has_contact_email BOOLEAN;
    has_contact_phone BOOLEAN;
    sql_query TEXT;
BEGIN
    -- Check if columns exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='customers' AND column_name='contact_person'
    ) INTO has_contact_person;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='customers' AND column_name='contact_email'
    ) INTO has_contact_email;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='customers' AND column_name='contact_phone'
    ) INTO has_contact_phone;
    
    -- Only migrate if columns exist
    IF has_contact_person OR has_contact_email OR has_contact_phone THEN
        sql_query := 'SELECT id';
        IF has_contact_person THEN
            sql_query := sql_query || ', contact_person';
        ELSE
            sql_query := sql_query || ', NULL::VARCHAR as contact_person';
        END IF;
        IF has_contact_email THEN
            sql_query := sql_query || ', contact_email';
        ELSE
            sql_query := sql_query || ', NULL::VARCHAR as contact_email';
        END IF;
        IF has_contact_phone THEN
            sql_query := sql_query || ', contact_phone';
        ELSE
            sql_query := sql_query || ', NULL::VARCHAR as contact_phone';
        END IF;
        sql_query := sql_query || ' FROM customers WHERE (';
        
        IF has_contact_person THEN
            sql_query := sql_query || '(contact_person IS NOT NULL AND contact_person != '''')';
        END IF;
        IF has_contact_email THEN
            IF has_contact_person THEN sql_query := sql_query || ' OR '; END IF;
            sql_query := sql_query || '(contact_email IS NOT NULL AND contact_email != '''')';
        END IF;
        IF has_contact_phone THEN
            IF has_contact_person OR has_contact_email THEN sql_query := sql_query || ' OR '; END IF;
            sql_query := sql_query || '(contact_phone IS NOT NULL AND contact_phone != '''')';
        END IF;
        sql_query := sql_query || ')';
        
        FOR rec IN EXECUTE sql_query
        LOOP
            IF (rec.contact_person IS NOT NULL AND rec.contact_person != '') OR
               (rec.contact_email IS NOT NULL AND rec.contact_email != '') OR
               (rec.contact_phone IS NOT NULL AND rec.contact_phone != '') THEN
                INSERT INTO customer_contacts (customer_id, full_name, email, phone, created_at, updated_at)
                VALUES (
                    rec.id,
                    COALESCE(rec.contact_person, 'Yetkili Kişi'),
                    rec.contact_email,
                    rec.contact_phone,
                    CURRENT_TIMESTAMP,
                    CURRENT_TIMESTAMP
                )
                ON CONFLICT DO NOTHING;
            END IF;
        END LOOP;
    END IF;
END $$;

-- Note: After running this migration, you may need to update your application code
-- to use the new structure. Old columns will be dropped in a future migration.


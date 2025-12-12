-- ============================================
-- Products Table Migration to UUID - FIXED
-- ============================================
-- This script properly migrates from TEXT id to UUID
-- ============================================
-- Step 1: Add UUID column (will be new primary key)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT gen_random_uuid();
-- Step 2: Add product_code column (human-readable identifier)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS product_code TEXT;
-- Step 3: Populate product_code from existing id (if any data exists)
UPDATE products
SET product_code = id
WHERE product_code IS NULL;
-- Step 4: Drop old primary key constraint
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_pkey;
-- Step 5: Make old id column nullable (so we can insert without it)
ALTER TABLE products
ALTER COLUMN id DROP NOT NULL;
-- Step 6: Set uuid as new primary key
ALTER TABLE products
ADD PRIMARY KEY (uuid);
-- Step 7: Make product_code unique and NOT NULL
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'products_product_code_unique'
) THEN
ALTER TABLE products
ADD CONSTRAINT products_product_code_unique UNIQUE (product_code);
END IF;
END $$;
ALTER TABLE products
ALTER COLUMN product_code
SET NOT NULL;
-- Step 8: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_product_code ON products(product_code);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_material ON products(material);
-- Step 9: Add updated_at column if not exists
ALTER TABLE products
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
-- Step 10: Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_products_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ language 'plpgsql';
-- Step 11: Create trigger
DROP TRIGGER IF EXISTS update_products_updated_at_trigger ON products;
CREATE TRIGGER update_products_updated_at_trigger BEFORE
UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_products_updated_at();
-- ============================================
-- Verification
-- ============================================
-- Check table structure
SELECT column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;
-- Check constraints
SELECT conname,
    contype
FROM pg_constraint
WHERE conrelid = 'products'::regclass;
-- ============================================
-- Success! 
-- ============================================
-- Now products table uses:
-- - uuid (UUID) as PRIMARY KEY
-- - product_code (TEXT) as human-readable identifier
-- - id (TEXT) is nullable (for backward compatibility)
-- ============================================
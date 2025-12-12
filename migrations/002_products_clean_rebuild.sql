-- ============================================
-- Products Table - CLEAN REBUILD with UUID
-- ============================================
-- This script drops and recreates products table
-- with UUID as primary key from the start
-- ============================================
-- Step 1: Drop existing table (SAFE - no production data)
DROP TABLE IF EXISTS products CASCADE;
-- Step 2: Create new products table with UUID
CREATE TABLE products (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    subcategory TEXT,
    description TEXT,
    material TEXT,
    length TEXT,
    width TEXT,
    height TEXT,
    dimensions TEXT,
    image_url TEXT,
    variants JSONB DEFAULT '[]'::jsonb,
    -- Legacy columns (for backward compatibility, all nullable)
    id TEXT,
    price NUMERIC,
    stock INTEGER,
    color TEXT,
    crystal_color TEXT,
    bulb_type TEXT,
    light TEXT,
    remote TEXT,
    images TEXT [],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Step 3: Create indexes
CREATE INDEX idx_products_product_code ON products(product_code);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_material ON products(material);
CREATE INDEX idx_products_created_at ON products(created_at);
-- Step 4: Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- Step 5: Create RLS policy (allow all for now)
CREATE POLICY "Enable all access for products" ON products FOR ALL USING (true);
-- Step 6: Create updated_at trigger
CREATE OR REPLACE FUNCTION update_products_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ language 'plpgsql';
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
-- Check primary key
SELECT tc.constraint_name,
    kcu.column_name
FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'products'
    AND tc.constraint_type = 'PRIMARY KEY';
-- ============================================
-- Success!
-- ============================================
-- Products table now uses:
-- - uuid (UUID) as PRIMARY KEY ✅
-- - product_code (TEXT UNIQUE NOT NULL) ✅
-- - All legacy columns nullable ✅
-- ============================================
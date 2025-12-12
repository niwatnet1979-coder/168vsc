-- ============================================
-- Products Table Migration to UUID
-- ============================================
-- This script migrates products table to use UUID as primary key
-- Following the same pattern as employees table
-- 
-- IMPORTANT: Run this in Supabase SQL Editor
-- ============================================
-- Step 1: Backup existing data (if any)
-- You can export via Supabase dashboard before running this
-- Step 2: Drop existing tables
DROP TABLE IF EXISTS variants CASCADE;
DROP TABLE IF EXISTS products CASCADE;
-- Step 3: Create new products table with UUID
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_code TEXT UNIQUE NOT NULL,
    category TEXT,
    subcategory TEXT,
    name TEXT,
    material TEXT,
    length TEXT,
    width TEXT,
    height TEXT,
    description TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    variants JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Step 4: Create variants table (for future use)
CREATE TABLE variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    variant_code TEXT UNIQUE NOT NULL,
    color TEXT NOT NULL,
    price DECIMAL(10, 2),
    stock INTEGER DEFAULT 0,
    images JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Step 5: Create indexes for performance
CREATE INDEX idx_products_product_code ON products(product_code);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_material ON products(material);
CREATE INDEX idx_products_created_at ON products(created_at);
CREATE INDEX idx_variants_product_id ON variants(product_id);
CREATE INDEX idx_variants_variant_code ON variants(variant_code);
CREATE INDEX idx_variants_color ON variants(color);
-- Step 6: Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE variants ENABLE ROW LEVEL SECURITY;
-- Step 7: Create RLS policies (allow all for now)
CREATE POLICY "Enable all access for products" ON products FOR ALL USING (true);
CREATE POLICY "Enable all access for variants" ON variants FOR ALL USING (true);
-- Step 8: Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ language 'plpgsql';
-- Step 9: Create triggers
CREATE TRIGGER update_products_updated_at BEFORE
UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_variants_updated_at BEFORE
UPDATE ON variants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- ============================================
-- Migration Complete!
-- ============================================
-- Next steps:
-- 1. Verify tables created successfully
-- 2. Test inserting a product
-- 3. Update application code
-- ============================================
-- Test query (optional)
-- INSERT INTO products (product_code, category, material, length, width, height)
-- VALUES ('TEST-100-50-25-WD', 'AA โคมไฟระย้า', 'WD ไม้', '100', '50', '25')
-- RETURNING *;
-- ============================================
-- Step 2: CREATE products table with UUID
-- ============================================
-- Run this AFTER running step1_drop_products.sql
-- ============================================
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
    variants JSONB DEFAULT '[]'::jsonb,
    id TEXT,
    price NUMERIC,
    stock INTEGER,
    color TEXT,
    image_url TEXT,
    images TEXT [],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- Create policy
CREATE POLICY "Enable all access for products" ON products FOR ALL USING (true);
-- Create indexes
CREATE INDEX idx_products_product_code ON products(product_code);
CREATE INDEX idx_products_category ON products(category);
-- ============================================
-- Done! Now verify the table structure
-- ============================================
-- Step 3: Add variants column to products table
-- This is backward compatible - keeps existing columns
-- Add variants JSONB column
ALTER TABLE products
ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]'::jsonb;
-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_products_variants ON products USING GIN (variants);
-- Verify column added
SELECT column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_name = 'products'
    AND column_name = 'variants';
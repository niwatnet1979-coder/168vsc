-- Migration: Add is_deleted column to products and product_variants
-- Date: 2025-12-26
-- Description: Implement Soft Delete pattern to avoid Foreign Key constraints on deletion.
-- 1. Add is_deleted to products
ALTER TABLE products
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
-- 2. Add is_deleted to product_variants (for granular soft delete if needed in future)
ALTER TABLE product_variants
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
-- 3. Update existing records to ensure they are not deleted
UPDATE products
SET is_deleted = FALSE
WHERE is_deleted IS NULL;
UPDATE product_variants
SET is_deleted = FALSE
WHERE is_deleted IS NULL;
-- 4. Create an index for performance (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_products_is_deleted ON products(is_deleted);
-- Phase 14: Cleanup Unused Product Columns
-- Drop legacy columns that have been normalized into product_variants or are unused.
-- 1. Drop 'variants' (JSONB) - Data is now in 'product_variants' table
ALTER TABLE products DROP COLUMN IF EXISTS variants;
-- 2. Drop redundant fields (calculated/stored in variants)
ALTER TABLE products DROP COLUMN IF EXISTS price;
ALTER TABLE products DROP COLUMN IF EXISTS stock;
ALTER TABLE products DROP COLUMN IF EXISTS color;
ALTER TABLE products DROP COLUMN IF EXISTS images;
-- Unused array column
-- 3. Drop legacy ID (using UUID as PK now)
-- Ensure no external systems invoke 'id' (text) before running this.
-- If unsure, you can verify if 'id' is empty or matches 'uuid'.
ALTER TABLE products DROP COLUMN IF EXISTS id;
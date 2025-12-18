-- Phase 14: Final Products Cleanup (Round 2)
-- Remove remaining legacy columns that were verified as unused by the application.
-- 1. Drop 'image' (Text) - Application uses 'image_url' or variant images.
ALTER TABLE products DROP COLUMN IF EXISTS image;
-- 2. Drop 'code' (Text) - Application uses 'product_code' (and 'sku' in variants).
ALTER TABLE products DROP COLUMN IF EXISTS code;
-- Phase 15 Part 2: Drop unused image columns
-- Inspection confirmed that all variants have images, so dropping product-level image_url is safe.
ALTER TABLE products DROP COLUMN IF EXISTS image_url;
ALTER TABLE products DROP COLUMN IF EXISTS image;
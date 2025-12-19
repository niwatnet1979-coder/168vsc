-- Drop redundant column variation_notes from order_items table
-- This data is now sourced directly from the joined products table (description)
ALTER TABLE order_items DROP COLUMN IF EXISTS variation_notes;
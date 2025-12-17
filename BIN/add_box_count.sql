-- Add box_count column to inventory_items
ALTER TABLE inventory_items
ADD COLUMN box_count INTEGER DEFAULT 1;
-- If you also want to update the products table to match the new naming (optional but recommended for consistency)
-- ALTER TABLE products 
-- RENAME COLUMN pack_size TO box_count;
-- Comment on column for clarity
COMMENT ON COLUMN inventory_items.box_count IS 'Number of boxes that make up this single unit (Start 1)';
-- Add item_name column to purchase_order_items
ALTER TABLE purchase_order_items
ADD COLUMN IF NOT EXISTS item_name text;
-- Make product_id nullable to support Non-SKU items
ALTER TABLE purchase_order_items
ALTER COLUMN product_id DROP NOT NULL;
-- Add comments for clarity
COMMENT ON COLUMN purchase_order_items.item_name IS 'Name of the item for Non-SKU expenses (when product_id is null)';
COMMENT ON COLUMN purchase_order_items.product_id IS 'Reference to products table. Can be NULL for custom service items.';
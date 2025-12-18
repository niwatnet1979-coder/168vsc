-- Migration: Add discount column to order_items
-- Reason: To store discount explicitly for better financial reporting and analytics.
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS discount DECIMAL(10, 2) DEFAULT 0;
-- Optional: Update comment
COMMENT ON COLUMN order_items.discount IS 'Discount amount per item (fixed amount)';
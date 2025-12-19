-- Rename selected_contact_id to purchaser_contact_id in orders table
ALTER TABLE orders
    RENAME COLUMN selected_contact_id TO purchaser_contact_id;
-- Rename the index for consistency (if it exists)
IF EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE indexname = 'idx_orders_selected_contact_id'
) THEN ALTER INDEX idx_orders_selected_contact_id
RENAME TO idx_orders_purchaser_contact_id;
END IF;
-- Update Comment
COMMENT ON COLUMN orders.purchaser_contact_id IS 'Purchaser Contact (ผู้ติดต่อจัดซื้อ)';
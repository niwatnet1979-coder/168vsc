-- Drop redundant columns from orders table
-- These values are now fully managed in the order_items table
ALTER TABLE orders DROP COLUMN IF EXISTS assigned_team,
    DROP COLUMN IF EXISTS appointment_date,
    DROP COLUMN IF EXISTS completion_date,
    DROP COLUMN IF EXISTS notes,
    DROP COLUMN IF EXISTS delivery_address_id;
-- Migration: 05_update_inventory_status_constraint.sql
-- Description: Updates the status check constraint on inventory_items to allow 'pending_binding'
-- 1. Identify and update the status constraint
DO $$
DECLARE constraint_name TEXT;
BEGIN -- Find the constraint name that checks the 'status' column in 'inventory_items'
SELECT conname INTO constraint_name
FROM pg_constraint con
    JOIN pg_attribute att ON att.attrelid = con.conrelid
    AND att.attnum = ANY(con.conkey)
WHERE con.conrelid = 'inventory_items'::regclass
    AND con.contype = 'c'
    AND att.attname = 'status';
-- If found, drop it
IF constraint_name IS NOT NULL THEN EXECUTE 'ALTER TABLE inventory_items DROP CONSTRAINT ' || constraint_name;
END IF;
-- Re-add the constraint with 'pending_binding' included
-- Included standard statuses: in_stock, sold, shipped, cancelled, damaged, maintenance, qc_pending
ALTER TABLE inventory_items
ADD CONSTRAINT inventory_items_status_check CHECK (
        status IN (
            'in_stock',
            'sold',
            'shipped',
            'cancelled',
            'damaged',
            'maintenance',
            'qc_pending',
            'pending_binding'
        )
    );
RAISE NOTICE 'Updated inventory_items_status_check constraint.';
END $$;
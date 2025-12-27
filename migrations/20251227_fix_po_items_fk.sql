-- Add missing Foreign Key constraint to enable Joins (Corrected for UUID)
DO $$ BEGIN -- Check if constraint already exists to prevent errors on re-run
IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'purchase_order_items_product_id_fkey'
) THEN -- The products table uses 'uuid' as the primary key, not 'id'
ALTER TABLE purchase_order_items
ADD CONSTRAINT purchase_order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(uuid);
END IF;
END $$;
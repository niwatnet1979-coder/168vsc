-- Migration: Add FK between orders.customer_id and customers.id
-- Reason: To enable PostgREST to perform joins (PGRST200 fix).
-- 1. SAFEGUARD: Clean up orphaned records first 
-- (Set invalid customer_ids to NULL instead of deleting orders)
UPDATE orders
SET customer_id = NULL
WHERE customer_id IS NOT NULL
    AND customer_id NOT IN (
        SELECT id
        FROM customers
    );
-- 2. Add the constraint (Now it will pass)
ALTER TABLE orders
ADD CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE
SET NULL;
-- 3. Optional but recommended index
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
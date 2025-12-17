-- Phase 1: Add customer_id FK to orders table
-- Migration: Refactor orders to use customer_id instead of customer_details JSONB
-- Date: 2025-12-17
-- Author: Database Refactoring - Phase 1
-- ============================================================================
-- Step 1: Add new column for customer reference
-- ============================================================================
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS customer_id TEXT;
COMMENT ON COLUMN orders.customer_id IS 'Foreign key reference to customers.id - replaces customer_details JSONB';
-- ============================================================================
-- Step 2: Add foreign key constraint
-- ============================================================================
ALTER TABLE orders
ADD CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT -- Prevent deleting customer with existing orders
    ON UPDATE CASCADE;
-- Update orders if customer ID changes
-- ============================================================================
-- Step 3: Create index for query performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
COMMENT ON INDEX idx_orders_customer_id IS 'Index for efficient customer-order lookups';
-- ============================================================================
-- Step 4: Populate customer_id from existing customer_details JSONB
-- ============================================================================
UPDATE orders
SET customer_id = (customer_details->>'id')::TEXT
WHERE customer_details IS NOT NULL
    AND customer_details->>'id' IS NOT NULL
    AND customer_id IS NULL;
-- Only update if not already set
-- ============================================================================
-- Step 5: Verify data migration
-- ============================================================================
DO $$
DECLARE total_orders INTEGER;
migrated_orders INTEGER;
unmigrated_orders INTEGER;
BEGIN
SELECT COUNT(*) INTO total_orders
FROM orders;
SELECT COUNT(*) INTO migrated_orders
FROM orders
WHERE customer_id IS NOT NULL;
unmigrated_orders := total_orders - migrated_orders;
RAISE NOTICE '========================================';
RAISE NOTICE 'Phase 1 Migration Summary';
RAISE NOTICE '========================================';
RAISE NOTICE 'Total orders: %',
total_orders;
RAISE NOTICE 'Migrated orders: %',
migrated_orders;
RAISE NOTICE 'Unmigrated orders: %',
unmigrated_orders;
RAISE NOTICE '========================================';
IF unmigrated_orders > 0 THEN RAISE WARNING 'Some orders do not have customer_id! Please investigate.';
ELSE RAISE NOTICE 'All orders successfully migrated!';
END IF;
END $$;
-- ============================================================================
-- Step 6: (MANUAL) Make customer_id NOT NULL after verification
-- ============================================================================
-- Run this command manually after verifying all orders have customer_id:
-- ALTER TABLE orders ALTER COLUMN customer_id SET NOT NULL;
-- ============================================================================
-- Step 7: (FUTURE) Remove old JSONB columns after Phase 1 is verified
-- ============================================================================
-- Run these commands manually after Phase 1 is fully tested and verified:
-- ALTER TABLE orders DROP COLUMN customer_details;
-- ALTER TABLE orders DROP COLUMN selected_contact;
-- ALTER TABLE orders DROP COLUMN tax_invoice_info;
-- ALTER TABLE orders DROP COLUMN delivery_address_info;
-- ============================================================================
-- Rollback Instructions (if needed)
-- ============================================================================
-- To rollback this migration:
-- 1. DROP CONSTRAINT: ALTER TABLE orders DROP CONSTRAINT IF EXISTS fk_orders_customer;
-- 2. DROP INDEX: DROP INDEX IF EXISTS idx_orders_customer_id;
-- 3. DROP COLUMN: ALTER TABLE orders DROP COLUMN IF EXISTS customer_id;
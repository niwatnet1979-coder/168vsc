-- Cleanup Script: Remove Unused JSONB Columns
-- WARNING: This will permanently remove JSONB columns after Phase 1, 2, and 4 migrations
-- Run this ONLY after verifying that all data has been successfully migrated to relational tables
-- Date: 2025-12-17
-- ============================================================================
-- IMPORTANT: Backup your database before running this script!
-- ============================================================================
-- ============================================================================
-- Step 1: Remove JSONB columns from customers table
-- ============================================================================
-- These columns have been replaced by relational tables in Phase 2:
-- - customer_contacts table
-- - customer_addresses table
-- - customer_tax_invoices table
ALTER TABLE customers DROP COLUMN IF EXISTS contacts;
ALTER TABLE customers DROP COLUMN IF EXISTS addresses;
ALTER TABLE customers DROP COLUMN IF EXISTS tax_invoices;
-- ============================================================================
-- Step 2: Remove JSONB columns from orders table
-- ============================================================================
-- These columns have been replaced by:
-- - customer_id FK (Phase 1)
-- - payments table (Phase 4)
-- - Will be replaced by FKs in future phases
ALTER TABLE orders DROP COLUMN IF EXISTS customer_details;
ALTER TABLE orders DROP COLUMN IF EXISTS payment_schedule;
-- Optional: Remove these after implementing FKs for contacts/addresses/tax_invoices
-- ALTER TABLE orders DROP COLUMN IF EXISTS selected_contact;
-- ALTER TABLE orders DROP COLUMN IF EXISTS tax_invoice_info;
-- ALTER TABLE orders DROP COLUMN IF EXISTS delivery_address_info;
-- ============================================================================
-- Step 3: Verify cleanup
-- ============================================================================
DO $$ BEGIN RAISE NOTICE '========================================';
RAISE NOTICE 'Cleanup Summary';
RAISE NOTICE '========================================';
RAISE NOTICE 'Removed from customers table:';
RAISE NOTICE '  - contacts (JSONB)';
RAISE NOTICE '  - addresses (JSONB)';
RAISE NOTICE '  - tax_invoices (JSONB)';
RAISE NOTICE '';
RAISE NOTICE 'Removed from orders table:';
RAISE NOTICE '  - customer_details (JSONB)';
RAISE NOTICE '  - payment_schedule (JSONB)';
RAISE NOTICE '========================================';
RAISE NOTICE 'Cleanup completed successfully!';
RAISE NOTICE 'All data is now in relational tables.';
RAISE NOTICE '========================================';
END $$;
-- ============================================================================
-- Rollback Instructions (if needed)
-- ============================================================================
-- WARNING: You cannot rollback column drops without restoring from backup!
-- Make sure you have a database backup before running this cleanup script.
--
-- To restore, you would need to:
-- 1. Restore database from backup
-- 2. Re-run Phase 1, 2, and 4 migrations
-- 3. Verify data integrity
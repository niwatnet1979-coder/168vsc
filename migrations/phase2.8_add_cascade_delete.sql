-- Phase 2.8: Add CASCADE DELETE for customer related tables
-- Migration: Add ON DELETE CASCADE to FK constraints
-- Date: 2025-12-17
-- Author: Database Refactoring - Phase 2.8
-- ============================================================================
-- Step 1: Drop existing FK constraints
-- ============================================================================
ALTER TABLE customer_contacts DROP CONSTRAINT IF EXISTS customer_contacts_customer_id_fkey;
ALTER TABLE customer_addresses DROP CONSTRAINT IF EXISTS customer_addresses_customer_id_fkey;
ALTER TABLE customer_tax_invoices DROP CONSTRAINT IF EXISTS customer_tax_invoices_customer_id_fkey;
ALTER TABLE customer_tax_invoices DROP CONSTRAINT IF EXISTS customer_tax_invoices_address_id_fkey;
-- ============================================================================
-- Step 2: Add FK constraints with CASCADE DELETE
-- ============================================================================
ALTER TABLE customer_contacts
ADD CONSTRAINT customer_contacts_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
ALTER TABLE customer_addresses
ADD CONSTRAINT customer_addresses_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
ALTER TABLE customer_tax_invoices
ADD CONSTRAINT customer_tax_invoices_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
ALTER TABLE customer_tax_invoices
ADD CONSTRAINT customer_tax_invoices_address_id_fkey FOREIGN KEY (address_id) REFERENCES customer_addresses(id) ON DELETE
SET NULL;
-- ============================================================================
-- Step 3: Verify migration
-- ============================================================================
DO $$ BEGIN RAISE NOTICE '========================================';
RAISE NOTICE 'Phase 2.8 Migration Summary';
RAISE NOTICE '========================================';
RAISE NOTICE 'Added CASCADE DELETE to FK constraints:';
RAISE NOTICE '  - customer_contacts.customer_id → ON DELETE CASCADE';
RAISE NOTICE '  - customer_addresses.customer_id → ON DELETE CASCADE';
RAISE NOTICE '  - customer_tax_invoices.customer_id → ON DELETE CASCADE';
RAISE NOTICE '  - customer_tax_invoices.address_id → ON DELETE SET NULL';
RAISE NOTICE '========================================';
RAISE NOTICE 'Migration completed successfully!';
RAISE NOTICE '========================================';
END $$;
-- ============================================================================
-- Rollback Instructions (if needed)
-- ============================================================================
-- To rollback this migration, drop and recreate constraints without CASCADE:
-- ALTER TABLE customer_contacts DROP CONSTRAINT customer_contacts_customer_id_fkey;
-- ALTER TABLE customer_contacts ADD CONSTRAINT customer_contacts_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id);
-- (repeat for other tables)
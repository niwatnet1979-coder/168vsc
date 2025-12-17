-- Phase 2.5: Add FK References to Orders Table
-- Migration: Add foreign key columns to orders for selected contact, delivery address, and tax invoice
-- Date: 2025-12-17
-- Author: Database Refactoring - Phase 2.5
-- ============================================================================
-- Step 1: Add FK columns to orders table
-- ============================================================================
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS selected_contact_id UUID REFERENCES customer_contacts(id);
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS delivery_address_id UUID REFERENCES customer_addresses(id);
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS tax_invoice_id UUID REFERENCES customer_tax_invoices(id);
-- ============================================================================
-- Step 2: Create indexes for performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_orders_selected_contact_id ON orders(selected_contact_id);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_address_id ON orders(delivery_address_id);
CREATE INDEX IF NOT EXISTS idx_orders_tax_invoice_id ON orders(tax_invoice_id);
-- ============================================================================
-- Step 3: Add comments
-- ============================================================================
COMMENT ON COLUMN orders.selected_contact_id IS 'Foreign key to customer_contacts table - selected contact for this order';
COMMENT ON COLUMN orders.delivery_address_id IS 'Foreign key to customer_addresses table - delivery address for this order';
COMMENT ON COLUMN orders.tax_invoice_id IS 'Foreign key to customer_tax_invoices table - tax invoice info for this order';
-- ============================================================================
-- Step 4: Verify migration
-- ============================================================================
DO $$ BEGIN RAISE NOTICE '========================================';
RAISE NOTICE 'Phase 2.5 Migration Summary';
RAISE NOTICE '========================================';
RAISE NOTICE 'Added FK columns to orders table:';
RAISE NOTICE '  - selected_contact_id (UUID)';
RAISE NOTICE '  - delivery_address_id (UUID)';
RAISE NOTICE '  - tax_invoice_id (UUID)';
RAISE NOTICE '========================================';
RAISE NOTICE 'Migration completed successfully!';
RAISE NOTICE 'Orders can now reference customer contacts, addresses, and tax invoices.';
RAISE NOTICE '========================================';
END $$;
-- ============================================================================
-- Step 5: (FUTURE) Remove JSONB columns after verification
-- ============================================================================
-- Run manually after Phase 2.5 is fully tested:
-- ALTER TABLE orders DROP COLUMN IF EXISTS selected_contact;
-- ALTER TABLE orders DROP COLUMN IF EXISTS delivery_address_info;
-- ALTER TABLE orders DROP COLUMN IF EXISTS tax_invoice_info;
-- ============================================================================
-- Rollback Instructions (if needed)
-- ============================================================================
-- To rollback this migration:
-- ALTER TABLE orders DROP COLUMN IF EXISTS selected_contact_id;
-- ALTER TABLE orders DROP COLUMN IF EXISTS delivery_address_id;
-- ALTER TABLE orders DROP COLUMN IF EXISTS tax_invoice_id;
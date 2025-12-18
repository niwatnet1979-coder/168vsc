-- Phase 2.13: Cleanup Unused Columns
-- Migration: Drop unused address_id column from customer_tax_invoices
-- Date: 2025-12-17
-- Description: This column was from an older design and is no longer used.
ALTER TABLE customer_tax_invoices DROP COLUMN IF EXISTS address_id;
-- Verify
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'customer_tax_invoices'
        AND column_name = 'address_id'
) THEN RAISE NOTICE 'Column address_id successfully dropped.';
ELSE RAISE WARNING 'Column address_id still exists!';
END IF;
END $$;
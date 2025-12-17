-- Phase 2: Customer Related Tables
-- Migration: Extract contacts, addresses, tax_invoices from JSONB to relational tables
-- Date: 2025-12-17
-- Author: Database Refactoring - Phase 2
-- ============================================================================
-- Step 1: Create customer_contacts table
-- ============================================================================
CREATE TABLE IF NOT EXISTS customer_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    line_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_customer_contacts_customer_id ON customer_contacts(customer_id);
COMMENT ON TABLE customer_contacts IS 'Customer contact persons - extracted from customers.contacts JSONB';
COMMENT ON COLUMN customer_contacts.customer_id IS 'Foreign key to customers table';
-- ============================================================================
-- Step 2: Create customer_addresses table
-- ============================================================================
CREATE TABLE IF NOT EXISTS customer_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    label TEXT,
    address TEXT NOT NULL,
    sub_district TEXT,
    district TEXT,
    province TEXT,
    postal_code TEXT,
    google_map_link TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer_id ON customer_addresses(customer_id);
COMMENT ON TABLE customer_addresses IS 'Customer addresses - extracted from customers.addresses JSONB';
COMMENT ON COLUMN customer_addresses.customer_id IS 'Foreign key to customers table';
-- ============================================================================
-- Step 3: Create customer_tax_invoices table
-- ============================================================================
CREATE TABLE IF NOT EXISTS customer_tax_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    tax_id TEXT NOT NULL,
    address TEXT,
    branch_number TEXT,
    branch_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_customer_tax_invoices_customer_id ON customer_tax_invoices(customer_id);
COMMENT ON TABLE customer_tax_invoices IS 'Customer tax invoice information - extracted from customers.tax_invoices JSONB';
COMMENT ON COLUMN customer_tax_invoices.customer_id IS 'Foreign key to customers table';
-- ============================================================================
-- Step 4: Migrate contacts from JSONB to table
-- ============================================================================
INSERT INTO customer_contacts (customer_id, name, phone, line_id)
SELECT c.id,
    contact->>'name',
    contact->>'phone',
    contact->>'lineId'
FROM customers c,
    LATERAL jsonb_array_elements(c.contacts) AS contact
WHERE c.contacts IS NOT NULL
    AND jsonb_array_length(c.contacts) > 0 ON CONFLICT DO NOTHING;
-- ============================================================================
-- Step 5: Migrate addresses from JSONB to table
-- ============================================================================
INSERT INTO customer_addresses (
        customer_id,
        label,
        address,
        sub_district,
        district,
        province,
        postal_code,
        google_map_link
    )
SELECT c.id,
    addr->>'label',
    addr->>'address',
    addr->>'subDistrict',
    addr->>'district',
    addr->>'province',
    addr->>'postalCode',
    addr->>'googleMapLink'
FROM customers c,
    LATERAL jsonb_array_elements(c.addresses) AS addr
WHERE c.addresses IS NOT NULL
    AND jsonb_array_length(c.addresses) > 0 ON CONFLICT DO NOTHING;
-- ============================================================================
-- Step 6: Migrate tax invoices from JSONB to table
-- ============================================================================
INSERT INTO customer_tax_invoices (
        customer_id,
        company_name,
        tax_id,
        address,
        branch_number,
        branch_name
    )
SELECT c.id,
    tax->>'companyName',
    tax->>'taxId',
    tax->>'address',
    tax->>'branchNumber',
    tax->>'branchName'
FROM customers c,
    LATERAL jsonb_array_elements(c.tax_invoices) AS tax
WHERE c.tax_invoices IS NOT NULL
    AND jsonb_array_length(c.tax_invoices) > 0 ON CONFLICT DO NOTHING;
-- ============================================================================
-- Step 7: Verify migration
-- ============================================================================
DO $$
DECLARE total_customers INTEGER;
total_contacts INTEGER;
total_addresses INTEGER;
total_tax_invoices INTEGER;
BEGIN
SELECT COUNT(*) INTO total_customers
FROM customers;
SELECT COUNT(*) INTO total_contacts
FROM customer_contacts;
SELECT COUNT(*) INTO total_addresses
FROM customer_addresses;
SELECT COUNT(*) INTO total_tax_invoices
FROM customer_tax_invoices;
RAISE NOTICE '========================================';
RAISE NOTICE 'Phase 2 Migration Summary';
RAISE NOTICE '========================================';
RAISE NOTICE 'Total customers: %',
total_customers;
RAISE NOTICE 'Migrated contacts: %',
total_contacts;
RAISE NOTICE 'Migrated addresses: %',
total_addresses;
RAISE NOTICE 'Migrated tax invoices: %',
total_tax_invoices;
RAISE NOTICE '========================================';
IF total_contacts > 0
OR total_addresses > 0
OR total_tax_invoices > 0 THEN RAISE NOTICE 'Migration completed successfully!';
ELSE RAISE WARNING 'No data migrated - customers may not have contacts/addresses/tax_invoices';
END IF;
END $$;
-- ============================================================================
-- Step 8: (FUTURE) Add FK columns to orders table for selected items
-- ============================================================================
-- Run after Phase 2 is verified and tested:
-- ALTER TABLE orders ADD COLUMN IF NOT EXISTS selected_contact_id UUID REFERENCES customer_contacts(id);
-- ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address_id UUID REFERENCES customer_addresses(id);
-- ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_invoice_id UUID REFERENCES customer_tax_invoices(id);
-- CREATE INDEX IF NOT EXISTS idx_orders_selected_contact_id ON orders(selected_contact_id);
-- CREATE INDEX IF NOT EXISTS idx_orders_delivery_address_id ON orders(delivery_address_id);
-- CREATE INDEX IF NOT EXISTS idx_orders_tax_invoice_id ON orders(tax_invoice_id);
-- ============================================================================
-- Step 9: (FUTURE) Remove JSONB columns after verification
-- ============================================================================
-- Run manually after Phase 2 is fully tested and verified:
-- ALTER TABLE customers DROP COLUMN IF EXISTS contacts;
-- ALTER TABLE customers DROP COLUMN IF EXISTS addresses;
-- ALTER TABLE customers DROP COLUMN IF EXISTS tax_invoices;
-- ============================================================================
-- Rollback Instructions (if needed)
-- ============================================================================
-- To rollback this migration:
-- 1. DROP TABLES: 
--    DROP TABLE IF EXISTS customer_tax_invoices CASCADE;
--    DROP TABLE IF EXISTS customer_addresses CASCADE;
--    DROP TABLE IF EXISTS customer_contacts CASCADE;
-- ============================================================
-- Customer Module Schema Redesign - International Standards
-- ============================================================
-- This migration renames all fields to use clear, international
-- standard English names with no underscores where possible.
-- No mapping will be needed between database and code.
-- ============================================================
-- ========== customers table ==========
ALTER TABLE customers
    RENAME COLUMN line_id TO line;
ALTER TABLE customers
    RENAME COLUMN media_source TO media;
-- ========== customer_addresses table ==========
ALTER TABLE customer_addresses
    RENAME COLUMN addr_number TO number;
ALTER TABLE customer_addresses
    RENAME COLUMN addr_moo TO villageno;
ALTER TABLE customer_addresses
    RENAME COLUMN addr_village TO village;
ALTER TABLE customer_addresses
    RENAME COLUMN addr_soi TO lane;
ALTER TABLE customer_addresses
    RENAME COLUMN addr_road TO road;
ALTER TABLE customer_addresses
    RENAME COLUMN addr_tambon TO subdistrict;
ALTER TABLE customer_addresses
    RENAME COLUMN addr_amphoe TO district;
ALTER TABLE customer_addresses
    RENAME COLUMN addr_province TO province;
ALTER TABLE customer_addresses
    RENAME COLUMN google_maps_link TO maps;
-- ========== customer_contacts table ==========
ALTER TABLE customer_contacts
    RENAME COLUMN line_id TO line;
-- ========== customer_tax_invoices table ==========
ALTER TABLE customer_tax_invoices
    RENAME COLUMN company_name TO company;
ALTER TABLE customer_tax_invoices
    RENAME COLUMN tax_id TO taxid;
ALTER TABLE customer_tax_invoices
    RENAME COLUMN house_number TO number;
ALTER TABLE customer_tax_invoices
    RENAME COLUMN village_no TO villageno;
ALTER TABLE customer_tax_invoices
    RENAME COLUMN soi TO lane;
ALTER TABLE customer_tax_invoices
    RENAME COLUMN sub_district TO subdistrict;
ALTER TABLE customer_tax_invoices
    RENAME COLUMN postal_code TO zipcode;
-- ============================================================
-- Verification queries
-- ============================================================
-- Verify customers table
SELECT column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'customers'
ORDER BY ordinal_position;
-- Verify customer_addresses table
SELECT column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'customer_addresses'
ORDER BY ordinal_position;
-- Verify customer_contacts table
SELECT column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'customer_contacts'
ORDER BY ordinal_position;
-- Verify customer_tax_invoices table
SELECT column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'customer_tax_invoices'
ORDER BY ordinal_position;
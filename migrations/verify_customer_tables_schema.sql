-- Get complete schema for all 4 customer tables
-- This will help verify database structure matches code expectations
-- 1. customers table
SELECT 'customers' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'customers'
ORDER BY ordinal_position;
-- 2. customer_addresses table
SELECT 'customer_addresses' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'customer_addresses'
ORDER BY ordinal_position;
-- 3. customer_contacts table
SELECT 'customer_contacts' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'customer_contacts'
ORDER BY ordinal_position;
-- 4. customer_tax_invoices table
SELECT 'customer_tax_invoices' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'customer_tax_invoices'
ORDER BY ordinal_position;
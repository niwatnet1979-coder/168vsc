-- Check village-related columns in customer_tax_invoices
SELECT column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'customer_tax_invoices'
    AND column_name LIKE '%village%'
ORDER BY column_name;
-- Check all columns
SELECT column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'customer_tax_invoices'
ORDER BY ordinal_position;
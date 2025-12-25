-- Check customer_tax_invoices table structure
SELECT column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'customer_tax_invoices'
ORDER BY ordinal_position;
-- Check for any constraints
SELECT conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.customer_tax_invoices'::regclass;
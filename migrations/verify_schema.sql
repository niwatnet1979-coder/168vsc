-- Check products table schema
SELECT column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;
-- Check if product_code is NOT NULL
SELECT conname as constraint_name,
    contype as constraint_type
FROM pg_constraint
WHERE conrelid = 'products'::regclass;
-- Check current primary key
SELECT tc.constraint_name,
    kcu.column_name
FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'products'
    AND tc.constraint_type = 'PRIMARY KEY';
-- Check if id is nullable
SELECT column_name,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'products'
    AND column_name IN ('id', 'uuid', 'product_code')
ORDER BY column_name;
-- Check if there are any orders with non-UUID IDs
SELECT id,
    LENGTH(id::text) as id_length,
    customer_id
FROM orders
LIMIT 10;
-- Check the actual data type of the id column
SELECT column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'orders'
    AND column_name = 'id';
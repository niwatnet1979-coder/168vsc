-- ============================================
-- Simple SQL Queries - Run Each Separately
-- ============================================

-- Query 1: List all tables (Run this first)
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Query 2: Check jobs table structure
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'jobs'
ORDER BY ordinal_position;

-- Query 3: Check order_items table structure
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'order_items'
ORDER BY ordinal_position;

-- Query 4: Check foreign keys for jobs table
SELECT
    tc.constraint_name,
    kcu.column_name AS source_column,
    ccu.table_name AS target_table,
    ccu.column_name AS target_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND tc.table_name = 'jobs'
ORDER BY kcu.column_name;

-- Query 5: Check data in jobs for specific order
SELECT 
    id AS job_id,
    order_item_id,
    order_id,
    sequence_number,
    job_type,
    status,
    LENGTH(order_item_id::text) AS order_item_id_length,
    order_item_id::text AS order_item_id_text
FROM jobs
WHERE order_id = 'a794c38c-efe2-4989-817b-7d7ec583a3b5'
ORDER BY sequence_number;

-- Query 6: Check data in order_items for specific order
SELECT 
    id AS order_item_id,
    order_id,
    product_id,
    quantity,
    unit_price,
    LENGTH(id::text) AS id_length,
    id::text AS id_text
FROM order_items
WHERE order_id = 'a794c38c-efe2-4989-817b-7d7ec583a3b5'
ORDER BY created_at;

-- Query 7: Check if jobs.order_item_id matches order_items.id
SELECT 
    j.id AS job_id,
    j.order_item_id AS job_order_item_id,
    j.order_item_id::text AS job_order_item_id_text,
    oi.id AS order_item_id,
    oi.id::text AS order_item_id_text,
    CASE 
        WHEN j.order_item_id = oi.id THEN 'MATCH ✓'
        WHEN j.order_item_id::text = oi.id::text THEN 'MATCH (text) ✓'
        ELSE 'NO MATCH ✗'
    END AS match_status
FROM jobs j
LEFT JOIN order_items oi ON j.order_item_id = oi.id
WHERE j.order_id = 'a794c38c-efe2-4989-817b-7d7ec583a3b5'
ORDER BY j.sequence_number;

-- Query 8: Count jobs per order_item
SELECT 
    oi.id AS order_item_id,
    oi.order_id,
    COUNT(j.id) AS jobs_count,
    STRING_AGG(j.id::text, ', ') AS job_ids
FROM order_items oi
LEFT JOIN jobs j ON j.order_item_id = oi.id
WHERE oi.order_id = 'a794c38c-efe2-4989-817b-7d7ec583a3b5'
GROUP BY oi.id, oi.order_id
ORDER BY oi.created_at;




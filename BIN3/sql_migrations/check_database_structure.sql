-- ============================================
-- SQL Query to Display Complete Database Structure
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. List all tables
SELECT 
    table_schema,
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Show all columns for each table (with data types and constraints)
SELECT 
    t.table_name,
    c.column_name,
    c.data_type,
    c.character_maximum_length,
    c.is_nullable,
    c.column_default,
    CASE 
        WHEN pk.column_name IS NOT NULL THEN 'PRIMARY KEY'
        WHEN fk.column_name IS NOT NULL THEN 'FOREIGN KEY -> ' || fk.foreign_table_name || '.' || fk.foreign_column_name
        ELSE ''
    END AS key_type
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
LEFT JOIN (
    SELECT ku.table_name, ku.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage ku 
        ON tc.constraint_name = ku.constraint_name
    WHERE tc.constraint_type = 'PRIMARY KEY'
) pk ON c.table_name = pk.table_name AND c.column_name = pk.column_name
LEFT JOIN (
    SELECT
        ku.table_name,
        ku.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS ku
        ON tc.constraint_name = ku.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
) fk ON c.table_name = fk.table_name AND c.column_name = fk.column_name
WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name, c.ordinal_position;

-- 3. Show all foreign key relationships
SELECT
    tc.table_name AS source_table,
    kcu.column_name AS source_column,
    ccu.table_name AS target_table,
    ccu.column_name AS target_column,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- 4. Show indexes
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 5. Check specific tables: orders, order_items, jobs
SELECT 
    'orders' AS table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'orders'
ORDER BY ordinal_position;

SELECT 
    'order_items' AS table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'order_items'
ORDER BY ordinal_position;

SELECT 
    'jobs' AS table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'jobs'
ORDER BY ordinal_position;

-- 6. Check data in jobs table for the specific order
SELECT 
    j.id AS job_id,
    j.order_item_id,
    j.order_id,
    j.sequence_number,
    j.job_type,
    j.status,
    j.assigned_team,
    j.appointment_date,
    j.completion_date,
    j.site_inspector_id,
    j.site_address_id,
    j.notes,
    j.created_at,
    j.updated_at,
    oi.id AS order_item_id_from_items,
    oi.order_id AS order_id_from_items,
    CASE 
        WHEN j.order_item_id = oi.id THEN 'MATCH'
        ELSE 'NO MATCH'
    END AS match_status
FROM jobs j
LEFT JOIN order_items oi ON j.order_item_id = oi.id
WHERE j.order_id = 'a794c38c-efe2-4989-817b-7d7ec583a3b5'
ORDER BY j.sequence_number;

-- 7. Check data in order_items for the specific order
SELECT 
    oi.id AS order_item_id,
    oi.order_id,
    oi.product_id,
    oi.product_variant_id,
    oi.quantity,
    oi.unit_price,
    oi.total_price,
    oi.created_at,
    COUNT(j.id) AS jobs_count
FROM order_items oi
LEFT JOIN jobs j ON j.order_item_id = oi.id
WHERE oi.order_id = 'a794c38c-efe2-4989-817b-7d7ec583a3b5'
GROUP BY oi.id, oi.order_id, oi.product_id, oi.product_variant_id, oi.quantity, oi.unit_price, oi.total_price, oi.created_at
ORDER BY oi.created_at;

-- 8. Check UUID types and formats
SELECT 
    'jobs.order_item_id' AS column_info,
    COUNT(*) AS total_rows,
    COUNT(DISTINCT order_item_id) AS distinct_order_item_ids,
    MIN(LENGTH(order_item_id::text)) AS min_length,
    MAX(LENGTH(order_item_id::text)) AS max_length,
    MIN(order_item_id::text) AS sample_min,
    MAX(order_item_id::text) AS sample_max
FROM jobs
WHERE order_id = 'a794c38c-efe2-4989-817b-7d7ec583a3b5';

SELECT 
    'order_items.id' AS column_info,
    COUNT(*) AS total_rows,
    COUNT(DISTINCT id) AS distinct_ids,
    MIN(LENGTH(id::text)) AS min_length,
    MAX(LENGTH(id::text)) AS max_length,
    MIN(id::text) AS sample_min,
    MAX(id::text) AS sample_max
FROM order_items
WHERE order_id = 'a794c38c-efe2-4989-817b-7d7ec583a3b5';




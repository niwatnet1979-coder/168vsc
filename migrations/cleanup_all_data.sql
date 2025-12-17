-- Clean All Data Script
-- WARNING: This will delete ALL data from the database!
-- Use this for testing/development only
-- ============================================================================
-- Delete data in correct order (respect foreign keys)
-- ============================================================================
-- 1. Delete order-related data first
DELETE FROM order_items;
DELETE FROM orders;
-- 2. Delete job-related data
DELETE FROM job_completions;
DELETE FROM jobs;
-- 3. Delete inventory and QC data
DELETE FROM qc_evidence;
DELETE FROM qc_records;
DELETE FROM item_tracking;
DELETE FROM inventory_logs;
DELETE FROM inventory_items;
-- 4. Delete purchase orders
DELETE FROM purchase_items;
DELETE FROM purchase_orders;
-- 5. Delete leave requests
DELETE FROM leave_requests;
-- 6. Delete customers
DELETE FROM customers;
-- 7. Delete employees
DELETE FROM employees;
-- 8. Delete products
DELETE FROM products;
-- 9. Delete QC templates
DELETE FROM qc_templates;
-- ============================================================================
-- Verify deletion
-- ============================================================================
DO $$ BEGIN RAISE NOTICE '========================================';
RAISE NOTICE 'Data Cleanup Summary';
RAISE NOTICE '========================================';
RAISE NOTICE 'Orders: % rows',
(
    SELECT COUNT(*)
    FROM orders
);
RAISE NOTICE 'Order Items: % rows',
(
    SELECT COUNT(*)
    FROM order_items
);
RAISE NOTICE 'Customers: % rows',
(
    SELECT COUNT(*)
    FROM customers
);
RAISE NOTICE 'Jobs: % rows',
(
    SELECT COUNT(*)
    FROM jobs
);
RAISE NOTICE 'Inventory Items: % rows',
(
    SELECT COUNT(*)
    FROM inventory_items
);
RAISE NOTICE 'Products: % rows',
(
    SELECT COUNT(*)
    FROM products
);
RAISE NOTICE '========================================';
RAISE NOTICE 'All data deleted successfully!';
END $$;
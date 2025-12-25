-- ============================================================
-- CUSTOMER MODULE - FINAL VERIFICATION
-- ============================================================
-- Complete schema verification for all 4 customer tables
-- Run this to confirm everything is correct before closing
-- ========== 1. customers table ==========
SELECT 'customers' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'customers'
ORDER BY ordinal_position;
-- ========== 2. customer_addresses table ==========
SELECT 'customer_addresses' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'customer_addresses'
ORDER BY ordinal_position;
-- ========== 3. customer_contacts table ==========
SELECT 'customer_contacts' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'customer_contacts'
ORDER BY ordinal_position;
-- ========== 4. customer_tax_invoices table ==========
SELECT 'customer_tax_invoices' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'customer_tax_invoices'
ORDER BY ordinal_position;
-- ========== 5. Realtime Status ==========
SELECT 'REALTIME' as check_type,
    schemaname,
    tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename LIKE 'customer%'
ORDER BY tablename;
-- ========== 6. Row Level Security ==========
SELECT 'RLS' as check_type,
    tablename,
    CASE
        WHEN rowsecurity THEN 'ENABLED'
        ELSE 'DISABLED'
    END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename LIKE 'customer%'
ORDER BY tablename;
-- ========== EXPECTED RESULTS ==========
-- customers: id, name, phone, email, line, facebook, instagram, media, created_at
-- customer_addresses: id, customer_id, label, number, villageno, village, lane, road, subdistrict, district, province, zipcode, maps, distance, created_at
-- customer_contacts: id, customer_id, name, position, phone, email, line, note, created_at
-- customer_tax_invoices: id, customer_id, company, taxid, branch, number, villageno, village, building, lane, road, subdistrict, district, province, zipcode, created_at
-- Realtime: All 4 tables should be listed
-- RLS: All 4 tables should be ENABLED
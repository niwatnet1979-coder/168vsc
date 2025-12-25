-- Verify RLS and policies are correctly set up
-- 1. Check if RLS is enabled on tables
SELECT schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN (
        'customer_addresses',
        'customer_contacts',
        'customer_tax_invoices'
    )
ORDER BY tablename;
-- 2. Check if policies exist
SELECT schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN (
        'customer_addresses',
        'customer_contacts',
        'customer_tax_invoices'
    )
ORDER BY tablename,
    policyname;
-- 3. Check table ownership and grants
SELECT table_schema,
    table_name,
    privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
    AND table_name IN (
        'customer_addresses',
        'customer_contacts',
        'customer_tax_invoices'
    )
    AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY table_name,
    grantee,
    privilege_type;
-- Add remaining customer tables to realtime publication
-- Currently only customer_contacts is enabled
-- Add the 3 missing tables
ALTER PUBLICATION supabase_realtime
ADD TABLE customers;
ALTER PUBLICATION supabase_realtime
ADD TABLE customer_addresses;
ALTER PUBLICATION supabase_realtime
ADD TABLE customer_tax_invoices;
-- Verify all 4 tables are now enabled
SELECT schemaname,
    tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename LIKE 'customer%'
ORDER BY tablename;
-- Enable Realtime for Customer Tables
-- This allows automatic synchronization of data changes across all connected clients
-- Simply add tables to publication
-- If they already exist, PostgreSQL will ignore them
ALTER PUBLICATION supabase_realtime
ADD TABLE customers;
ALTER PUBLICATION supabase_realtime
ADD TABLE customer_addresses;
ALTER PUBLICATION supabase_realtime
ADD TABLE customer_contacts;
ALTER PUBLICATION supabase_realtime
ADD TABLE customer_tax_invoices;
-- Verify realtime is enabled
SELECT schemaname,
    tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename LIKE 'customer%'
ORDER BY tablename;
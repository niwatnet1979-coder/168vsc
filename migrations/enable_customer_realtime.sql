-- Enable Realtime for Customer Tables
-- This allows automatic synchronization of data changes across all connected clients
-- First, remove tables if they're already in publication (to avoid errors)
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS customers;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS customer_addresses;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS customer_contacts;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS customer_tax_invoices;
-- Now add them back
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
    AND tablename LIKE 'customer%';
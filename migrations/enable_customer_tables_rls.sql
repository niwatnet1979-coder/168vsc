-- Enable RLS and create policies for customer related tables
-- Enable RLS on customer_addresses
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
-- Create policy to allow all operations on customer_addresses
CREATE POLICY "Enable all access for customer_addresses" ON customer_addresses FOR ALL USING (true) WITH CHECK (true);
-- Enable RLS on customer_contacts
ALTER TABLE customer_contacts ENABLE ROW LEVEL SECURITY;
-- Create policy to allow all operations on customer_contacts
CREATE POLICY "Enable all access for customer_contacts" ON customer_contacts FOR ALL USING (true) WITH CHECK (true);
-- Enable RLS on customer_tax_invoices (if not already enabled)
ALTER TABLE customer_tax_invoices ENABLE ROW LEVEL SECURITY;
-- Create policy to allow all operations on customer_tax_invoices
CREATE POLICY "Enable all access for customer_tax_invoices" ON customer_tax_invoices FOR ALL USING (true) WITH CHECK (true);
-- Refresh schema cache
NOTIFY pgrst,
'reload schema';
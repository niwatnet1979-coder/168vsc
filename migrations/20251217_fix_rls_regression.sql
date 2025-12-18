-- Fix RLS Permissions: Allow Public Access (Authenticated + Anon)
-- Run this in Supabase SQL Editor to resolve "Access Denied" or "Save Failed" errors.
-- 1. Customers
DROP POLICY IF EXISTS "Enable access to all users" ON customers;
CREATE POLICY "Enable access to all users" ON customers FOR ALL TO public USING (true) WITH CHECK (true);
-- 2. Customer Contacts
DROP POLICY IF EXISTS "Enable access to all users" ON customer_contacts;
CREATE POLICY "Enable access to all users" ON customer_contacts FOR ALL TO public USING (true) WITH CHECK (true);
-- 3. Customer Addresses
DROP POLICY IF EXISTS "Enable access to all users" ON customer_addresses;
CREATE POLICY "Enable access to all users" ON customer_addresses FOR ALL TO public USING (true) WITH CHECK (true);
-- 4. Customer Tax Invoices
DROP POLICY IF EXISTS "Enable access to all users" ON customer_tax_invoices;
CREATE POLICY "Enable access to all users" ON customer_tax_invoices FOR ALL TO public USING (true) WITH CHECK (true);
-- 5. Inventory Transactions
DROP POLICY IF EXISTS "Enable access to all users" ON inventory_transactions;
CREATE POLICY "Enable access to all users" ON inventory_transactions FOR ALL TO public USING (true) WITH CHECK (true);
-- 6. Jobs
DROP POLICY IF EXISTS "Enable access to all users" ON jobs;
CREATE POLICY "Enable access to all users" ON jobs FOR ALL TO public USING (true) WITH CHECK (true);
-- 7. Order Items
DROP POLICY IF EXISTS "Enable access to all users" ON order_items;
CREATE POLICY "Enable access to all users" ON order_items FOR ALL TO public USING (true) WITH CHECK (true);
-- 8. Product Variants
DROP POLICY IF EXISTS "Enable access to all users" ON product_variants;
CREATE POLICY "Enable access to all users" ON product_variants FOR ALL TO public USING (true) WITH CHECK (true);
-- 9. Products (Added for fix)
DROP POLICY IF EXISTS "Enable access to all users" ON products;
CREATE POLICY "Enable access to all users" ON products FOR ALL TO public USING (true) WITH CHECK (true);
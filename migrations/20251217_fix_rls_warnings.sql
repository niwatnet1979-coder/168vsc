-- Fix 8 Red Warnings (RLS Disabled)
-- Description: Enable Row Level Security (RLS) on tables and add policies
-- Date: 2025-12-17
-- 1. customer_addresses
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated users" ON customer_addresses FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- 2. customer_contacts
ALTER TABLE customer_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated users" ON customer_contacts FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- 3. customer_tax_invoices
ALTER TABLE customer_tax_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated users" ON customer_tax_invoices FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- 4. customers
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated users" ON customers FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- 5. inventory_transactions
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated users" ON inventory_transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- 6. jobs
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated users" ON jobs FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- 7. order_items
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated users" ON order_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- 8. product_variants
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated users" ON product_variants FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- Verify
DO $$
DECLARE table_list text [] := ARRAY [
        'customer_addresses', 'customer_contacts', 'customer_tax_invoices', 'customers',
        'inventory_transactions', 'jobs', 'order_items', 'product_variants'
    ];
t text;
BEGIN FOREACH t IN ARRAY table_list LOOP IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
        AND c.relname = t
        AND c.relrowsecurity = true
) THEN RAISE WARNING 'RLS is NOT enabled for table %',
t;
ELSE RAISE NOTICE 'RLS enabled for table %',
t;
END IF;
END LOOP;
END $$;
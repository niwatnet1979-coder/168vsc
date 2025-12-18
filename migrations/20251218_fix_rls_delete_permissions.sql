-- Allow anon access for order_items and jobs to ensure delete works in dev mode
-- (Matching order_payments permissions)
-- 1. order_items
DROP POLICY IF EXISTS "Enable all for authenticated users" ON order_items;
CREATE POLICY "Enable all for authenticated users and anon" ON order_items FOR ALL USING (
    auth.role() = 'authenticated'
    OR auth.role() = 'anon'
) WITH CHECK (
    auth.role() = 'authenticated'
    OR auth.role() = 'anon'
);
-- 2. jobs
DROP POLICY IF EXISTS "Enable all for authenticated users" ON jobs;
CREATE POLICY "Enable all for authenticated users and anon" ON jobs FOR ALL USING (
    auth.role() = 'authenticated'
    OR auth.role() = 'anon'
) WITH CHECK (
    auth.role() = 'authenticated'
    OR auth.role() = 'anon'
);
-- 3. inventory_transactions
DROP POLICY IF EXISTS "Enable all for authenticated users" ON inventory_transactions;
CREATE POLICY "Enable all for authenticated users and anon" ON inventory_transactions FOR ALL USING (
    auth.role() = 'authenticated'
    OR auth.role() = 'anon'
) WITH CHECK (
    auth.role() = 'authenticated'
    OR auth.role() = 'anon'
);
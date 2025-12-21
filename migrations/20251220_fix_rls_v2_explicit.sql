-- Fix RLS V2: Explicitly split policies for INSERT, UPDATE, DELETE
-- This resolves issues where 'FOR ALL' policies might not correctly apply 'WITH CHECK' for INSERTs.
-- 1. TEAMS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow write access to authenticated users" ON teams;
DROP POLICY IF EXISTS "allow_insert_authenticated" ON teams;
DROP POLICY IF EXISTS "allow_update_authenticated" ON teams;
DROP POLICY IF EXISTS "allow_delete_authenticated" ON teams;
CREATE POLICY "allow_insert_authenticated" ON teams FOR
INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "allow_update_authenticated" ON teams FOR
UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "allow_delete_authenticated" ON teams FOR DELETE USING (auth.role() = 'authenticated');
-- 2. TEAM SERVICE FEES
DROP POLICY IF EXISTS "Allow write access to authenticated users" ON team_service_fees;
CREATE POLICY "allow_insert_authenticated" ON team_service_fees FOR
INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "allow_update_authenticated" ON team_service_fees FOR
UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "allow_delete_authenticated" ON team_service_fees FOR DELETE USING (auth.role() = 'authenticated');
-- 3. ADJUSTMENTS
DROP POLICY IF EXISTS "Allow write access to authenticated users" ON team_service_fee_adjustments;
CREATE POLICY "allow_insert_authenticated" ON team_service_fee_adjustments FOR
INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "allow_update_authenticated" ON team_service_fee_adjustments FOR
UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "allow_delete_authenticated" ON team_service_fee_adjustments FOR DELETE USING (auth.role() = 'authenticated');
-- 4. JOB LINKS
DROP POLICY IF EXISTS "Allow write access to authenticated users" ON team_service_fee_jobs;
CREATE POLICY "allow_insert_authenticated" ON team_service_fee_jobs FOR
INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "allow_update_authenticated" ON team_service_fee_jobs FOR
UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "allow_delete_authenticated" ON team_service_fee_jobs FOR DELETE USING (auth.role() = 'authenticated');
-- 5. PAYMENTS
DROP POLICY IF EXISTS "Allow write access to authenticated users" ON team_service_fee_payments;
CREATE POLICY "allow_insert_authenticated" ON team_service_fee_payments FOR
INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "allow_update_authenticated" ON team_service_fee_payments FOR
UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "allow_delete_authenticated" ON team_service_fee_payments FOR DELETE USING (auth.role() = 'authenticated');
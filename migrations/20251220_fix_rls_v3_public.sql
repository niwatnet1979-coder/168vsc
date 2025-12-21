-- Fix RLS V3 (FINAL - COMPREHENSIVE): Allow Public/Anon Access
-- Drops ALL legacy policy names to prevent "already exists" errors.
-- Allows 'anon' role to Insert/Update/Delete because client uses Anon Key without session.
-- 1. TEAMS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
-- Drop V1 Policies
DROP POLICY IF EXISTS "Allow write access to authenticated users" ON teams;
DROP POLICY IF EXISTS "Allow read access to all users" ON teams;
-- Drop V2 Policies
DROP POLICY IF EXISTS "allow_insert_authenticated" ON teams;
DROP POLICY IF EXISTS "allow_update_authenticated" ON teams;
DROP POLICY IF EXISTS "allow_delete_authenticated" ON teams;
-- Create V3 Policy (Allow All)
CREATE POLICY "allow_base_access" ON teams FOR ALL USING (true) WITH CHECK (true);
-- 2. TEAM SERVICE FEES
ALTER TABLE team_service_fees ENABLE ROW LEVEL SECURITY;
-- Drop V1 Policies
DROP POLICY IF EXISTS "Allow write access to authenticated users" ON team_service_fees;
DROP POLICY IF EXISTS "Allow read access to all users" ON team_service_fees;
-- Drop V2 Policies
DROP POLICY IF EXISTS "allow_insert_authenticated" ON team_service_fees;
DROP POLICY IF EXISTS "allow_update_authenticated" ON team_service_fees;
DROP POLICY IF EXISTS "allow_delete_authenticated" ON team_service_fees;
-- Create V3 Policy
CREATE POLICY "allow_base_access" ON team_service_fees FOR ALL USING (true) WITH CHECK (true);
-- 3. ADJUSTMENTS
ALTER TABLE team_service_fee_adjustments ENABLE ROW LEVEL SECURITY;
-- Drop V1 Policies
DROP POLICY IF EXISTS "Allow write access to authenticated users" ON team_service_fee_adjustments;
DROP POLICY IF EXISTS "Allow read access to all users" ON team_service_fee_adjustments;
-- Drop V2 Policies
DROP POLICY IF EXISTS "allow_insert_authenticated" ON team_service_fee_adjustments;
DROP POLICY IF EXISTS "allow_update_authenticated" ON team_service_fee_adjustments;
DROP POLICY IF EXISTS "allow_delete_authenticated" ON team_service_fee_adjustments;
-- Create V3 Policy
CREATE POLICY "allow_base_access" ON team_service_fee_adjustments FOR ALL USING (true) WITH CHECK (true);
-- 4. JOB LINKS
ALTER TABLE team_service_fee_jobs ENABLE ROW LEVEL SECURITY;
-- Drop V1 Policies
DROP POLICY IF EXISTS "Allow write access to authenticated users" ON team_service_fee_jobs;
DROP POLICY IF EXISTS "Allow read access to all users" ON team_service_fee_jobs;
-- Drop V2 Policies
DROP POLICY IF EXISTS "allow_insert_authenticated" ON team_service_fee_jobs;
DROP POLICY IF EXISTS "allow_update_authenticated" ON team_service_fee_jobs;
DROP POLICY IF EXISTS "allow_delete_authenticated" ON team_service_fee_jobs;
-- Create V3 Policy
CREATE POLICY "allow_base_access" ON team_service_fee_jobs FOR ALL USING (true) WITH CHECK (true);
-- 5. PAYMENTS
ALTER TABLE team_service_fee_payments ENABLE ROW LEVEL SECURITY;
-- Drop V1 Policies
DROP POLICY IF EXISTS "Allow write access to authenticated users" ON team_service_fee_payments;
DROP POLICY IF EXISTS "Allow read access to all users" ON team_service_fee_payments;
-- Drop V2 Policies
DROP POLICY IF EXISTS "allow_insert_authenticated" ON team_service_fee_payments;
DROP POLICY IF EXISTS "allow_update_authenticated" ON team_service_fee_payments;
DROP POLICY IF EXISTS "allow_delete_authenticated" ON team_service_fee_payments;
-- Create V3 Policy
CREATE POLICY "allow_base_access" ON team_service_fee_payments FOR ALL USING (true) WITH CHECK (true);
-- Final Grant (Redundant but safe)
GRANT ALL ON teams TO anon;
GRANT ALL ON team_service_fees TO anon;
GRANT ALL ON team_service_fee_adjustments TO anon;
GRANT ALL ON team_service_fee_jobs TO anon;
GRANT ALL ON team_service_fee_payments TO anon;
-- Fix RLS Policies for Team Service Fees System
-- Description: Adds 'WITH CHECK' clause to write policies to properly allow INSERTs.
-- 1. Teams
DROP POLICY IF EXISTS "Allow write access to authenticated users" ON teams;
CREATE POLICY "Allow write access to authenticated users" ON teams FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
-- 2. Service Fees
DROP POLICY IF EXISTS "Allow write access to authenticated users" ON team_service_fees;
CREATE POLICY "Allow write access to authenticated users" ON team_service_fees FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
-- 3. Adjustments
DROP POLICY IF EXISTS "Allow write access to authenticated users" ON team_service_fee_adjustments;
CREATE POLICY "Allow write access to authenticated users" ON team_service_fee_adjustments FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
-- 4. Jobs Link
DROP POLICY IF EXISTS "Allow write access to authenticated users" ON team_service_fee_jobs;
CREATE POLICY "Allow write access to authenticated users" ON team_service_fee_jobs FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
-- 5. Payments
DROP POLICY IF EXISTS "Allow write access to authenticated users" ON team_service_fee_payments;
CREATE POLICY "Allow write access to authenticated users" ON team_service_fee_payments FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
-- Migration: Create Team Service Fee System Tables
-- Created: 2025-12-20
-- Description: Adds tables for Team Management and Service Fee Batches (Periodic Payments)
-- 1. Create 'teams' table
-- Check if table exists, if so, we might need to migrate data or just add columns. 
-- Assuming it doesn't exist as per research.
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    payment_qr_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Enable RLS for teams
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access to all users" ON teams FOR
SELECT USING (true);
CREATE POLICY "Allow write access to authenticated users" ON teams FOR ALL USING (auth.role() = 'authenticated');
-- 2. Create 'team_service_fees' (The Batch)
CREATE TABLE IF NOT EXISTS team_service_fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE
    SET NULL,
        labor_cost NUMERIC DEFAULT 0,
        material_cost NUMERIC DEFAULT 0,
        travel_cost NUMERIC DEFAULT 0,
        deduct_percent NUMERIC DEFAULT 3,
        -- 3% default
        status TEXT DEFAULT 'active',
        -- active, closed
        note TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Enable RLS
ALTER TABLE team_service_fees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access to all users" ON team_service_fees FOR
SELECT USING (true);
CREATE POLICY "Allow write access to authenticated users" ON team_service_fees FOR ALL USING (auth.role() = 'authenticated');
-- 3. Create 'team_service_fee_adjustments' (Add/Deduct items)
CREATE TABLE IF NOT EXISTS team_service_fee_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_fee_id UUID REFERENCES team_service_fees(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    -- Can be negative for deductions
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Enable RLS
ALTER TABLE team_service_fee_adjustments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access to all users" ON team_service_fee_adjustments FOR
SELECT USING (true);
CREATE POLICY "Allow write access to authenticated users" ON team_service_fee_adjustments FOR ALL USING (auth.role() = 'authenticated');
-- 4. Create 'team_service_fee_jobs' (Link Jobs to Batch)
CREATE TABLE IF NOT EXISTS team_service_fee_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_fee_id UUID REFERENCES team_service_fees(id) ON DELETE CASCADE,
    job_id UUID,
    -- REFERENCES jobs(id) -- Assuming jobs table exists and uses UUID. Weak link if needed or strict FK.
    -- Strict FK is better for integrity
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(service_fee_id, job_id) -- Prevent duplicate links
);
-- Add strict FK if jobs table exists (it should)
DO $$ BEGIN IF EXISTS (
    SELECT
    FROM pg_tables
    WHERE schemaname = 'public'
        AND tablename = 'jobs'
) THEN
ALTER TABLE team_service_fee_jobs
ADD CONSTRAINT fk_jobs FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE;
END IF;
END $$;
-- Enable RLS
ALTER TABLE team_service_fee_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access to all users" ON team_service_fee_jobs FOR
SELECT USING (true);
CREATE POLICY "Allow write access to authenticated users" ON team_service_fee_jobs FOR ALL USING (auth.role() = 'authenticated');
-- 5. Create 'team_service_fee_payments' (Installments)
CREATE TABLE IF NOT EXISTS team_service_fee_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_fee_id UUID REFERENCES team_service_fees(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    payment_method TEXT,
    slip_url TEXT,
    note TEXT,
    paid_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Enable RLS
ALTER TABLE team_service_fee_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access to all users" ON team_service_fee_payments FOR
SELECT USING (true);
CREATE POLICY "Allow write access to authenticated users" ON team_service_fee_payments FOR ALL USING (auth.role() = 'authenticated');
-- 6. Helper View for Team Outstanding (Optional but helpful)
-- View might be complex due to grouping. We'll handle calculation in code for now to avoid dependency issues.
-- 7. Grant permissions (Adjust based on your role setup)
GRANT ALL ON teams TO authenticated;
GRANT ALL ON team_service_fees TO authenticated;
GRANT ALL ON team_service_fee_adjustments TO authenticated;
GRANT ALL ON team_service_fee_jobs TO authenticated;
GRANT ALL ON team_service_fee_payments TO authenticated;
GRANT ALL ON teams TO service_role;
GRANT ALL ON team_service_fees TO service_role;
GRANT ALL ON team_service_fee_adjustments TO service_role;
GRANT ALL ON team_service_fee_jobs TO service_role;
GRANT ALL ON team_service_fee_payments TO service_role;
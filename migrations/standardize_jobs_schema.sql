-- Migration: Standardize Jobs Schema
-- Version: 5.2.0
-- Description: Consolidate date fields and add performance indexes
BEGIN;
-- 1. Ensure appointment_date has all dates (prefer appointment_date, fallback to job_date, then order_date)
UPDATE jobs
SET appointment_date = COALESCE(appointment_date, job_date, order_date)
WHERE appointment_date IS NULL;
-- 2. Drop redundant job_date column
ALTER TABLE jobs DROP COLUMN IF EXISTS job_date;
-- 3. Add completion tracking
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;
-- 4. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_jobs_appointment_date ON jobs(appointment_date);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_assigned_team ON jobs(assigned_team);
CREATE INDEX IF NOT EXISTS idx_jobs_status_date ON jobs(status, appointment_date);
COMMIT;
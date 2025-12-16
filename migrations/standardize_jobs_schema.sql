-- Migration: Standardize Jobs Schema
-- Version: 5.2.0
-- Description: Rename job_date to appointment_date for clarity and add performance indexes
BEGIN;
-- 1. Rename job_date to appointment_date for clarity
ALTER TABLE jobs
    RENAME COLUMN job_date TO appointment_date;
-- 2. Add completion tracking
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;
-- 3. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_jobs_appointment_date ON jobs(appointment_date);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_assigned_team ON jobs(assigned_team);
CREATE INDEX IF NOT EXISTS idx_jobs_status_date ON jobs(status, appointment_date);
COMMIT;
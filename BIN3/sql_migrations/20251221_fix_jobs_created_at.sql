-- Migration: Fix jobs.created_at defaults
-- Description: Ensure created_at has a default value of now() and backfill existing NULLs.
-- 1. Set Default Value
ALTER TABLE jobs
ALTER COLUMN created_at
SET DEFAULT now();
-- 2. Backfill NULLs (Critical for strict sorting)
UPDATE jobs
SET created_at = now()
WHERE created_at IS NULL;
-- 3. Optional: Enforce Not Null (Safety)
ALTER TABLE jobs
ALTER COLUMN created_at
SET NOT NULL;
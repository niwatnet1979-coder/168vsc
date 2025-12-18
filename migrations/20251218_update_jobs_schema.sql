-- Migration: Update Jobs Schema for Rich Data
-- Version: 5.6.6
-- Description: Add inspector and install_location_name columns to jobs table to match rich data from orders and sub-jobs.
BEGIN;
-- 1. Add inspector (TEXT) for legacy/quick name display
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS inspector TEXT;
-- 2. Add inspector1 (JSONB) for rich contact details (name, phone, email, etc.)
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS inspector1 JSONB DEFAULT '{}'::jsonb;
-- 3. Add install_location_name (TEXT)
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS install_location_name TEXT;
-- 4. Add comments for clarity
COMMENT ON COLUMN jobs.inspector IS 'Legacy/Simple name of the inspector';
COMMENT ON COLUMN jobs.inspector1 IS 'Rich JSON object containing full inspector/contact details';
COMMENT ON COLUMN jobs.install_location_name IS 'Friendly name of the installation site (e.g., Home, Office)';
COMMIT;
-- Migration: Standardize Schema Naming
-- Description: Renaming columns to match Frontend CamelCase conventions (snake_case in DB)
-- Author: Antigravity
-- 1. Jobs Table
ALTER TABLE jobs
    RENAME COLUMN assigned_team TO team;
ALTER TABLE jobs
    RENAME COLUMN job_notes TO notes;
ALTER TABLE jobs
    RENAME COLUMN team_payment_batch_id TO team_payment_id;
ALTER TABLE jobs
    RENAME COLUMN site_address_id TO location_id;
ALTER TABLE jobs
    RENAME COLUMN site_inspector_id TO inspector_id;
-- 2. Customer Contacts Table
ALTER TABLE customer_contacts
    RENAME COLUMN line TO line_id;
-- 3. Cleanup Unused Columns (Optional - verify before running)
-- ALTER TABLE jobs DROP COLUMN IF EXISTS site_address_content;
-- ALTER TABLE jobs DROP COLUMN IF EXISTS site_google_map_link;
-- ALTER TABLE jobs DROP COLUMN IF EXISTS site_distance;
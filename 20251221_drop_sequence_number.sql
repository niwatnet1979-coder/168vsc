-- Migration: Drop sequence_number from jobs table
-- Description: Removing legacy sequencing column as per user request to rely on Created At / UUIDs only.
ALTER TABLE jobs DROP COLUMN IF EXISTS sequence_number;
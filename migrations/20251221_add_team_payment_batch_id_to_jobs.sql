-- Migration: Add team_payment_batch_id to jobs
-- Created: 2025-12-21
-- Description: Adds a direct foreign key from jobs to team_service_fees to simplify 1:N relationship.
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'jobs'
        AND column_name = 'team_payment_batch_id'
) THEN
ALTER TABLE jobs
ADD COLUMN team_payment_batch_id UUID REFERENCES team_service_fees(id) ON DELETE
SET NULL;
END IF;
END $$;
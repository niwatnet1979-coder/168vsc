-- Migration: Add metadata columns to order_items
-- Reason: To store variation snapshot (color, size, etc.) and sub-job details (inspector, installation info) which are sent by the UI.
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS variation_data JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS sub_job_data JSONB DEFAULT '{}'::jsonb;
COMMENT ON COLUMN order_items.variation_data IS 'Snapshot of variant details (color, dimension, etc.) at time of purchase';
COMMENT ON COLUMN order_items.sub_job_data IS 'Details about specific job/installation for this item';
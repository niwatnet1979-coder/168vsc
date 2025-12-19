-- Drop redundant table jobs
-- All job data is now managed within the 'order_items' table (Phase 15 Refactor)
DROP TABLE IF EXISTS jobs;
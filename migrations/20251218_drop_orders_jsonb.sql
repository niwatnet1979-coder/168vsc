-- Phase 12: Cleanup Redundant JSONB Columns
-- These columns have been normalized into relational columns:
-- discount -> discount_mode, discount_value
-- job_info -> jobs table, and relational columns on orders
-- 1. Drop 'discount' column
ALTER TABLE orders DROP COLUMN IF EXISTS discount;
-- 2. Drop 'job_info' column
ALTER TABLE orders DROP COLUMN IF EXISTS job_info;
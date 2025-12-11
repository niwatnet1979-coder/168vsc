-- Database Cleanup Script
-- Remove unused columns from jobs and orders tables
-- ============================================
-- 1. Clean up jobs table
-- ============================================
-- These columns are not being used in the application:
-- - signature_image_url: Signatures are stored in orders.payment_schedule instead
-- - installation_photos: Not implemented in current system
-- - payment_slip_url: Payment slips are stored in orders.payment_schedule instead
ALTER TABLE jobs DROP COLUMN IF EXISTS signature_image_url,
    DROP COLUMN IF EXISTS installation_photos,
    DROP COLUMN IF EXISTS payment_slip_url;
-- ============================================
-- 2. Clean up orders table
-- ============================================
-- These columns are not being used:
-- - total_amount: Always 0, total is calculated from items
-- - deposit: Redundant, first payment in payment_schedule serves as deposit
ALTER TABLE orders DROP COLUMN IF EXISTS total_amount,
    DROP COLUMN IF EXISTS deposit;
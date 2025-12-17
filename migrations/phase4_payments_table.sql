-- Phase 4: Payments Table
-- Migration: Extract payment_schedule from JSONB to relational table
-- Date: 2025-12-17
-- Author: Database Refactoring - Phase 4
-- ============================================================================
-- Step 1: Create payments table
-- ============================================================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    payment_date DATE NOT NULL,
    paid_by TEXT,
    amount NUMERIC NOT NULL DEFAULT 0,
    receiver_signature TEXT,
    payer_signature TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
COMMENT ON TABLE payments IS 'Order payments - extracted from orders.payment_schedule JSONB';
COMMENT ON COLUMN payments.order_id IS 'Foreign key to orders table';
COMMENT ON COLUMN payments.payment_date IS 'Date of payment';
COMMENT ON COLUMN payments.paid_by IS 'Payment method (e.g., โอนเงิน, เงินสด)';
COMMENT ON COLUMN payments.amount IS 'Payment amount';
COMMENT ON COLUMN payments.receiver_signature IS 'URL to receiver signature image';
COMMENT ON COLUMN payments.payer_signature IS 'URL to payer signature image';
-- ============================================================================
-- Step 2: Migrate payments from JSONB to table
-- ============================================================================
INSERT INTO payments (
        order_id,
        payment_date,
        paid_by,
        amount,
        receiver_signature,
        payer_signature
    )
SELECT o.id,
    (payment->>'paymentDate')::DATE,
    payment->>'paidBy',
    (payment->>'amount')::NUMERIC,
    payment->>'receiverSignature',
    payment->>'payerSignature'
FROM orders o,
    LATERAL jsonb_array_elements(o.payment_schedule) AS payment
WHERE o.payment_schedule IS NOT NULL
    AND jsonb_array_length(o.payment_schedule) > 0 ON CONFLICT DO NOTHING;
-- ============================================================================
-- Step 3: Verify migration
-- ============================================================================
DO $$
DECLARE total_orders INTEGER;
total_payments INTEGER;
orders_with_payments INTEGER;
BEGIN
SELECT COUNT(*) INTO total_orders
FROM orders;
SELECT COUNT(*) INTO total_payments
FROM payments;
SELECT COUNT(DISTINCT order_id) INTO orders_with_payments
FROM payments;
RAISE NOTICE '========================================';
RAISE NOTICE 'Phase 4 Migration Summary';
RAISE NOTICE '========================================';
RAISE NOTICE 'Total orders: %',
total_orders;
RAISE NOTICE 'Total payments: %',
total_payments;
RAISE NOTICE 'Orders with payments: %',
orders_with_payments;
RAISE NOTICE '========================================';
IF total_payments > 0 THEN RAISE NOTICE 'Migration completed successfully!';
ELSE RAISE WARNING 'No payments migrated - orders may not have payment_schedule';
END IF;
END $$;
-- ============================================================================
-- Step 4: (FUTURE) Remove JSONB column after verification
-- ============================================================================
-- Run manually after Phase 4 is fully tested and verified:
-- ALTER TABLE orders DROP COLUMN IF EXISTS payment_schedule;
-- ============================================================================
-- Rollback Instructions (if needed)
-- ============================================================================
-- To rollback this migration:
-- 1. DROP TABLE: DROP TABLE IF EXISTS payments CASCADE;
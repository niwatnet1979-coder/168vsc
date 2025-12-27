-- Add all missing columns for Purchase Order Redesign (Consolidated)
ALTER TABLE purchase_orders
ADD COLUMN IF NOT EXISTS reimbursed_slip_url text,
    -- สลิปคืนเงิน (กรณีสำรองจ่าย)
ADD COLUMN IF NOT EXISTS payment_slip_url text,
    -- สลิปจ่ายเงิน Supplier (ใหม่!)
ADD COLUMN IF NOT EXISTS payer_name text,
    ADD COLUMN IF NOT EXISTS is_reimbursed boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS reimbursed_date timestamp with time zone,
    ADD COLUMN IF NOT EXISTS shipping_origin numeric DEFAULT 0,
    ADD COLUMN IF NOT EXISTS external_ref_no text,
    ADD COLUMN IF NOT EXISTS purchase_link text,
    ADD COLUMN IF NOT EXISTS remarks text,
    ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'unpaid',
    ADD COLUMN IF NOT EXISTS payment_method text,
    ADD COLUMN IF NOT EXISTS payment_date timestamp with time zone,
    -- วันที่ชำระเงิน (มีแล้ว)
ADD COLUMN IF NOT EXISTS currency text DEFAULT 'CNY',
    ADD COLUMN IF NOT EXISTS exchange_rate numeric DEFAULT 5.0;
-- Add missing columns to purchase_order_items
ALTER TABLE purchase_order_items
ADD COLUMN IF NOT EXISTS remark text;
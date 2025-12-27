-- Migration: Fix Purchasing Tables
-- 1. Check/Add columns to purchase_orders
ALTER TABLE purchase_orders
ADD COLUMN IF NOT EXISTS currency text DEFAULT 'CNY';
ALTER TABLE purchase_orders
ADD COLUMN IF NOT EXISTS exchange_rate numeric DEFAULT 5.0;
ALTER TABLE purchase_orders
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'unpaid';
-- unpaid, partial, paid
ALTER TABLE purchase_orders
ADD COLUMN IF NOT EXISTS payment_date timestamp with time zone;
ALTER TABLE purchase_orders
ADD COLUMN IF NOT EXISTS payment_method text;
-- alipay, bank, cash
ALTER TABLE purchase_orders
ADD COLUMN IF NOT EXISTS external_ref_no text;
ALTER TABLE purchase_orders
ADD COLUMN IF NOT EXISTS purchase_link text;
ALTER TABLE purchase_orders
ADD COLUMN IF NOT EXISTS remarks text;
ALTER TABLE purchase_orders
ADD COLUMN IF NOT EXISTS created_by text;
ALTER TABLE purchase_orders
ADD COLUMN IF NOT EXISTS payer_name text;
ALTER TABLE purchase_orders
ADD COLUMN IF NOT EXISTS is_reimbursed boolean DEFAULT false;
-- 2. Create purchase_order_items if not exists
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    purchase_order_id uuid REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id uuid NOT NULL,
    -- references products(uuid) -- relaxed constraint if needed
    variant_id uuid,
    -- references product_variants(id)
    product_name text,
    product_code text,
    quantity integer DEFAULT 1,
    unit_price numeric DEFAULT 0,
    -- price in THB (calculated)
    unit_price_foreign numeric DEFAULT 0,
    -- price in CNY/USD
    total_price numeric DEFAULT 0,
    -- total in THB
    created_at timestamp with time zone DEFAULT now(),
    -- New fields for variants
    variant_sku text,
    variant_details text
);
ALTER TABLE purchase_orders
ADD COLUMN IF NOT EXISTS shipping_origin numeric DEFAULT 0;
-- 3. Add RLS Policies (Simple public access for now as per system style)
-- Drop existing policies first to prevent errors on re-run
DROP POLICY IF EXISTS "Enable all access for all users" ON purchase_orders;
DROP POLICY IF EXISTS "Enable all access for all users" ON purchase_order_items;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for all users" ON purchase_orders FOR ALL USING (true) WITH CHECK (true);
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for all users" ON purchase_order_items FOR ALL USING (true) WITH CHECK (true);
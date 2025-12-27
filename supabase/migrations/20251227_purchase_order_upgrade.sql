-- Upgrade purchase_orders table
ALTER TABLE purchase_orders
ADD COLUMN IF NOT EXISTS currency text DEFAULT 'CNY',
    ADD COLUMN IF NOT EXISTS exchange_rate numeric DEFAULT 5.0,
    ADD COLUMN IF NOT EXISTS shipping_origin numeric DEFAULT 0,
    ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'unpaid',
    ADD COLUMN IF NOT EXISTS payment_date timestamp WITH time zone,
    ADD COLUMN IF NOT EXISTS payment_method text,
    ADD COLUMN IF NOT EXISTS payer_name text,
    ADD COLUMN IF NOT EXISTS is_reimbursed boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS reimbursed_date timestamp WITH time zone,
    ADD COLUMN IF NOT EXISTS external_ref_no text,
    ADD COLUMN IF NOT EXISTS purchase_link text,
    ADD COLUMN IF NOT EXISTS remarks text,
    ADD COLUMN IF NOT EXISTS created_by text;
-- Upgrade purchase_order_items table
ALTER TABLE purchase_order_items
ADD COLUMN IF NOT EXISTS variant_id uuid REFERENCES product_variants(id),
    ADD COLUMN IF NOT EXISTS unit_price_foreign numeric DEFAULT 0;
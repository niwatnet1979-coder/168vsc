-- Add paid_amount for accurate partial payment tracking
ALTER TABLE purchase_orders
ADD COLUMN IF NOT EXISTS paid_amount numeric DEFAULT 0;
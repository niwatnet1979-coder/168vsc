-- Add reimbursed_slip_url column to purchase_orders
ALTER TABLE purchase_orders
ADD COLUMN IF NOT EXISTS reimbursed_slip_url text;
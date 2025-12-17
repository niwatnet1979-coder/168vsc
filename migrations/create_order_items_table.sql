-- Create order_items table to store order line items
-- This replaces the JSONB items column in the orders table
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(uuid) ON DELETE
    SET NULL,
        -- Basic item info
        name TEXT,
        code TEXT,
        qty INTEGER NOT NULL DEFAULT 1,
        unit_price NUMERIC NOT NULL DEFAULT 0,
        total NUMERIC NOT NULL DEFAULT 0,
        discount NUMERIC DEFAULT 0,
        -- Rich variation data stored as JSONB
        variation_data JSONB DEFAULT '{}'::jsonb,
        -- Sub-job data stored as JSONB
        sub_job_data JSONB DEFAULT '{}'::jsonb,
        -- Timestamps
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Create index on order_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
-- Create index on product_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
-- Add comment
COMMENT ON TABLE order_items IS 'Stores individual line items for each order, replacing the JSONB items column in orders table';
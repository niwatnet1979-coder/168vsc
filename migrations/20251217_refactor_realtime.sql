-- Migration: Refactor to Normalized Realtime Schema
-- Description: Breaks down JSON columns into relational tables and adds Realtime support.
-- FIXED: Using 'text' for order_id to match existing orders.id column.
-- FIXED: Using 'total' and 'order_date' to match existing orders columns.
-- 1. Product Variants Table (Normalizing products.variants)
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Supabase default
    product_id UUID REFERENCES products(uuid) ON DELETE CASCADE,
    color VARCHAR(100),
    size VARCHAR(50),
    sku VARCHAR(100),
    price DECIMAL(10, 2),
    stock INT DEFAULT 0,
    min_stock INT DEFAULT 0,
    barcode VARCHAR(100),
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_variant_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variant_sku ON product_variants(sku);
-- 2. Order Items Table (Normalizing orders.items)
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
    -- FIXED: TEXT type to match orders.id
    product_variant_id UUID REFERENCES product_variants(id),
    product_id UUID REFERENCES products(uuid),
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    status VARCHAR(50) DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_variant ON order_items(product_variant_id);
-- 3. Inventory Transactions (Immutable History)
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_item_id UUID REFERENCES inventory_items(id),
    product_variant_id UUID REFERENCES product_variants(id),
    quantity_change INT NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    reference_id VARCHAR(100),
    note TEXT,
    created_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_inv_trans_variant ON inventory_transactions(product_variant_id);
CREATE INDEX IF NOT EXISTS idx_inv_trans_date ON inventory_transactions(created_at);
-- 4. View: Live Stock Calculation
CREATE OR REPLACE VIEW view_product_stock_live AS
SELECT v.id AS variant_id,
    v.product_id,
    v.stock AS physical_stock,
    COALESCE(
        (
            SELECT SUM(oi.quantity)
            FROM order_items oi
                JOIN orders o ON oi.order_id = o.id
            WHERE oi.product_variant_id = v.id
                AND o.status IN ('Pending', 'Processing', 'Confirmed')
        ),
        0
    ) AS allocated_stock,
    (
        v.stock - COALESCE(
            (
                SELECT SUM(oi.quantity)
                FROM order_items oi
                    JOIN orders o ON oi.order_id = o.id
                WHERE oi.product_variant_id = v.id
                    AND o.status IN ('Pending', 'Processing', 'Confirmed')
            ),
            0
        )
    ) AS available_stock
FROM product_variants v;
-- 5. RPC: Create Order Transactionally
CREATE OR REPLACE FUNCTION create_order_transaction(order_data JSONB, items_data JSONB) RETURNS JSONB AS $$
DECLARE new_order_id TEXT;
item_record JSONB;
p_variant_id UUID;
p_qty INT;
p_price DECIMAL;
BEGIN -- Handle ID generation if missing (using gen_random_uuid cast to text)
IF (order_data->>'id') IS NULL THEN order_data := jsonb_set(
    order_data,
    '{id}',
    to_jsonb(gen_random_uuid()::text)
);
END IF;
-- Insert Order Header
INSERT INTO orders (
        id,
        customer_id,
        order_date,
        status,
        total,
        -- deposit, -- Column not in schema
        shipping_fee,
        -- shipping_address, -- Not in schema (maybe in delivery_address_info jsonb?)
        note
    )
VALUES (
        order_data->>'id',
        order_data->>'customer_id',
        -- Text
        (order_data->>'order_date')::DATE,
        order_data->>'status',
        COALESCE((order_data->>'total')::DECIMAL, 0),
        COALESCE((order_data->>'shipping_fee')::DECIMAL, 0),
        order_data->>'note'
    )
RETURNING id INTO new_order_id;
-- Insert Items
FOR item_record IN
SELECT *
FROM jsonb_array_elements(items_data) LOOP p_variant_id := (item_record->>'variant_id')::UUID;
p_qty := (item_record->>'quantity')::INT;
p_price := (item_record->>'unit_price')::DECIMAL;
INSERT INTO order_items (
        order_id,
        product_variant_id,
        quantity,
        unit_price
    )
VALUES (new_order_id, p_variant_id, p_qty, p_price);
END LOOP;
RETURN jsonb_build_object('success', true, 'order_id', new_order_id);
EXCEPTION
WHEN OTHERS THEN RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;
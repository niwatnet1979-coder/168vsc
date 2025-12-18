-- Phase 15: Stock Migration & Cleanup
-- This script safely migrates stock from 'product_variants' to 'inventory_items'
-- and cleans up redundant columns from the 'products' table.
-- 1. CLEANUP 'products' TABLE (Confirmed redundant)
ALTER TABLE products DROP COLUMN IF EXISTS min_stock_level;
ALTER TABLE products DROP COLUMN IF EXISTS pack_size;
ALTER TABLE products DROP COLUMN IF EXISTS code;
-- 2. ENHANCE 'inventory_items' SCHEMA
-- Ensure it can track variants properly
ALTER TABLE inventory_items
ADD COLUMN IF NOT EXISTS product_variant_id UUID REFERENCES product_variants(id);
-- Add generic 'quantity' column if relying on 'box_count' is ambiguous or if 'box_count' implies something else.
-- However, user schema showed 'box_count'. Usually inventory has 'quantity' or 'on_hand'.
-- Check existing columns: [id, product_id, qr_code, lot_number, status, current_location, box_count]
-- If we treat 'box_count' as 'quantity', it's confusing. Let's ADD 'quantity' to be explicit and standard.
ALTER TABLE inventory_items
ADD COLUMN IF NOT EXISTS quantity INT DEFAULT 1;
-- 3. MIGRATE DATA (Stock -> Inventory)
-- Only run if inventory is empty
DO $$
DECLARE v_count INT;
BEGIN
SELECT COUNT(*) INTO v_count
FROM inventory_items;
IF v_count = 0 THEN -- Insert one inventory record per variant with positive stock
INSERT INTO inventory_items (
        product_id,
        product_variant_id,
        quantity,
        box_count,
        -- Default to 1 box containing N items? Or N boxes? Let's assume 1 entry = N quantity.
        status,
        current_location,
        qr_code,
        -- Generate a temporary QR code or use SKU/Barcode
        lot_number
    )
SELECT pv.product_id,
    pv.id,
    pv.stock,
    1,
    -- One logistical unit (record) representing the total stock pile for now
    'in_stock',
    'Warehouse_Main',
    COALESCE(pv.sku, 'INV-' || substring(pv.id::text, 1, 8)),
    'INITIAL_MIGRATION'
FROM product_variants pv
WHERE pv.stock > 0;
RAISE NOTICE 'Migrated stock for variants.';
ELSE RAISE NOTICE 'Inventory not empty. Skipping migration.';
END IF;
END $$;
-- 4. UPDATE LIVE STOCK VIEW
-- Drop first to avoid data type mismatch errors (integer vs bigint from SUM)
DROP VIEW IF EXISTS view_product_stock_live;
-- To use 'inventory_items' instead of 'product_variants.stock'
CREATE OR REPLACE VIEW view_product_stock_live AS
SELECT v.id AS variant_id,
    v.product_id,
    -- New Physical Stock: Sum of quantity in 'inventory_items' (excluding sold/lost if marked?)
    -- Assuming all 'in_stock' items count.
    COALESCE(
        (
            SELECT SUM(ii.quantity)
            FROM inventory_items ii
            WHERE ii.product_variant_id = v.id
                AND ii.status = 'in_stock'
        ),
        0
    ) AS physical_stock,
    -- Allocated Stock: Sum of Pending Orders (Using order_items status)
    COALESCE(
        (
            SELECT SUM(oi.quantity)
            FROM order_items oi -- Orders table join removed as status is now on items
            WHERE oi.product_variant_id = v.id
                AND oi.status IN ('Pending', 'Processing', 'Confirmed')
        ),
        0
    ) AS allocated_stock,
    -- Available Stock
    (
        COALESCE(
            (
                SELECT SUM(ii.quantity)
                FROM inventory_items ii
                WHERE ii.product_variant_id = v.id
                    AND ii.status = 'in_stock'
            ),
            0
        ) - COALESCE(
            (
                SELECT SUM(oi.quantity)
                FROM order_items oi
                WHERE oi.product_variant_id = v.id
                    AND oi.status IN ('Pending', 'Processing', 'Confirmed')
            ),
            0
        )
    ) AS available_stock
FROM product_variants v;
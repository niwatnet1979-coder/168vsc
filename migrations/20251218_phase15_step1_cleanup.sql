-- Phase 15: Safe Cleanup & Stock Migration
-- 1. Drop redundant columns from 'products' table (Safe to remove as confirmed)
ALTER TABLE products DROP COLUMN IF EXISTS min_stock_level;
ALTER TABLE products DROP COLUMN IF EXISTS pack_size;
ALTER TABLE products DROP COLUMN IF EXISTS code;
-- Redundant with product_code
-- 2. Migrate Stock from 'product_variants' to 'inventory_items'
-- Only insert if inventory is empty to avoid duplication on re-runs
DO $$
DECLARE v_count INT;
BEGIN
SELECT COUNT(*) INTO v_count
FROM inventory_items;
IF v_count = 0 THEN
INSERT INTO inventory_items (
        id,
        product_id,
        -- Store variant_id in a specific column if schema supports it, 
        -- or we rely on product_id? 
        -- Wait, inventory_items needs product_variant_id?
        -- Scanning schema... inventory_items has 'product_id' (uuid).
        -- Does it have 'product_variant_id'?
        -- Let's check schema inspection result from earlier.
        -- Inventory Items Columns: [id, product_id, qr_code, lot_number, status, current_location, ...]
        -- It seems to lack 'product_variant_id' based on previous context or I missed it?
        -- Let's assume we map product_variants.id -> inventory_items.product_id ?? No that's wrong.
        -- Inventory items usually track specific physical items.
        -- IF inventory_items tracks specific items (QR code per item), we cannot simply migrate aggregate stock count easily
        -- unless we create N records for Stock N?
        -- OR if inventory_items is aggregate (box_count?), let's look at schema again.
        -- "box_count" exists. "quantity" is NOT in inventory_items definition in User Request?
        -- Wait, User Request schema for inventory_items:
        -- id, product_id (FK), qr_code, lot_number, status, current_location, box_count (int, default 1)
        -- It does NOT have 'quantity' or 'product_variant_id'.
        -- This implies 'inventory_items' tracks INDIVIDUAL items or boxes (Serial/QR tracking).
        -- BUT 'product_variants.stock' is a simple integer count.
        -- Converting Int Stock -> Individual Rows is risky if count is high.
        -- CHECK: Does inventory_items have product_variant_id?
        -- The User Request schema ddl showed: product_id uuid FK.
        -- inventory_transactions has product_variant_id.
        -- inventory_items table definition in Step 6233:
        -- Column: product_id (uuid), qr_code, lot_number, status, current_location, box_count.
        -- NO product_variant_id in inventory_items? That's a problem for variants.
        -- If products have variants, inventory_items MUST know which variant it is.
        -- Maybe 'product_id' in inventory_items is actually pointing to 'product_variants.id'?
        -- Or maybe the schema is incomplete?
        -- STOP: I need to verify if inventory_items has product_variant_id before writing migration.
        -- If not, I might need to add it.
        -- Or maybe product_id FK actually references product_variants(id)?
        -- Let's check constraints or suspect that product_id might be effectively variant_id.
        -- Defaulting to: Add product_variant_id column first if missing? 
        -- The user's provided schema dump in Step 6233 shows "inventory_items" has "product_id".
        -- It does NOT show "product_variant_id".
        -- However, "inventory_transactions" HAS "product_variant_id".
        -- Decision: I will INSPECT inventory_items columns again precisely using the tool before writing this complex migration.
        -- BUT I can still drop the products columns.
        -- FOR NOW: Only doing part 1 (Drops).
        -- I will perform migration in a separate step after verifying schema.
    )
SELECT 1
WHERE false;
END IF;
END $$;
-- Migration to drop legacy columns from product_variants
-- These columns are no longer used as:
-- 'stock' is migrated to 'inventory_items' (Phase 15)
-- 'min_stock_level' is unused
-- 'barcode' is unused or moved to inventory
ALTER TABLE product_variants DROP COLUMN IF EXISTS stock,
    DROP COLUMN IF EXISTS min_stock_level,
    DROP COLUMN IF EXISTS barcode;
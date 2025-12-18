-- Phase 15 Fix: Remove Legacy Sync Trigger
-- This trigger references dropped columns (code, image) causing insert/update failures.
DROP TRIGGER IF EXISTS sync_product_legacy_columns_trigger ON products;
DROP FUNCTION IF EXISTS sync_product_legacy_columns();
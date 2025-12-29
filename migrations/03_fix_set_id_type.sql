-- Migration: Change set_id from UUID to TEXT
-- Reason: To support human-readable short references (e.g. #ED8C85) for SKU sets
ALTER TABLE "inventory_items"
ALTER COLUMN "set_id" TYPE TEXT;
COMMENT ON COLUMN "inventory_items"."set_id" IS 'Human-readable reference linking multiple physical boxes of the same SKU item';
-- Migration: Multi-Box LPN Support
-- Description: Adds columns to support linking multiple LPNs as a single Item Set.
ALTER TABLE "inventory_items"
ADD COLUMN "set_id" UUID DEFAULT NULL,
    -- Common ID for all boxes in the same set
ADD COLUMN "box_number" INTEGER DEFAULT 1,
    -- 1, 2, 3...
ADD COLUMN "total_boxes" INTEGER DEFAULT 1;
-- Total Count (e.g. 3)
COMMENT ON COLUMN "inventory_items"."set_id" IS 'UUID linking multiple physical boxes (LPNs) of the same SKU item';
COMMENT ON COLUMN "inventory_items"."box_number" IS 'Current box sequence (e.g. 1 of 3)';
COMMENT ON COLUMN "inventory_items"."total_boxes" IS 'Total boxes in this set';
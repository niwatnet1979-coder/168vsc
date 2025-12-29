-- Migration: 04_swift_inbound.sql
-- Description: Updates schema to support categorized evidence capture and deferred SKU binding.
-- 1. Update evidence_photos table
ALTER TABLE evidence_photos
ADD COLUMN IF NOT EXISTS category TEXT,
    ADD COLUMN IF NOT EXISTS captured_text TEXT,
    ADD COLUMN IF NOT EXISTS custom_notes TEXT;
-- 2. Update inventory_items table
-- Ensure product and variant can be null for "Unbound" state
ALTER TABLE inventory_items
ALTER COLUMN product_id DROP NOT NULL;
ALTER TABLE inventory_items
ALTER COLUMN variant_id DROP NOT NULL;
-- 3. Add index for captured_text for faster searching if needed later
CREATE INDEX IF NOT EXISTS idx_evidence_photos_captured_text ON evidence_photos(captured_text);
CREATE INDEX IF NOT EXISTS idx_evidence_photos_category ON evidence_photos(category);
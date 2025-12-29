-- Migration: 01_lpn_foundation.sql
-- Description: Create tables for Shipping Plans, Evidence Photos, and update Inventory Items for LPN system
-- 1. Evidence Photos (Smart Inbound)
CREATE TABLE IF NOT EXISTS evidence_photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    tags TEXT [],
    -- Array of strings: ['tracking', 'po', 'label', 'damage']
    ocr_data JSONB,
    -- Store raw text detected
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT -- User UUID or Name
);
-- 2. Shipping Plans (Main Header)
CREATE TABLE IF NOT EXISTS shipping_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    plan_number TEXT UNIQUE NOT NULL,
    -- "SP-251230-001"
    status TEXT DEFAULT 'draft',
    -- draft, picking, ready_to_ship, shipped, cancelled
    type TEXT DEFAULT 'customer',
    -- customer, technician, pickup, transfer
    -- Destination Info
    destination_name TEXT,
    destination_address TEXT,
    destination_contact TEXT,
    location_id UUID,
    -- Optional link to saved addresses
    -- Method
    shipping_method TEXT,
    -- Flash, Lalamove, Pickup
    tracking_no TEXT,
    -- Final Carrier Tracking Number
    shipping_cost NUMERIC DEFAULT 0,
    -- Meta
    job_id UUID REFERENCES jobs(id),
    -- Link to a job (if for technician)
    order_id UUID REFERENCES orders(id),
    -- Link to a sales order (if for customer)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT
);
-- 3. Shipping Plan Items (Requirements)
CREATE TABLE IF NOT EXISTS shipping_plan_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    shipping_plan_id UUID REFERENCES shipping_plans(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(uuid),
    -- Link to product catalog
    variant_id UUID REFERENCES product_variants(id),
    quantity_required INTEGER DEFAULT 1,
    quantity_picked INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 4. Update Inventory Items (LPN Fields)
-- Check if columns exist before adding (Idempotent)
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'inventory_items'
        AND column_name = 'shipping_plan_id'
) THEN
ALTER TABLE inventory_items
ADD COLUMN shipping_plan_id UUID REFERENCES shipping_plans(id);
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'inventory_items'
        AND column_name = 'lpn_type'
) THEN
ALTER TABLE inventory_items
ADD COLUMN lpn_type TEXT DEFAULT 'master';
-- 'master', 'box'
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'inventory_items'
        AND column_name = 'parent_lpn_id'
) THEN
ALTER TABLE inventory_items
ADD COLUMN parent_lpn_id UUID REFERENCES inventory_items(id);
END IF;
END $$;
-- 5. LPN Helper Function (to generate safe unique LPNs)
CREATE OR REPLACE FUNCTION generate_lpn_seq() RETURNS TEXT AS $$
DECLARE seq INTEGER;
date_part TEXT;
lpn_str TEXT;
BEGIN date_part := to_char(NOW(), 'YYMMDD');
-- Ideally, use a sequence for uniqueness. For simplicity, we assume this is called app-side or we accept slight gaps.
-- Better approach: Create a sequence per day or global sequence
CREATE SEQUENCE IF NOT EXISTS lpn_global_seq;
seq := nextval('lpn_global_seq');
-- Format: LPN-251230-0001 (using seq modulo or just simple seq)
-- But user wants LPN-YYMMDD-XXXX (Random). App side generation with unique check is safer for random strings.
-- If we use DB sequence: LPN-251230-SEQ
RETURN 'LPN-' || date_part || '-' || lpn_str;
END;
$$ LANGUAGE plpgsql;
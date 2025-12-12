-- ============================================
-- Product Variant Restructuring - Phase 1
-- Migration: Add dimensions to variants
-- ============================================
-- This script updates the variant structure to include dimensions
-- Run this BEFORE updating the UI code
-- ============================================
-- Step 1: Add helper function to migrate variant structure
CREATE OR REPLACE FUNCTION migrate_variant_dimensions() RETURNS void AS $$
DECLARE product_record RECORD;
new_variants JSONB;
variant JSONB;
updated_variant JSONB;
BEGIN -- Loop through all products
FOR product_record IN
SELECT uuid,
    product_code,
    length,
    width,
    height,
    material,
    variants,
    price,
    stock,
    color
FROM products
WHERE variants IS NOT NULL
    AND jsonb_array_length(variants) > 0 LOOP new_variants := '[]'::jsonb;
-- Loop through each variant
FOR variant IN
SELECT *
FROM jsonb_array_elements(product_record.variants) LOOP -- Add dimensions to variant if not exists
    IF NOT (variant ? 'dimensions') THEN updated_variant := variant || jsonb_build_object(
        'dimensions',
        jsonb_build_object(
            'length',
            COALESCE(product_record.length, ''),
            'width',
            COALESCE(product_record.width, ''),
            'height',
            COALESCE(product_record.height, '')
        ),
        'sku',
        variant->>'id' -- Use variant id as SKU for now
    );
-- Add material if exists and not in variant
IF product_record.material IS NOT NULL
AND NOT (variant ? 'material') THEN updated_variant := updated_variant || jsonb_build_object('material', product_record.material);
END IF;
new_variants := new_variants || jsonb_build_array(updated_variant);
ELSE new_variants := new_variants || jsonb_build_array(variant);
END IF;
END LOOP;
-- Update product with new variant structure
UPDATE products
SET variants = new_variants,
    updated_at = NOW()
WHERE uuid = product_record.uuid;
RAISE NOTICE 'Updated product: %',
product_record.product_code;
END LOOP;
END;
$$ LANGUAGE plpgsql;
-- Step 2: Add base_price column (optional)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS base_price NUMERIC;
-- Step 3: Run migration
SELECT migrate_variant_dimensions();
-- Step 4: Verify migration
SELECT product_code,
    jsonb_pretty(variants) as variants_structure
FROM products
WHERE variants IS NOT NULL
    AND jsonb_array_length(variants) > 0
LIMIT 5;
-- Step 5: Create index for variant queries
CREATE INDEX IF NOT EXISTS idx_products_variants ON products USING GIN (variants);
-- ============================================
-- Rollback Script (if needed)
-- ============================================
-- To rollback, you would need to:
-- 1. Remove dimensions from variants
-- 2. Drop base_price column
-- 3. Drop the helper function
--
-- DROP FUNCTION IF EXISTS migrate_variant_dimensions();
-- ALTER TABLE products DROP COLUMN IF EXISTS base_price;
-- DROP INDEX IF EXISTS idx_products_variants;
-- ============================================
COMMENT ON FUNCTION migrate_variant_dimensions() IS 'Migrates product dimensions to variant level';
COMMENT ON COLUMN products.base_price IS 'Base price for product (optional, variants have their own prices)';
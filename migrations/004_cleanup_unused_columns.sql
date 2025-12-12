-- ============================================
-- Products Table Column Cleanup - COMPLETE
-- Remove ALL deprecated columns
-- ============================================
-- Run this AFTER code changes are deployed
-- ============================================
-- Step 1: Backup check - verify columns exist
SELECT column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'products'
    AND column_name IN (
        'id',
        'subcategory',
        'price',
        'stock',
        'color',
        'image_url',
        'images',
        'length',
        'width',
        'height'
    );
-- Step 2: Ensure all products have product_code (safety check)
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM products
    WHERE product_code IS NULL
        OR product_code = ''
) THEN RAISE EXCEPTION 'Some products do not have product_code. Migration aborted.';
END IF;
END $$;
-- Step 3: Drop deprecated columns
ALTER TABLE products DROP COLUMN IF EXISTS id,
    DROP COLUMN IF EXISTS subcategory,
    DROP COLUMN IF EXISTS price,
    DROP COLUMN IF EXISTS stock,
    DROP COLUMN IF EXISTS color,
    DROP COLUMN IF EXISTS image_url,
    DROP COLUMN IF EXISTS images,
    DROP COLUMN IF EXISTS length,
    DROP COLUMN IF EXISTS width,
    DROP COLUMN IF EXISTS height;
-- Step 4: Verify removal
SELECT column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;
-- ============================================
-- Columns KEPT (active):
-- - uuid (PRIMARY KEY)
-- - product_code (UNIQUE, main identifier)
-- - name (product name)
-- - category (product category)
-- - description (product description)
-- - material (product material)
-- - variants (JSONB - contains all variant data)
-- - created_at (timestamp)
-- - updated_at (timestamp)
-- ============================================
-- Rollback (if needed)
-- ALTER TABLE products 
--   ADD COLUMN id TEXT,
--   ADD COLUMN subcategory TEXT,
--   ADD COLUMN price NUMERIC,
--   ADD COLUMN stock INTEGER,
--   ADD COLUMN color TEXT,
--   ADD COLUMN image_url TEXT,
--   ADD COLUMN images TEXT[],
--   ADD COLUMN length TEXT,
--   ADD COLUMN width TEXT,
--   ADD COLUMN height TEXT;
COMMENT ON TABLE products IS 'Products table - fully migrated to variant-based structure. All product-specific data (price, stock, color, dimensions, images) now stored in variants JSONB.';
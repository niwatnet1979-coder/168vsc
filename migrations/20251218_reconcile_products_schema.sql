-- Migration: Product Schema Reconciliation & Save Optimization (Defensive Version)
-- Description: Standardizes 'code', 'image', and 'min_stock' columns safely.
-- 1. Ensure 'products' table has all necessary columns
DO $$ BEGIN -- Add 'product_code' if missing (New Standard)
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'products'
        AND column_name = 'product_code'
) THEN
ALTER TABLE products
ADD COLUMN product_code TEXT UNIQUE;
END IF;
-- Add 'code' if missing (Legacy Alias)
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'products'
        AND column_name = 'code'
) THEN
ALTER TABLE products
ADD COLUMN code TEXT;
END IF;
-- Add 'image_url' if missing (New Standard)
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'products'
        AND column_name = 'image_url'
) THEN
ALTER TABLE products
ADD COLUMN image_url TEXT;
END IF;
-- Add 'image' if missing (Legacy Alias)
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'products'
        AND column_name = 'image'
) THEN
ALTER TABLE products
ADD COLUMN image TEXT;
END IF;
-- Add 'min_stock_level' if missing
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'products'
        AND column_name = 'min_stock_level'
) THEN
ALTER TABLE products
ADD COLUMN min_stock_level INTEGER DEFAULT 0;
END IF;
-- Add 'pack_size' if missing
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'products'
        AND column_name = 'pack_size'
) THEN
ALTER TABLE products
ADD COLUMN pack_size TEXT;
END IF;
END $$;
-- 2. Sync existing data safely using dynamic SQL to avoid "column does not exist" compilation errors
DO $$ BEGIN -- Sync code <-> product_code
EXECUTE 'UPDATE products SET code = product_code WHERE code IS NULL AND product_code IS NOT NULL';
EXECUTE 'UPDATE products SET product_code = code WHERE product_code IS NULL AND code IS NOT NULL';
-- Sync image <-> image_url
EXECUTE 'UPDATE products SET image = image_url WHERE image IS NULL AND image_url IS NOT NULL';
EXECUTE 'UPDATE products SET image_url = image WHERE image_url IS NULL AND image IS NOT NULL';
END $$;
-- 3. Create Trigger to keep columns in sync automatically
CREATE OR REPLACE FUNCTION sync_product_legacy_columns() RETURNS TRIGGER AS $$ BEGIN -- Sync product_code <-> code
    IF (
        NEW.product_code IS NOT NULL
        AND (
            OLD.product_code IS NULL
            OR NEW.product_code IS DISTINCT
            FROM OLD.product_code
        )
    ) THEN NEW.code = NEW.product_code;
ELSIF (
    NEW.code IS NOT NULL
    AND (
        OLD.code IS NULL
        OR NEW.code IS DISTINCT
        FROM OLD.code
    )
) THEN NEW.product_code = NEW.code;
END IF;
-- Sync image_url <-> image
IF (
    NEW.image_url IS NOT NULL
    AND (
        OLD.image_url IS NULL
        OR NEW.image_url IS DISTINCT
        FROM OLD.image_url
    )
) THEN NEW.image = NEW.image_url;
ELSIF (
    NEW.image IS NOT NULL
    AND (
        OLD.image IS NULL
        OR NEW.image IS DISTINCT
        FROM OLD.image
    )
) THEN NEW.image_url = NEW.image;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS sync_product_legacy_columns_trigger ON products;
CREATE TRIGGER sync_product_legacy_columns_trigger BEFORE
INSERT
    OR
UPDATE ON products FOR EACH ROW EXECUTE FUNCTION sync_product_legacy_columns();
-- 4. Improve 'product_variants' table
ALTER TABLE product_variants DROP CONSTRAINT IF EXISTS product_variants_sku_key;
ALTER TABLE product_variants
ADD CONSTRAINT product_variants_sku_key UNIQUE (sku);
-- Ensure RLS is enabled and accessible
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for product_variants" ON product_variants;
CREATE POLICY "Enable all access for product_variants" ON product_variants FOR ALL USING (true) WITH CHECK (true);
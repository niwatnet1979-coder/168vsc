-- Migration: Database Harmony & Cleanup
-- Description: Standardizes column naming conventions and removes redundant legacy fields.
-- 1. Standardize 'products' table
DO $$ BEGIN -- Remove legacy columns that are now managed in product_variants
-- We keep 'id' (alias for uuid) and 'product_code' as they are core identifiers.
ALTER TABLE products DROP COLUMN IF EXISTS price;
ALTER TABLE products DROP COLUMN IF EXISTS stock;
ALTER TABLE products DROP COLUMN IF EXISTS color;
ALTER TABLE products DROP COLUMN IF EXISTS crystal_color;
ALTER TABLE products DROP COLUMN IF EXISTS bulb_type;
ALTER TABLE products DROP COLUMN IF EXISTS light;
ALTER TABLE products DROP COLUMN IF EXISTS remote;
ALTER TABLE products DROP COLUMN IF EXISTS images;
-- Array type, redundant with JSONB and image_url
-- Ensure image_url is the primary naming convention
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'products'
        AND column_name = 'image_url'
) THEN
ALTER TABLE products
ADD COLUMN image_url TEXT;
END IF;
-- Ensure 'image' alias exists
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'products'
        AND column_name = 'image'
) THEN
ALTER TABLE products
ADD COLUMN image TEXT;
END IF;
-- Standardize min_stock_level
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'products'
        AND column_name = 'min_stock_level'
) THEN
ALTER TABLE products
ADD COLUMN min_stock_level INTEGER DEFAULT 0;
END IF;
END $$;
-- 2. Standardize 'product_variants' table
DO $$ BEGIN -- Ensure naming consistency: min_stock -> min_stock_level
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'product_variants'
        AND column_name = 'min_stock'
)
AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'product_variants'
        AND column_name = 'min_stock_level'
) THEN
ALTER TABLE product_variants
    RENAME COLUMN min_stock TO min_stock_level;
END IF;
-- Ensure 'image_url' is present
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'product_variants'
        AND column_name = 'image_url'
) THEN
ALTER TABLE product_variants
ADD COLUMN image_url TEXT;
END IF;
END $$;
-- 3. Standardize 'jobs' table
DO $$ BEGIN -- Rename signature_image_url to signature_url for consistency with job_completions
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'jobs'
        AND column_name = 'signature_image_url'
) THEN
ALTER TABLE jobs
    RENAME COLUMN signature_image_url TO signature_url;
ELSIF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'jobs'
        AND column_name = 'signature_url'
) THEN
ALTER TABLE jobs
ADD COLUMN signature_url TEXT;
END IF;
END $$;
-- 4. Re-sync Trigger (Update/Ensure it's robust)
CREATE OR REPLACE FUNCTION sync_product_legacy_columns() RETURNS TRIGGER AS $$ BEGIN -- product_code <-> code
    IF (
        TG_OP = 'INSERT'
        OR NEW.product_code IS DISTINCT
        FROM OLD.product_code
    ) THEN NEW.code = NEW.product_code;
ELSIF (
    NEW.code IS DISTINCT
    FROM OLD.code
) THEN NEW.product_code = NEW.code;
END IF;
-- image_url <-> image
IF (
    TG_OP = 'INSERT'
    OR NEW.image_url IS DISTINCT
    FROM OLD.image_url
) THEN NEW.image = NEW.image_url;
ELSIF (
    NEW.image IS DISTINCT
    FROM OLD.image
) THEN NEW.image_url = NEW.image;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- 5. Final Cleanup: Refresh common views if they exist
-- (Adding placeholders for views that might need refreshing due to column changes)
-- DROP VIEW IF EXISTS view_product_stock_live; -- Example
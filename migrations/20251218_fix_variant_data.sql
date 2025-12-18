-- Migration: Add crystal_color to product_variants
-- Description: Ensures variant-level crystal color is persisted.
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'product_variants'
        AND column_name = 'crystal_color'
) THEN
ALTER TABLE product_variants
ADD COLUMN crystal_color TEXT;
END IF;
END $$;
-- Add min_stock_level to product_variants
ALTER TABLE product_variants
ADD COLUMN min_stock_level INTEGER DEFAULT 0;
-- Optional: If you want to backfill from products table (if logic existed previously there)
-- UPDATE product_variants pv SET min_stock_level = p.min_stock_level 
-- FROM products p WHERE pv.product_id = p.uuid;
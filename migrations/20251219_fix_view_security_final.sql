-- Fix "Unrestricted" warning for view_product_stock_live
-- 1. Enable Security Invoker (View checks permissions of the user running the query against underlying tables)
ALTER VIEW view_product_stock_live
SET (security_invoker = true);
-- 2. Grant Select Permission explicitly (just in case)
GRANT SELECT ON view_product_stock_live TO public;
GRANT SELECT ON view_product_stock_live TO authenticated;
GRANT SELECT ON view_product_stock_live TO anon;
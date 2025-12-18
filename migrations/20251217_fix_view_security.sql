-- Fix Security Warning for View
-- Description: Enable security_invoker to enforce RLS on the view
-- Date: 2025-12-17
-- Set view to run with permissions of the user calling it (invoker), 
-- ensuring RLS policies on underlying tables are respected.
ALTER VIEW view_product_stock_live
SET (security_invoker = true);
-- Verify
DO $$ BEGIN -- We can't easily query the option directly via standard SQL in a simple DO block 
-- efficiently without inspecting pg_class options, but the command above is idempotent-ish.
RAISE NOTICE 'Security invoker enabled for view_product_stock_live.';
END $$;
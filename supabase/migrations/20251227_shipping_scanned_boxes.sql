-- Add scanned_boxes to shipping_plan_items to track multi-box scanning progress
ALTER TABLE "public"."shipping_plan_items"
ADD COLUMN "scanned_boxes" JSONB DEFAULT '[]'::jsonb;
COMMENT ON COLUMN "public"."shipping_plan_items"."scanned_boxes" IS 'List of scanned box QR codes and metadata';
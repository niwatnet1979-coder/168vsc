-- Add inventory_item_id to shipping_plan_items
ALTER TABLE "public"."shipping_plan_items"
ADD COLUMN "inventory_item_id" uuid REFERENCES "public"."inventory_items"("id");
-- Add index for performance
CREATE INDEX "idx_shipping_plan_items_inventory_item_id" ON "public"."shipping_plan_items"("inventory_item_id");
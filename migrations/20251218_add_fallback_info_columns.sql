-- Migration: Add JSONB columns for custom address and contact info (fallback when no ID)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS delivery_address_info JSONB;
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS selected_contact_info JSONB;
COMMENT ON COLUMN orders.delivery_address_info IS 'Stores custom delivery address when not using a saved customer address ID';
COMMENT ON COLUMN orders.selected_contact_info IS 'Stores custom contact info when not using a saved customer contact ID';
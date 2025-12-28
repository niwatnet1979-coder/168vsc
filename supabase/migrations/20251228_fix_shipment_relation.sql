-- Add inbound_shipment_id column to purchase_orders table if it doesn't exist
ALTER TABLE public.purchase_orders
ADD COLUMN IF NOT EXISTS inbound_shipment_id UUID REFERENCES public.inbound_shipments(id) ON DELETE
SET NULL;
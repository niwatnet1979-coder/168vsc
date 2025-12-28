-- Create Inbound Shipments Table
CREATE TABLE IF NOT EXISTS public.inbound_shipments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    -- e.g. SEA-2023-12-01
    forwarder TEXT,
    tracking_no TEXT,
    status TEXT CHECK (
        status IN ('planned', 'shipped', 'arrived', 'closed')
    ) DEFAULT 'planned',
    etd DATE,
    eta DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Create Inbound Shipment Costs Table
CREATE TABLE IF NOT EXISTS public.inbound_shipment_costs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    shipment_id UUID REFERENCES public.inbound_shipments(id) ON DELETE CASCADE,
    cost_type TEXT NOT NULL,
    -- shipping, tax, clearance, other
    amount NUMERIC DEFAULT 0,
    currency TEXT DEFAULT 'THB',
    exchange_rate NUMERIC DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Add relation to Purchase Orders
ALTER TABLE public.purchase_orders
ADD COLUMN IF NOT EXISTS inbound_shipment_id UUID REFERENCES public.inbound_shipments(id) ON DELETE
SET NULL;
-- Enable RLS (Optional but good practice, keeping open for now as per project style)
-- ALTER TABLE public.inbound_shipments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.inbound_shipment_costs ENABLE ROW LEVEL SECURITY;
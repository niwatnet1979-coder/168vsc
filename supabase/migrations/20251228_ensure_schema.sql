-- 1. Ensure `inbound_shipments` table exists
CREATE TABLE IF NOT EXISTS public.inbound_shipments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
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
-- 2. Ensure `inbound_shipment_costs` table exists
CREATE TABLE IF NOT EXISTS public.inbound_shipment_costs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    shipment_id UUID REFERENCES public.inbound_shipments(id) ON DELETE CASCADE,
    cost_type TEXT NOT NULL,
    amount NUMERIC DEFAULT 0,
    currency TEXT DEFAULT 'THB',
    exchange_rate NUMERIC DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- 3. Ensure `purchase_orders` has `inbound_shipment_id`
ALTER TABLE public.purchase_orders
ADD COLUMN IF NOT EXISTS inbound_shipment_id UUID REFERENCES public.inbound_shipments(id) ON DELETE
SET NULL;
-- 4. Ensure `purchase_orders` has `total_landed_cost` related columns for allocation
ALTER TABLE public.purchase_orders
ADD COLUMN IF NOT EXISTS shipping_intl NUMERIC(10, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS duty_tax NUMERIC(10, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS clearing_fee NUMERIC(10, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS fines_charges NUMERIC(10, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_landed_cost NUMERIC(10, 2) DEFAULT 0;
-- 5. Force schema cache reload (Implicit in Supabase when running DDL)
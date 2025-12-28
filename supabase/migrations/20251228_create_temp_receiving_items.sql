CREATE TABLE public.temp_receiving_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    temp_qr_code TEXT NOT NULL UNIQUE,
    po_id UUID NULL REFERENCES public.purchase_orders(id),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'scanned', 'mapped')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_temp_receiving_qr ON public.temp_receiving_items(temp_qr_code);
-- Create order_payments table if it doesn't exist
CREATE TABLE IF NOT EXISTS order_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    amount DECIMAL(10, 2) NOT NULL,
    payment_method TEXT,
    payment_type TEXT DEFAULT 'deposit',
    -- 'deposit', 'final_payment', 'installment'
    proof_url TEXT,
    status TEXT DEFAULT 'Completed',
    -- 'Pending', 'Verified', 'Completed', 'Rejected'
    is_deposit BOOLEAN DEFAULT FALSE,
    receiver_signature TEXT,
    payer_signature TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Enable RLS
ALTER TABLE order_payments ENABLE ROW LEVEL SECURITY;
-- Add policies
CREATE POLICY "Enable read access for all users" ON order_payments FOR
SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON order_payments FOR
INSERT WITH CHECK (
        auth.role() = 'authenticated'
        OR auth.role() = 'anon'
    );
CREATE POLICY "Enable update for authenticated users only" ON order_payments FOR
UPDATE USING (
        auth.role() = 'authenticated'
        OR auth.role() = 'anon'
    );
CREATE POLICY "Enable delete for authenticated users only" ON order_payments FOR DELETE USING (
    auth.role() = 'authenticated'
    OR auth.role() = 'anon'
);
-- Add notes just in case
COMMENT ON TABLE order_payments IS 'Stores payment records for orders';
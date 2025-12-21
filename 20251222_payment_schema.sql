-- Add new columns to order_payments
ALTER TABLE public.order_payments
ADD COLUMN IF NOT EXISTS invoice_no text,
    ADD COLUMN IF NOT EXISTS invoice_date timestamp with time zone,
    ADD COLUMN IF NOT EXISTS receipt_no text,
    ADD COLUMN IF NOT EXISTS receipt_date timestamp with time zone;
-- Create/Verify indices for faster lookups
CREATE INDEX IF NOT EXISTS idx_order_payments_order_id ON public.order_payments(order_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_order_payments_invoice_no ON public.order_payments(invoice_no)
WHERE invoice_no IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_order_payments_receipt_no ON public.order_payments(receipt_no)
WHERE receipt_no IS NOT NULL;
-- Create sequence tracking table
CREATE TABLE IF NOT EXISTS public.document_sequences (
    type text NOT NULL,
    -- 'IV', 'RC'
    year_month text NOT NULL,
    -- '202512'
    last_sequence integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (type, year_month)
);
-- Check if function exists before creating (to avoid error if re-run)
DROP FUNCTION IF EXISTS public.get_next_document_sequence;
-- Create Atomic Increment Function
CREATE OR REPLACE FUNCTION public.get_next_document_sequence(doc_type text, doc_year_month text) RETURNS integer LANGUAGE plpgsql AS $$
DECLARE next_seq integer;
BEGIN
INSERT INTO public.document_sequences (type, year_month, last_sequence)
VALUES (doc_type, doc_year_month, 1) ON CONFLICT (type, year_month) DO
UPDATE
SET last_sequence = public.document_sequences.last_sequence + 1,
    updated_at = now()
RETURNING last_sequence INTO next_seq;
RETURN next_seq;
END;
$$;
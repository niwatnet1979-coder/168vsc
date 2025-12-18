-- Add receiver_contact_id and receiver_contact_info columns to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS receiver_contact_id UUID REFERENCES customer_contacts(id),
    ADD COLUMN IF NOT EXISTS receiver_contact_info JSONB;
-- Comment for clarity
COMMENT ON COLUMN orders.selected_contact_id IS 'Primary Purchaser Contact (ผู้ติดต่อจัดซื้อ)';
COMMENT ON COLUMN orders.receiver_contact_id IS 'Document Receiver Contact (ผู้รับเอกสาร)';
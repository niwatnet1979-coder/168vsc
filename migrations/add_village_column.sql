-- Add missing village column to customer tables
-- village = ชื่อหมู่บ้าน (village name)
-- building = อาคาร (building name)
-- These are separate fields
-- Add village to customer_addresses
ALTER TABLE customer_addresses
ADD COLUMN IF NOT EXISTS village text;
-- Add village to customer_tax_invoices
ALTER TABLE customer_tax_invoices
ADD COLUMN IF NOT EXISTS village text;
-- Verify columns exist
SELECT table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name IN ('customer_addresses', 'customer_tax_invoices')
    AND column_name IN ('village', 'building', 'villageno')
ORDER BY table_name,
    column_name;
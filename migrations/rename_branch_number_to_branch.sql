-- Rename branch_number to branch in customer_tax_invoices table
-- This makes the column name simpler and matches the UI field name directly
ALTER TABLE customer_tax_invoices
    RENAME COLUMN branch_number TO branch;
-- Verify the change
SELECT column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'customer_tax_invoices'
    AND column_name = 'branch';
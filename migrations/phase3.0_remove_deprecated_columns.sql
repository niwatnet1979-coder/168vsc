-- Remove media_source_other from customers table
ALTER TABLE customers DROP COLUMN IF EXISTS media_source_other;
-- Remove address and branch_name from customer_tax_invoices table
ALTER TABLE customer_tax_invoices DROP COLUMN IF EXISTS address,
    DROP COLUMN IF EXISTS branch_name;
-- Remove redundant address column from customer_addresses
-- The address field is redundant because it's just a concatenation of:
-- addr_number, addr_moo, addr_village, addr_soi, addr_road, addr_tambon, addr_amphoe, addr_province, zipcode
-- We can always construct the full address from these fields when needed
-- Drop address column from customer_addresses
ALTER TABLE customer_addresses DROP COLUMN IF EXISTS address;
-- Verify the change
SELECT column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'customer_addresses'
ORDER BY ordinal_position;
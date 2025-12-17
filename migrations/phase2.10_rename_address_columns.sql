-- Phase 2.10: Rename Address Columns to Match UI Field Names
-- This migration renames database columns to match UI expectations
-- This eliminates the need for complex field mapping
-- Rename columns in customer_addresses table
ALTER TABLE customer_addresses
    RENAME COLUMN house_number TO addr_number;
ALTER TABLE customer_addresses
    RENAME COLUMN village_no TO addr_moo;
ALTER TABLE customer_addresses
    RENAME COLUMN building TO addr_village;
ALTER TABLE customer_addresses
    RENAME COLUMN soi TO addr_soi;
ALTER TABLE customer_addresses
    RENAME COLUMN road TO addr_road;
ALTER TABLE customer_addresses
    RENAME COLUMN subdistrict TO addr_tambon;
ALTER TABLE customer_addresses
    RENAME COLUMN district TO addr_amphoe;
ALTER TABLE customer_addresses
    RENAME COLUMN province TO addr_province;
ALTER TABLE customer_addresses
    RENAME COLUMN postcode TO zipcode;
ALTER TABLE customer_addresses
    RENAME COLUMN google_map_link TO google_maps_link;
-- Add comments
COMMENT ON COLUMN customer_addresses.addr_number IS 'House/building number (เลขที่)';
COMMENT ON COLUMN customer_addresses.addr_moo IS 'Village number (หมู่)';
COMMENT ON COLUMN customer_addresses.addr_village IS 'Village/building name (หมู่บ้าน/อาคาร)';
COMMENT ON COLUMN customer_addresses.addr_soi IS 'Soi/lane (ซอย)';
COMMENT ON COLUMN customer_addresses.addr_road IS 'Road (ถนน)';
COMMENT ON COLUMN customer_addresses.addr_tambon IS 'Subdistrict (ตำบล)';
COMMENT ON COLUMN customer_addresses.addr_amphoe IS 'District (อำเภอ)';
COMMENT ON COLUMN customer_addresses.addr_province IS 'Province (จังหวัด)';
COMMENT ON COLUMN customer_addresses.zipcode IS 'Postal code (รหัสไปรษณีย์)';
COMMENT ON COLUMN customer_addresses.google_maps_link IS 'Google Maps link';
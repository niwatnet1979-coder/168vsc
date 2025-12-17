-- Phase 2.6: Expand Address Fields & Tax Invoice Address Reference
-- Migration: Add detailed address fields to customer_addresses table
--            Add FK reference from customer_tax_invoices to customer_addresses
-- Date: 2025-12-17
-- Author: Database Refactoring - Phase 2.6
-- ============================================================================
-- Step 1: Add detailed address columns to customer_addresses table
-- ============================================================================
ALTER TABLE customer_addresses
ADD COLUMN IF NOT EXISTS house_number TEXT;
ALTER TABLE customer_addresses
ADD COLUMN IF NOT EXISTS village_no TEXT;
ALTER TABLE customer_addresses
ADD COLUMN IF NOT EXISTS building TEXT;
ALTER TABLE customer_addresses
ADD COLUMN IF NOT EXISTS soi TEXT;
ALTER TABLE customer_addresses
ADD COLUMN IF NOT EXISTS road TEXT;
-- ============================================================================
-- Step 2: Add FK reference from customer_tax_invoices to customer_addresses
-- ============================================================================
ALTER TABLE customer_tax_invoices
ADD COLUMN IF NOT EXISTS address_id UUID REFERENCES customer_addresses(id);
CREATE INDEX IF NOT EXISTS idx_customer_tax_invoices_address_id ON customer_tax_invoices(address_id);
-- ============================================================================
-- Step 3: Add comments
-- ============================================================================
COMMENT ON COLUMN customer_addresses.house_number IS 'เลขที่ - House number';
COMMENT ON COLUMN customer_addresses.village_no IS 'หมู่ - Village number (หมู่ที่)';
COMMENT ON COLUMN customer_addresses.building IS 'อาคาร/หมู่บ้าน - Building/Village name';
COMMENT ON COLUMN customer_addresses.soi IS 'ซอย - Soi/Lane';
COMMENT ON COLUMN customer_addresses.road IS 'ถนน - Road';
COMMENT ON COLUMN customer_addresses.subdistrict IS 'แขวง/ตำบล - Subdistrict/Tambon';
COMMENT ON COLUMN customer_addresses.district IS 'เขต/อำเภอ - District/Amphoe';
COMMENT ON COLUMN customer_addresses.province IS 'จังหวัด - Province';
COMMENT ON COLUMN customer_addresses.postcode IS 'รหัสไปรษณีย์ - Postal code';
COMMENT ON COLUMN customer_tax_invoices.address_id IS 'FK to customer_addresses - reuse address instead of duplicating';
-- ============================================================================
-- Step 4: Verify migration
-- ============================================================================
DO $$ BEGIN RAISE NOTICE '========================================';
RAISE NOTICE 'Phase 2.6 Migration Summary';
RAISE NOTICE '========================================';
RAISE NOTICE 'Added detailed address columns to customer_addresses:';
RAISE NOTICE '  - house_number (เลขที่)';
RAISE NOTICE '  - village_no (หมู่)';
RAISE NOTICE '  - building (อาคาร/หมู่บ้าน)';
RAISE NOTICE '  - soi (ซอย)';
RAISE NOTICE '  - road (ถนน)';
RAISE NOTICE '';
RAISE NOTICE '';
RAISE NOTICE 'Added FK reference:';
RAISE NOTICE '  - customer_tax_invoices.address_id → customer_addresses(id)';
RAISE NOTICE '========================================';
RAISE NOTICE 'Migration completed successfully!';
RAISE NOTICE '========================================';
END $$;
-- ============================================================================
-- Rollback Instructions (if needed)
-- ============================================================================
-- To rollback this migration:
-- ALTER TABLE customer_addresses DROP COLUMN IF EXISTS house_number;
-- ALTER TABLE customer_addresses DROP COLUMN IF EXISTS village_no;
-- ALTER TABLE customer_addresses DROP COLUMN IF EXISTS building;
-- ALTER TABLE customer_addresses DROP COLUMN IF EXISTS soi;
-- ALTER TABLE customer_addresses DROP COLUMN IF EXISTS road;
-- ALTER TABLE customer_addresses RENAME COLUMN subdistrict TO sub_district;
-- ALTER TABLE customer_addresses RENAME COLUMN postcode TO postal_code;
-- ALTER TABLE customer_tax_invoices DROP COLUMN IF EXISTS address_id;
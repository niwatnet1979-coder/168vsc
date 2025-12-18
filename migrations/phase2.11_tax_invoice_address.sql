-- Phase 2.11: Add Granular Address Fields to Tax Invoices
-- Migration: Add house_number, village_no, etc. to customer_tax_invoices
-- Date: 2025-12-17
-- Description: Support granular address editing in Tax Invoice form without relying on customer_addresses FK
ALTER TABLE customer_tax_invoices
ADD COLUMN IF NOT EXISTS house_number TEXT;
ALTER TABLE customer_tax_invoices
ADD COLUMN IF NOT EXISTS village_no TEXT;
ALTER TABLE customer_tax_invoices
ADD COLUMN IF NOT EXISTS building TEXT;
ALTER TABLE customer_tax_invoices
ADD COLUMN IF NOT EXISTS soi TEXT;
ALTER TABLE customer_tax_invoices
ADD COLUMN IF NOT EXISTS road TEXT;
ALTER TABLE customer_tax_invoices
ADD COLUMN IF NOT EXISTS sub_district TEXT;
ALTER TABLE customer_tax_invoices
ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE customer_tax_invoices
ADD COLUMN IF NOT EXISTS province TEXT;
ALTER TABLE customer_tax_invoices
ADD COLUMN IF NOT EXISTS postal_code TEXT;
COMMENT ON COLUMN customer_tax_invoices.house_number IS 'เลขที่';
COMMENT ON COLUMN customer_tax_invoices.village_no IS 'หมู่';
COMMENT ON COLUMN customer_tax_invoices.building IS 'อาคาร/หมู่บ้าน';
COMMENT ON COLUMN customer_tax_invoices.soi IS 'ซอย';
COMMENT ON COLUMN customer_tax_invoices.road IS 'ถนน';
COMMENT ON COLUMN customer_tax_invoices.sub_district IS 'แขวง/ตำบล';
COMMENT ON COLUMN customer_tax_invoices.district IS 'เขต/อำเภอ';
COMMENT ON COLUMN customer_tax_invoices.province IS 'จังหวัด';
COMMENT ON COLUMN customer_tax_invoices.postal_code IS 'รหัสไปรษณีย์';
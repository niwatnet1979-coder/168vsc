-- Phase 2.12: Add Position and Note to Customer Contacts
-- Migration: Add position and note columns to customer_contacts
-- Date: 2025-12-17
-- Description: Support granular contact details
ALTER TABLE customer_contacts
ADD COLUMN IF NOT EXISTS position TEXT;
ALTER TABLE customer_contacts
ADD COLUMN IF NOT EXISTS note TEXT;
COMMENT ON COLUMN customer_contacts.position IS 'ตำแหน่ง - Job Position';
COMMENT ON COLUMN customer_contacts.note IS 'หมายเหตุ - Note';
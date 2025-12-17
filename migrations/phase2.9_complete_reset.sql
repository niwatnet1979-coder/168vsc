-- Phase 2.9: COMPLETE RESET - Drop and Recreate Customer Tables
-- This migration will:
-- 1. Drop all customer-related tables
-- 2. Recreate them with proper CASCADE DELETE constraints
-- 3. Include all detailed address fields from the start
-- ============================================
-- STEP 1: DROP EXISTING TABLES (in correct order)
-- ============================================
-- Drop tables that reference customer tables first
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
-- Drop customer-related tables
DROP TABLE IF EXISTS customer_tax_invoices CASCADE;
DROP TABLE IF EXISTS customer_addresses CASCADE;
DROP TABLE IF EXISTS customer_contacts CASCADE;
-- Drop main customers table
DROP TABLE IF EXISTS customers CASCADE;
-- ============================================
-- STEP 2: CREATE CUSTOMERS TABLE
-- ============================================
CREATE TABLE customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    line_id TEXT,
    facebook TEXT,
    instagram TEXT,
    media_source TEXT,
    media_source_other TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
-- ============================================
-- STEP 3: CREATE CUSTOMER_CONTACTS TABLE
-- ============================================
CREATE TABLE customer_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    line_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    -- FK with CASCADE DELETE
    CONSTRAINT customer_contacts_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);
-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_customer_contacts_customer_id ON customer_contacts(customer_id);
-- ============================================
-- STEP 4: CREATE CUSTOMER_ADDRESSES TABLE
-- ============================================
CREATE TABLE customer_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id TEXT NOT NULL,
    label TEXT,
    -- Detailed address fields
    house_number TEXT,
    village_no TEXT,
    building TEXT,
    soi TEXT,
    road TEXT,
    subdistrict TEXT,
    district TEXT,
    province TEXT,
    postcode TEXT,
    -- Legacy full address field (for backward compatibility)
    address TEXT NOT NULL,
    google_map_link TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    -- FK with CASCADE DELETE
    CONSTRAINT customer_addresses_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);
-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer_id ON customer_addresses(customer_id);
-- ============================================
-- STEP 5: CREATE CUSTOMER_TAX_INVOICES TABLE
-- ============================================
CREATE TABLE customer_tax_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id TEXT NOT NULL,
    company_name TEXT NOT NULL,
    tax_id TEXT NOT NULL,
    address_id UUID,
    -- FK to customer_addresses
    address TEXT,
    -- Legacy field for backward compatibility
    branch_number TEXT,
    branch_name TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    -- FK with CASCADE DELETE for customer
    CONSTRAINT customer_tax_invoices_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    -- FK with SET NULL for address (if address is deleted, just set to NULL)
    CONSTRAINT customer_tax_invoices_address_id_fkey FOREIGN KEY (address_id) REFERENCES customer_addresses(id) ON DELETE
    SET NULL
);
-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_customer_tax_invoices_customer_id ON customer_tax_invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_tax_invoices_address_id ON customer_tax_invoices(address_id);
-- ============================================
-- STEP 6: RECREATE ORDERS TABLE (if needed)
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    customer_id TEXT,
    customer_name TEXT,
    order_date DATE,
    status TEXT DEFAULT 'Pending',
    shipping_fee NUMERIC DEFAULT 0,
    discount JSONB,
    vat_rate NUMERIC DEFAULT 0.07,
    total NUMERIC DEFAULT 0,
    -- FK references to customer-related tables
    selected_contact_id UUID,
    delivery_address_id UUID,
    tax_invoice_id UUID,
    -- Legacy JSONB fields (for backward compatibility)
    items JSONB,
    job_info JSONB,
    tax_invoice_info JSONB,
    delivery_address_info JSONB,
    selected_contact JSONB,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    -- FK constraints (SET NULL when referenced record is deleted)
    CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE
    SET NULL,
        CONSTRAINT orders_selected_contact_id_fkey FOREIGN KEY (selected_contact_id) REFERENCES customer_contacts(id) ON DELETE
    SET NULL,
        CONSTRAINT orders_delivery_address_id_fkey FOREIGN KEY (delivery_address_id) REFERENCES customer_addresses(id) ON DELETE
    SET NULL,
        CONSTRAINT orders_tax_invoice_id_fkey FOREIGN KEY (tax_invoice_id) REFERENCES customer_tax_invoices(id) ON DELETE
    SET NULL
);
-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_selected_contact_id ON orders(selected_contact_id);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_address_id ON orders(delivery_address_id);
CREATE INDEX IF NOT EXISTS idx_orders_tax_invoice_id ON orders(tax_invoice_id);
-- ============================================
-- STEP 7: RECREATE JOBS TABLE (if needed)
-- ============================================
CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    order_id TEXT,
    customer_id TEXT,
    customer_name TEXT,
    product_id TEXT,
    product_name TEXT,
    product_snapshot JSONB,
    job_type TEXT,
    appointment_date TIMESTAMPTZ,
    address TEXT,
    google_map_link TEXT,
    distance NUMERIC,
    assigned_team TEXT,
    status TEXT DEFAULT 'รอดำเนินการ',
    completion_date TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMP,
    -- FK constraints
    CONSTRAINT jobs_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE
    SET NULL,
        CONSTRAINT jobs_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE
    SET NULL
);
-- Add indexes
CREATE INDEX IF NOT EXISTS idx_jobs_order_id ON jobs(order_id);
CREATE INDEX IF NOT EXISTS idx_jobs_customer_id ON jobs(customer_id);
-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================
COMMENT ON TABLE customers IS 'Main customers table';
COMMENT ON TABLE customer_contacts IS 'Customer contacts with CASCADE DELETE';
COMMENT ON TABLE customer_addresses IS 'Customer addresses with detailed fields and CASCADE DELETE';
COMMENT ON TABLE customer_tax_invoices IS 'Customer tax invoices with CASCADE DELETE and address reference';
COMMENT ON COLUMN customer_addresses.address IS 'Legacy full address field for backward compatibility';
COMMENT ON COLUMN customer_tax_invoices.address_id IS 'FK to customer_addresses, SET NULL on delete';
COMMENT ON COLUMN customer_tax_invoices.address IS 'Legacy address field for backward compatibility';
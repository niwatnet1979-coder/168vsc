-- 1. Enable pgcrypto for UUID generation if not exists
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- ==========================================
-- PHASE 1: CUSTOMERS MIGRATION
-- ==========================================
-- 1.1 Add new UUID column to customers
ALTER TABLE customers
ADD COLUMN new_id UUID DEFAULT gen_random_uuid();
-- 1.2 Add new UUID FK columns to referencing tables
ALTER TABLE customer_contacts
ADD COLUMN new_customer_id UUID;
ALTER TABLE customer_addresses
ADD COLUMN new_customer_id UUID;
ALTER TABLE customer_tax_invoices
ADD COLUMN new_customer_id UUID;
ALTER TABLE orders
ADD COLUMN new_customer_id UUID;
-- Also affects orders
-- 1.3 Update referencing tables with new UUIDs
-- Join on the OLD ID to find the correct new ID
UPDATE customer_contacts t
SET new_customer_id = c.new_id
FROM customers c
WHERE t.customer_id = c.id;
UPDATE customer_addresses t
SET new_customer_id = c.new_id
FROM customers c
WHERE t.customer_id = c.id;
UPDATE customer_tax_invoices t
SET new_customer_id = c.new_id
FROM customers c
WHERE t.customer_id = c.id;
UPDATE orders t
SET new_customer_id = c.new_id
FROM customers c
WHERE t.customer_id = c.id;
-- 1.4 Drop old Constraints & Columns (CAREFUL)
-- Drop FKs
ALTER TABLE customer_contacts DROP CONSTRAINT IF EXISTS customer_contacts_customer_id_fkey;
ALTER TABLE customer_addresses DROP CONSTRAINT IF EXISTS customer_addresses_customer_id_fkey;
ALTER TABLE customer_tax_invoices DROP CONSTRAINT IF EXISTS customer_tax_invoices_customer_id_fkey;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_customer_id_fkey;
-- Drop old columns in referencing tables
ALTER TABLE customer_contacts DROP COLUMN customer_id;
ALTER TABLE customer_addresses DROP COLUMN customer_id;
ALTER TABLE customer_tax_invoices DROP COLUMN customer_id;
ALTER TABLE orders DROP COLUMN customer_id;
-- 1.5 Rename new columns to standard names
ALTER TABLE customer_contacts
    RENAME COLUMN new_customer_id TO customer_id;
ALTER TABLE customer_addresses
    RENAME COLUMN new_customer_id TO customer_id;
ALTER TABLE customer_tax_invoices
    RENAME COLUMN new_customer_id TO customer_id;
ALTER TABLE orders
    RENAME COLUMN new_customer_id TO customer_id;
-- 1.6 Switch Primary Key on Customers
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_pkey;
ALTER TABLE customers DROP COLUMN id;
ALTER TABLE customers
    RENAME COLUMN new_id TO id;
ALTER TABLE customers
ADD PRIMARY KEY (id);
-- 1.7 Restore Foreign Keys
ALTER TABLE customer_contacts
ADD CONSTRAINT customer_contacts_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
ALTER TABLE customer_addresses
ADD CONSTRAINT customer_addresses_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
ALTER TABLE customer_tax_invoices
ADD CONSTRAINT customer_tax_invoices_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
ALTER TABLE orders
ADD CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE
SET NULL;
-- ==========================================
-- PHASE 2: ORDERS MIGRATION
-- ==========================================
-- 2.1 Add new columns to orders
ALTER TABLE orders
ADD COLUMN new_id UUID DEFAULT gen_random_uuid();
ALTER TABLE orders
ADD COLUMN order_number TEXT;
-- 2.2 Migrate data: Preserve old ID as order_number
UPDATE orders
SET order_number = id;
-- 2.3 Add new UUID FK columns to referencing tables
ALTER TABLE order_items
ADD COLUMN new_order_id UUID;
ALTER TABLE order_payments
ADD COLUMN new_order_id UUID;
ALTER TABLE jobs
ADD COLUMN new_order_id UUID;
ALTER TABLE shipping_plan_items
ADD COLUMN new_order_id UUID;
-- 2.4 Update referencing tables
UPDATE order_items t
SET new_order_id = o.new_id
FROM orders o
WHERE t.order_id = o.id;
UPDATE order_payments t
SET new_order_id = o.new_id
FROM orders o
WHERE t.order_id = o.id;
UPDATE jobs t
SET new_order_id = o.new_id
FROM orders o
WHERE t.order_id = o.id;
UPDATE shipping_plan_items t
SET new_order_id = o.new_id
FROM orders o
WHERE t.order_id = o.id;
-- 2.5 Drop old Constraints & Columns
-- Drop FKs
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_order_id_fkey;
ALTER TABLE order_payments DROP CONSTRAINT IF EXISTS order_payments_order_id_fkey;
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_order_id_fkey;
ALTER TABLE shipping_plan_items DROP CONSTRAINT IF EXISTS shipping_plan_items_order_id_fkey;
-- Drop old columns in referencing tables
ALTER TABLE order_items DROP COLUMN order_id;
ALTER TABLE order_payments DROP COLUMN order_id;
ALTER TABLE jobs DROP COLUMN order_id;
ALTER TABLE shipping_plan_items DROP COLUMN order_id;
-- 2.6 Switch Primary Key on Orders
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_pkey CASCADE;
-- Add CASCADE just in case, though we handled known FKs
ALTER TABLE orders DROP COLUMN id;
ALTER TABLE orders
    RENAME COLUMN new_id TO id;
ALTER TABLE orders
ADD PRIMARY KEY (id);
-- 2.7 Rename referencing columns
ALTER TABLE order_items
    RENAME COLUMN new_order_id TO order_id;
ALTER TABLE order_payments
    RENAME COLUMN new_order_id TO order_id;
ALTER TABLE jobs
    RENAME COLUMN new_order_id TO order_id;
ALTER TABLE shipping_plan_items
    RENAME COLUMN new_order_id TO order_id;
-- 2.8 Restore Foreign Keys
ALTER TABLE order_items
ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
ALTER TABLE order_payments
ADD CONSTRAINT order_payments_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
ALTER TABLE jobs
ADD CONSTRAINT jobs_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE
SET NULL;
ALTER TABLE shipping_plan_items
ADD CONSTRAINT shipping_plan_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
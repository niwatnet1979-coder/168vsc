-- Add Foreign Keys for Order relations
-- This allows us to join orders with addresses, tax invoices, and contacts
ALTER TABLE orders
ADD CONSTRAINT fk_orders_delivery_address FOREIGN KEY (delivery_address_id) REFERENCES customer_addresses(id) ON DELETE
SET NULL;
ALTER TABLE orders
ADD CONSTRAINT fk_orders_tax_invoice FOREIGN KEY (tax_invoice_id) REFERENCES customer_tax_invoices(id) ON DELETE
SET NULL;
ALTER TABLE orders
ADD CONSTRAINT fk_orders_selected_contact FOREIGN KEY (selected_contact_id) REFERENCES customer_contacts(id) ON DELETE
SET NULL;
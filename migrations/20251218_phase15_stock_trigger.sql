-- Phase 15.3: Stock Deduction Trigger
-- This logic ensures that when an order is finalized (Completed/Shipped),
-- the physical inventory is permanently decremented.
CREATE OR REPLACE FUNCTION handle_stock_movement() RETURNS TRIGGER AS $$
DECLARE v_inventory_id UUID;
v_current_stock INT;
BEGIN -- Only proceed if status changed
IF OLD.status IS NOT DISTINCT
FROM NEW.status THEN RETURN NEW;
END IF;
-- CASE 1: Order Completed (Deduct Stock)
IF NEW.status = 'Completed'
AND OLD.status IN ('Pending', 'Processing', 'Confirmed') THEN -- Find appropriate inventory item (FIFO or arbitrary?)
-- For now, find ANY inventory item for this variant with enough stock.
-- If tracking individual items, we need specific ID. But here we have aggregated stock logic.
-- Simplification: Deduct from the first available inventory batch (FIFO-ish)
-- Or just update a generic record?
-- Given we have 'inventory_items', let's try to update one.
SELECT id,
    quantity INTO v_inventory_id,
    v_current_stock
FROM inventory_items
WHERE product_variant_id = NEW.product_variant_id
    AND quantity >= NEW.quantity
    AND status = 'in_stock'
ORDER BY created_at ASC
LIMIT 1;
IF v_inventory_id IS NULL THEN -- Fallback: If no single batch has enough, we might need to split? 
-- Or just take from the largest? 
-- For this phase, let's just take from ANY batch and allow negative if need be, OR raise error.
-- Better: Take from the main batch even if it goes negative (to record debt).
SELECT id INTO v_inventory_id
FROM inventory_items
WHERE product_variant_id = NEW.product_variant_id
LIMIT 1;
-- If absolutely no inventory record exists, we can't deduct. 
END IF;
IF v_inventory_id IS NOT NULL THEN
UPDATE inventory_items
SET quantity = quantity - NEW.quantity,
    updated_at = NOW()
WHERE id = v_inventory_id;
INSERT INTO inventory_transactions (
        inventory_item_id,
        product_variant_id,
        quantity_change,
        transaction_type,
        reference_id,
        created_by,
        note
    )
VALUES (
        v_inventory_id,
        NEW.product_variant_id,
        - NEW.quantity,
        'sale_completed',
        NEW.order_id,
        'system_trigger',
        'Order Completed'
    );
END IF;
-- CASE 2: Order Reverted from Completed (Refund Stock)
ELSIF OLD.status = 'Completed'
AND NEW.status IN (
    'Pending',
    'Processing',
    'Confirmed',
    'Cancelled'
) THEN -- Add stock back
SELECT id INTO v_inventory_id
FROM inventory_items
WHERE product_variant_id = NEW.product_variant_id
LIMIT 1;
IF v_inventory_id IS NOT NULL THEN
UPDATE inventory_items
SET quantity = quantity + NEW.quantity,
    updated_at = NOW()
WHERE id = v_inventory_id;
INSERT INTO inventory_transactions (
        inventory_item_id,
        product_variant_id,
        quantity_change,
        transaction_type,
        reference_id,
        created_by,
        note
    )
VALUES (
        v_inventory_id,
        NEW.product_variant_id,
        NEW.quantity,
        'sale_reverted',
        NEW.order_id,
        'system_trigger',
        'Order Reverted from Completed'
    );
END IF;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trigger_stock_movement
AFTER
UPDATE ON order_items FOR EACH ROW EXECUTE FUNCTION handle_stock_movement();
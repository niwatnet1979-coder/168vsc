-- 1. UPDATE VIEW FIRST (to remove dependency on order_items.status)
-- Logic: Allocated Stock = Items where Latest Job is NOT Completed (เสร็จสิ้น) or Cancelled (ยกเลิก)
DROP VIEW IF EXISTS view_product_stock_live;
CREATE OR REPLACE VIEW view_product_stock_live AS WITH LatestJobStatus AS (
        SELECT DISTINCT ON (order_item_id) order_item_id,
            status
        FROM jobs
        ORDER BY order_item_id,
            created_at DESC
    )
SELECT v.id AS variant_id,
    v.product_id,
    -- Physical Stock (From Inventory)
    COALESCE(
        (
            SELECT SUM(ii.quantity)
            FROM inventory_items ii
            WHERE ii.product_variant_id = v.id
                AND ii.status = 'in_stock'
        ),
        0
    ) AS physical_stock,
    -- Allocated Stock (From Pending Items)
    COALESCE(
        (
            SELECT SUM(oi.quantity)
            FROM order_items oi
                LEFT JOIN LatestJobStatus ljs ON ljs.order_item_id = oi.id
            WHERE oi.product_variant_id = v.id -- Active if NO job exists (new item) OR Latest Job is NOT finished/cancelled
                AND (
                    ljs.status IS NULL
                    OR ljs.status NOT IN ('เสร็จสิ้น', 'ยกเลิก', 'Completed', 'Cancelled')
                )
        ),
        0
    ) AS allocated_stock,
    -- Available Stock
    (
        COALESCE(
            (
                SELECT SUM(ii.quantity)
                FROM inventory_items ii
                WHERE ii.product_variant_id = v.id
                    AND ii.status = 'in_stock'
            ),
            0
        ) - COALESCE(
            (
                SELECT SUM(oi.quantity)
                FROM order_items oi
                    LEFT JOIN LatestJobStatus ljs ON ljs.order_item_id = oi.id
                WHERE oi.product_variant_id = v.id
                    AND (
                        ljs.status IS NULL
                        OR ljs.status NOT IN ('เสร็จสิ้น', 'ยกเลิก', 'Completed', 'Cancelled')
                    )
            ),
            0
        )
    ) AS available_stock
FROM product_variants v;
-- 2. NOW SAFE TO DROP COLUMNS from order_items
ALTER TABLE order_items DROP COLUMN IF EXISTS job_id,
    DROP COLUMN IF EXISTS job_type,
    DROP COLUMN IF EXISTS assigned_team,
    DROP COLUMN IF EXISTS appointment_date,
    DROP COLUMN IF EXISTS completion_date,
    DROP COLUMN IF EXISTS job_notes,
    DROP COLUMN IF EXISTS site_address_id,
    DROP COLUMN IF EXISTS site_inspector_id,
    DROP COLUMN IF EXISTS status;
ALTER TABLE order_items DROP COLUMN IF EXISTS variation_notes;
SELECT column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'purchase_orders'
    OR table_name = 'purchase_order_items';
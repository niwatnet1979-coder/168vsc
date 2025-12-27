-- Add expense_category column to purchase_orders
ALTER TABLE purchase_orders
ADD COLUMN IF NOT EXISTS expense_category text;
-- Add comment for clarity
COMMENT ON COLUMN purchase_orders.expense_category IS 'Category of the expense (e.g., Goods, Salary, Utilities)';
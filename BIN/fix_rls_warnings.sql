-- Enable RLS on tables causing warnings
ALTER TABLE job_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_plans ENABLE ROW LEVEL SECURITY;
-- Create policies to allow access (Public/Anon access for simplicity as requested, or matching existing pattern)
-- Assuming the app uses anon key and needs read/write access:
-- Job Completions
CREATE POLICY "Enable all access for all users" ON job_completions FOR ALL USING (true) WITH CHECK (true);
-- Shipping Plans
CREATE POLICY "Enable all access for all users" ON shipping_plans FOR ALL USING (true) WITH CHECK (true);
-- Shipping Plan Items
CREATE POLICY "Enable all access for all users" ON shipping_plan_items FOR ALL USING (true) WITH CHECK (true);
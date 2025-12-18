-- Add email column to customer_contacts
ALTER TABLE public.customer_contacts
ADD COLUMN IF NOT EXISTS email text;
-- Update RLS if necessary (usually not needed if already using * for select/all)
-- Ensure the column is visible in realtime if enabled
ALTER PUBLICATION supabase_realtime
ADD TABLE public.customer_contacts;
-- Note: The above may error if already in publication, but ADD COLUMN usually handles it.
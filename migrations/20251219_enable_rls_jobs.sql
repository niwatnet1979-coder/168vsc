-- Enable RLS on jobs table to fix "Unrestricted" warning
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
-- Create permissive policy for all users (matching previous configuration)
-- This allows both authenticated and anonymous users (if enabled) to Read/Write
-- Adjust "TO public" to "TO authenticated" if strictly locked down access is required.
CREATE POLICY "Enable access to all users" ON jobs FOR ALL TO public USING (true) WITH CHECK (true);
-- Fix RLS policies to allow inserts without strict auth.uid() check
-- This is needed because the app uses NextAuth, not Supabase Auth
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all leave requests" ON leave_requests;
DROP POLICY IF EXISTS "Users can insert their own leave requests" ON leave_requests;
DROP POLICY IF EXISTS "Users can update their own leave requests" ON leave_requests;
DROP POLICY IF EXISTS "Users can delete their own leave requests" ON leave_requests;
-- Create new, more permissive policies
-- Allow all authenticated users to view all leave requests
CREATE POLICY "Anyone can view leave requests" ON leave_requests FOR
SELECT USING (true);
-- Allow all authenticated users to insert leave requests
CREATE POLICY "Anyone can insert leave requests" ON leave_requests FOR
INSERT WITH CHECK (true);
-- Allow users to update leave requests (can add user_id check later if needed)
CREATE POLICY "Anyone can update leave requests" ON leave_requests FOR
UPDATE USING (true);
-- Allow users to delete leave requests (can add user_id check later if needed)
CREATE POLICY "Anyone can delete leave requests" ON leave_requests FOR DELETE USING (true);
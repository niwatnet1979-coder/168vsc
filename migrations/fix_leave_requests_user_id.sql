-- Complete fix for leave_requests table user_id type
-- Step 1: Drop all RLS policies that depend on user_id
DROP POLICY IF EXISTS "Users can insert their own leave requests" ON leave_requests;
DROP POLICY IF EXISTS "Users can update their own leave requests" ON leave_requests;
DROP POLICY IF EXISTS "Users can delete their own leave requests" ON leave_requests;
-- Step 2: Drop the foreign key constraint
ALTER TABLE leave_requests DROP CONSTRAINT IF EXISTS leave_requests_user_id_fkey;
-- Step 3: Change user_id from UUID to TEXT
ALTER TABLE leave_requests
ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
-- Step 4: Recreate the index
DROP INDEX IF EXISTS idx_leave_requests_user_id;
CREATE INDEX idx_leave_requests_user_id ON leave_requests(user_id);
-- Step 5: Recreate RLS policies with TEXT-based user_id
CREATE POLICY "Users can insert their own leave requests" ON leave_requests FOR
INSERT WITH CHECK (
        user_id::TEXT = auth.uid()::TEXT
        OR user_id IS NULL
    );
CREATE POLICY "Users can update their own leave requests" ON leave_requests FOR
UPDATE USING (
        user_id::TEXT = auth.uid()::TEXT
        OR user_id IS NULL
    );
CREATE POLICY "Users can delete their own leave requests" ON leave_requests FOR DELETE USING (
    user_id::TEXT = auth.uid()::TEXT
    OR user_id IS NULL
);
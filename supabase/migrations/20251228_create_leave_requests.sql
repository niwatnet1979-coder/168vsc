-- Create leave_requests table
CREATE TABLE IF NOT EXISTS public.leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    -- Optional, links to auth.users or employees table if applicable
    user_name TEXT NOT NULL,
    user_team TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    is_full_day BOOLEAN DEFAULT TRUE,
    reason TEXT NOT NULL,
    custom_reason TEXT,
    status TEXT DEFAULT 'pending',
    -- pending, approved, rejected
    approved_by TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Enable RLS
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
-- Policies (Adjust as needed, currently open for read/write for auth users)
CREATE POLICY "Enable read for all users" ON public.leave_requests FOR
SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.leave_requests FOR
INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.leave_requests FOR
UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON public.leave_requests FOR DELETE USING (true);
-- Indexes
CREATE INDEX IF NOT EXISTS idx_leave_requests_user_team ON public.leave_requests(user_team);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON public.leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_start_date ON public.leave_requests(start_date);
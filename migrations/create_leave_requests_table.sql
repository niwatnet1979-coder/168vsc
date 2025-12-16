-- Create leave_requests table
CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    user_team TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    is_full_day BOOLEAN DEFAULT true,
    start_time TIME,
    end_time TIME,
    reason TEXT NOT NULL CHECK (reason IN ('พักผ่อน', 'ป่วย', 'ติดงาน', 'อื่นๆ')),
    custom_reason TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Create index for faster queries
CREATE INDEX idx_leave_requests_user_id ON leave_requests(user_id);
CREATE INDEX idx_leave_requests_dates ON leave_requests(start_date, end_date);
CREATE INDEX idx_leave_requests_team ON leave_requests(user_team);
-- Enable RLS
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
-- RLS Policies
CREATE POLICY "Users can view all leave requests" ON leave_requests FOR
SELECT USING (true);
CREATE POLICY "Users can insert their own leave requests" ON leave_requests FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own leave requests" ON leave_requests FOR
UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own leave requests" ON leave_requests FOR DELETE USING (auth.uid() = user_id);
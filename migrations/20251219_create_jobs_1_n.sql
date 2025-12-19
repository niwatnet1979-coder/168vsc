-- 1. Create the new jobs table (linked to order_items)
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE,
    -- Assuming order_items.id is UUID
    order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
    -- Changed to TEXT because orders.id is TEXT
    sequence_number INTEGER DEFAULT 1,
    -- To track Job #1, #2, etc.
    -- Core Job Data (Moved from order_items)
    job_type TEXT DEFAULT 'installation',
    -- installation, delivery, survey, repair
    status TEXT DEFAULT 'รอดำเนินการ',
    assigned_team TEXT,
    appointment_date TIMESTAMPTZ,
    completion_date TIMESTAMPTZ,
    -- Inspector / Location
    site_inspector_id UUID REFERENCES customer_contacts(id),
    site_address_id UUID REFERENCES customer_addresses(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- 2. Migrate existing data from order_items to jobs
INSERT INTO jobs (
        order_item_id,
        order_id,
        job_type,
        status,
        assigned_team,
        appointment_date,
        completion_date,
        site_inspector_id,
        site_address_id,
        notes
    )
SELECT id,
    order_id,
    COALESCE(job_type, 'installation'),
    COALESCE(status, 'รอดำเนินการ'),
    assigned_team,
    appointment_date,
    completion_date,
    site_inspector_id,
    site_address_id,
    job_notes
FROM order_items
WHERE order_id IS NOT NULL;
-- Add indexes
CREATE INDEX IF NOT EXISTS idx_jobs_order_item_id ON jobs(order_item_id);
CREATE INDEX IF NOT EXISTS idx_jobs_order_id ON jobs(order_id);
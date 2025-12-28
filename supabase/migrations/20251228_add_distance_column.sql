-- Add distance column to customer_addresses if not exists
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'customer_addresses'
        AND column_name = 'distance'
) THEN
ALTER TABLE customer_addresses
ADD COLUMN distance TEXT DEFAULT NULL;
END IF;
END $$;
-- Add distance column to jobs if not exists
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'jobs'
        AND column_name = 'distance'
) THEN
ALTER TABLE jobs
ADD COLUMN distance TEXT DEFAULT NULL;
END IF;
END $$;
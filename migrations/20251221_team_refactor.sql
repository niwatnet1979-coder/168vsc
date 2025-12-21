-- Migration: Refactor Team Structure & Link Employees
-- Created: 2025-12-21
-- Description:
-- 1. Adds 'status' and 'team_type' to 'teams' table.
-- 2. Adds 'team_id' FK to 'employees' table.
-- 3. Migrates text-based 'team' column in employees to 'team_id' UUID.
-- 4. Fixes RLS policies ensuring anon access (just in case).
-- 1. Upgrade 'teams' table
DO $$ BEGIN -- Add 'status' if missing
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'teams'
        AND column_name = 'status'
) THEN
ALTER TABLE teams
ADD COLUMN status TEXT DEFAULT 'active';
END IF;
-- Add 'team_type' if missing
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'teams'
        AND column_name = 'team_type'
) THEN
ALTER TABLE teams
ADD COLUMN team_type TEXT DEFAULT 'General';
END IF;
END $$;
-- 2. Upgrade 'employees' table
DO $$ BEGIN -- Add 'team_id' if missing
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'employees'
        AND column_name = 'team_id'
) THEN
ALTER TABLE employees
ADD COLUMN team_id UUID REFERENCES teams(id) ON DELETE
SET NULL;
END IF;
END $$;
-- 3. Data Migration: Link Employees to Teams
-- Try to find matching team by name (case-insensitive, trimmed)
UPDATE employees
SET team_id = teams.id
FROM teams
WHERE employees.team_id IS NULL
    AND employees.team IS NOT NULL
    AND TRIM(employees.team) <> ''
    AND (
        TRIM(LOWER(employees.team)) = TRIM(LOWER(teams.name))
        OR -- Handle legacy prefix cases like "Team A" vs "A" if strictly needed, but let's stick to direct match first.
        -- Common match: "ทีมช่างกี" -> "ทีมช่างกี"
        TRIM(LOWER(employees.team)) = TRIM(LOWER(teams.name))
    );
-- 4. Ensure RLS Policies are minimal/open for this phase (User requested "Don't make it complex")
-- Teams
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_teams" ON teams;
DROP POLICY IF EXISTS "public_write_teams" ON teams;
CREATE POLICY "public_read_teams" ON teams FOR
SELECT USING (true);
CREATE POLICY "public_write_teams" ON teams FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON teams TO anon;
GRANT ALL ON teams TO service_role;
-- Employees
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_employees" ON employees;
DROP POLICY IF EXISTS "public_write_employees" ON employees;
CREATE POLICY "public_read_employees" ON employees FOR
SELECT USING (true);
CREATE POLICY "public_write_employees" ON employees FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON employees TO anon;
GRANT ALL ON employees TO service_role;
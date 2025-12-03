-- Add new columns
DO $$
BEGIN
    -- ticket_number
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cases' AND column_name = 'ticket_number') THEN
        ALTER TABLE cases ADD COLUMN ticket_number VARCHAR(50);
        -- Update existing rows with a temporary ticket number
        UPDATE cases SET ticket_number = 'TKT-MIGRATION-' || id WHERE ticket_number IS NULL;
        ALTER TABLE cases ALTER COLUMN ticket_number SET NOT NULL;
        CREATE UNIQUE INDEX ix_cases_ticket_number ON cases(ticket_number);
    END IF;

    -- request_date
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cases' AND column_name = 'request_date') THEN
        ALTER TABLE cases ADD COLUMN request_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        UPDATE cases SET request_date = created_at WHERE request_date IS NULL;
        ALTER TABLE cases ALTER COLUMN request_date SET NOT NULL;
    END IF;

    -- assigned_to
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cases' AND column_name = 'assigned_to') THEN
        ALTER TABLE cases ADD COLUMN assigned_to INTEGER;
        CREATE INDEX ix_cases_assigned_to ON cases(assigned_to);
        ALTER TABLE cases ADD CONSTRAINT cases_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES users(id);
    END IF;

    -- priority_type_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cases' AND column_name = 'priority_type_id') THEN
        ALTER TABLE cases ADD COLUMN priority_type_id INTEGER;
        CREATE INDEX ix_cases_priority_type_id ON cases(priority_type_id);
        ALTER TABLE cases ADD CONSTRAINT cases_priority_type_id_fkey FOREIGN KEY (priority_type_id) REFERENCES priority_types(id);
    END IF;

    -- support_type_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cases' AND column_name = 'support_type_id') THEN
        ALTER TABLE cases ADD COLUMN support_type_id INTEGER;
        CREATE INDEX ix_cases_support_type_id ON cases(support_type_id);
        ALTER TABLE cases ADD CONSTRAINT cases_support_type_id_fkey FOREIGN KEY (support_type_id) REFERENCES support_types(id);
    END IF;

    -- status_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cases' AND column_name = 'status_id') THEN
        ALTER TABLE cases ADD COLUMN status_id INTEGER;
        CREATE INDEX ix_cases_status_id ON cases(status_id);
        ALTER TABLE cases ADD CONSTRAINT cases_status_id_fkey FOREIGN KEY (status_id) REFERENCES support_statuses(id);
    END IF;

    -- time_spent_minutes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cases' AND column_name = 'time_spent_minutes') THEN
        ALTER TABLE cases ADD COLUMN time_spent_minutes INTEGER;
    END IF;

END $$;

-- Migrate data (optional logic, can be customized)
-- For now, we set default IDs if columns are null
UPDATE cases SET priority_type_id = 2 WHERE priority_type_id IS NULL; -- Default to Medium/Low
UPDATE cases SET support_type_id = 1 WHERE support_type_id IS NULL; -- Default to Mail
UPDATE cases SET status_id = 5 WHERE status_id IS NULL; -- Default to New

-- Drop old columns if they exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cases' AND column_name = 'priority') THEN
        ALTER TABLE cases DROP COLUMN priority;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cases' AND column_name = 'support_type') THEN
        ALTER TABLE cases DROP COLUMN support_type;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cases' AND column_name = 'status') THEN
        ALTER TABLE cases DROP COLUMN status;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cases' AND column_name = 'time_spent_hours') THEN
        ALTER TABLE cases DROP COLUMN time_spent_hours;
    END IF;
END $$;

-- Drop old enum types if they exist and are not used
DROP TYPE IF EXISTS prioritytype CASCADE;
DROP TYPE IF EXISTS supporttype CASCADE;
DROP TYPE IF EXISTS casestatus CASCADE;


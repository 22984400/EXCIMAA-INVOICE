-- Add missing columns to missions table if they don't exist

ALTER TABLE missions
ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients(id),
ADD COLUMN IF NOT EXISTS client_name text DEFAULT '',
ADD COLUMN IF NOT EXISTS follow_up_type text NOT NULL DEFAULT 'SUIVI AUDIT',
ADD COLUMN IF NOT EXISTS billing_rhythm jsonb DEFAULT '[]'::jsonb;

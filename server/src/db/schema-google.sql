-- ====================================================================
-- INNOVA TALENT SAAS — Google Integration Schema
-- ====================================================================

CREATE TABLE IF NOT EXISTS google_tokens (
    id VARCHAR(50) PRIMARY KEY,
    tokens TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
  ALTER TABLE meetings ADD COLUMN google_event_id VARCHAR(255);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

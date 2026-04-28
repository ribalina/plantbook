-- Run this in the Supabase SQL Editor to create the api_keys table.

CREATE TABLE api_keys (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key        TEXT UNIQUE NOT NULL,
  label      TEXT,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_api_keys_key ON api_keys (key);

-- Example: insert a test key
-- INSERT INTO api_keys (key, label) VALUES ('my-secret-key-123x', 'Ivan test key');

-- Applied only by PgStore.initialize() (the explicit migration command).
CREATE TABLE IF NOT EXISTS aerion_schema_version (
  singleton BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton),
  version INTEGER NOT NULL
);
INSERT INTO aerion_schema_version (singleton, version) VALUES (TRUE, 1)
ON CONFLICT (singleton) DO NOTHING;
DO $$
BEGIN
  IF (SELECT version FROM aerion_schema_version WHERE singleton = TRUE) IS DISTINCT FROM 1 THEN
    RAISE EXCEPTION 'Unsupported schema version';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS aerion_owner_state (
  owner_id TEXT PRIMARY KEY,
  revision BIGINT NOT NULL DEFAULT 0 CHECK (revision >= 0 AND revision <= 9007199254740991),
  snapshot JSONB,
  updated_at TIMESTAMPTZ
);

-- Keep the ORIGINAL response, not the latest state, for durable exact retries.
CREATE TABLE IF NOT EXISTS aerion_state_requests (
  owner_id TEXT NOT NULL REFERENCES aerion_owner_state(owner_id) ON DELETE CASCADE,
  idempotency_key TEXT NOT NULL,
  payload_hash TEXT NOT NULL CHECK (length(payload_hash) = 64),
  result JSONB NOT NULL,
  PRIMARY KEY (owner_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS aerion_sessions (
  owner_id TEXT NOT NULL REFERENCES aerion_owner_state(owner_id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  csrf_token TEXT NOT NULL,
  authenticated BOOLEAN NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (owner_id, token_hash)
);
CREATE INDEX IF NOT EXISTS aerion_sessions_expiry_idx ON aerion_sessions (owner_id, expires_at);

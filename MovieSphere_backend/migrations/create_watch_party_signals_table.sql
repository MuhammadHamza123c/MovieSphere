CREATE TABLE IF NOT EXISTS watch_party_signals (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  room TEXT NOT NULL,
  sender TEXT NOT NULL,
  type TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wps_room ON watch_party_signals(room, id);

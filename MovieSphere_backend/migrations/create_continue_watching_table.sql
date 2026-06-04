CREATE TABLE IF NOT EXISTS continue_watching (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  media_id TEXT NOT NULL,
  media_type TEXT NOT NULL,
  season INTEGER,
  episode INTEGER,
  title TEXT NOT NULL,
  poster_url TEXT DEFAULT '',
  progress_seconds FLOAT DEFAULT 0,
  total_seconds FLOAT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, media_id, media_type, COALESCE(season, 0), COALESCE(episode, 0))
);

CREATE INDEX IF NOT EXISTS idx_continue_watching_user ON continue_watching(user_id);
CREATE INDEX IF NOT EXISTS idx_continue_watching_updated ON continue_watching(updated_at DESC);

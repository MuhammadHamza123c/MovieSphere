CREATE TABLE IF NOT EXISTS continue_watching (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_id TEXT NOT NULL,
  media_type TEXT NOT NULL,
  season INT,
  episode INT,
  title TEXT,
  poster_url TEXT,
  progress_seconds INT DEFAULT 0,
  total_seconds INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  season_int INT GENERATED ALWAYS AS (COALESCE(season, 0)) STORED,
  episode_int INT GENERATED ALWAYS AS (COALESCE(episode, 0)) STORED,
  UNIQUE (user_id, media_id, media_type, season_int, episode_int)
);
CREATE INDEX IF NOT EXISTS idx_cw_user ON continue_watching(user_id);
CREATE INDEX IF NOT EXISTS idx_cw_updated ON continue_watching(updated_at DESC);

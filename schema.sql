-- Oddity Arena D1 Schema

CREATE TABLE IF NOT EXISTS votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  challenge TEXT NOT NULL,
  winner TEXT NOT NULL,
  loser TEXT NOT NULL,
  fingerprint TEXT,
  ip_country TEXT DEFAULT 'XX',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_votes_challenge ON votes(challenge);
CREATE INDEX IF NOT EXISTS idx_votes_fingerprint ON votes(challenge, fingerprint, created_at);
CREATE INDEX IF NOT EXISTS idx_votes_winner ON votes(challenge, winner);

CREATE TABLE IF NOT EXISTS elo_ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  challenge TEXT NOT NULL,
  model TEXT NOT NULL,
  rating INTEGER DEFAULT 1500,
  votes INTEGER DEFAULT 0,
  UNIQUE(challenge, model)
);

CREATE INDEX IF NOT EXISTS idx_elo_challenge ON elo_ratings(challenge, rating DESC);

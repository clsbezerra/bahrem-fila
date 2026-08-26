
CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS tickets (
  id BIGSERIAL PRIMARY KEY,
  ticket TEXT UNIQUE NOT NULL,
  people_count INTEGER NOT NULL CHECK (people_count >= 2),
  category TEXT NOT NULL CHECK (category IN ('23','45','67','10')),
  priority BOOLEAN NOT NULL DEFAULT FALSE,
  priority_reason TEXT,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting','called','cancelled','served')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  called_at TIMESTAMPTZ,
  served_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tickets_waiting ON tickets(status, category, priority DESC, created_at);
CREATE INDEX IF NOT EXISTS idx_tickets_called ON tickets(status, called_at DESC);

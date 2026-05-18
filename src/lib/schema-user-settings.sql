-- User preferences (glucose display unit, target range in mg/dL internally).
-- Run in Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  preferred_unit TEXT NOT NULL DEFAULT 'mg_dl' CHECK (preferred_unit IN ('mg_dl', 'mmol_l')),
  target_min_mg_dl INTEGER NOT NULL DEFAULT 70,
  target_max_mg_dl INTEGER NOT NULL DEFAULT 180,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Backfill from users.preferred_unit where a row is missing
INSERT INTO user_settings (user_id, preferred_unit, target_min_mg_dl, target_max_mg_dl)
SELECT u.id, COALESCE(u.preferred_unit, 'mg_dl'), 70, 180
FROM users u
WHERE NOT EXISTS (SELECT 1 FROM user_settings s WHERE s.user_id = u.id);

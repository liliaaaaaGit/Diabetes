-- Enhanced meal extraction: KH ranges, confidence, components, user corrections, templates

ALTER TABLE entry_meal
  ADD COLUMN IF NOT EXISTS kh_min smallint,
  ADD COLUMN IF NOT EXISTS kh_max smallint,
  ADD COLUMN IF NOT EXISTS confidence text CHECK (confidence IS NULL OR confidence IN ('low', 'medium', 'high')),
  ADD COLUMN IF NOT EXISTS components jsonb,
  ADD COLUMN IF NOT EXISTS fat_protein_note text,
  ADD COLUMN IF NOT EXISTS extraction_note text,
  ADD COLUMN IF NOT EXISTS user_corrected_kh smallint,
  ADD COLUMN IF NOT EXISTS correction_timestamp timestamptz;

CREATE TABLE IF NOT EXISTS meal_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  kh smallint NOT NULL CHECK (kh >= 0 AND kh <= 500),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS meal_templates_user_id_idx ON meal_templates(user_id);

ALTER TABLE meal_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own meal templates" ON meal_templates;
CREATE POLICY "Users manage own meal templates"
  ON meal_templates FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Feedback loop: store user corrections for later prompt tuning
CREATE TABLE IF NOT EXISTS meal_correction_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entry_id uuid REFERENCES entries(id) ON DELETE SET NULL,
  description text,
  kh_min smallint,
  kh_max smallint,
  corrected_kh smallint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS meal_correction_feedback_user_id_idx ON meal_correction_feedback(user_id);

ALTER TABLE meal_correction_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users insert own meal corrections" ON meal_correction_feedback;
CREATE POLICY "Users insert own meal corrections"
  ON meal_correction_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read own meal corrections" ON meal_correction_feedback;
CREATE POLICY "Users read own meal corrections"
  ON meal_correction_feedback FOR SELECT
  USING (auth.uid() = user_id);

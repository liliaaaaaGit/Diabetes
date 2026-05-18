-- Photo-based meal analysis: meal source, optional photo URL, rate-limit log, storage bucket

ALTER TABLE entry_meal
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual'
    CHECK (source IS NULL OR source IN ('manual', 'freetext_ai', 'photo_ai')),
  ADD COLUMN IF NOT EXISTS photo_url text;

CREATE TABLE IF NOT EXISTS photo_analysis_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS photo_analysis_log_user_day_idx
  ON photo_analysis_log (user_id, created_at DESC);

ALTER TABLE photo_analysis_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users insert own photo analysis log" ON photo_analysis_log;
CREATE POLICY "Users insert own photo analysis log"
  ON photo_analysis_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Storage bucket for optional retained meal photos (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'meal_photos',
  'meal_photos',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users read own meal photos" ON storage.objects;
CREATE POLICY "Users read own meal photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'meal_photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users upload own meal photos" ON storage.objects;
CREATE POLICY "Users upload own meal photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'meal_photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users delete own meal photos" ON storage.objects;
CREATE POLICY "Users delete own meal photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'meal_photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

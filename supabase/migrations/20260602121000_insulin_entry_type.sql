-- Add insulin entry category: basal, meal bolus, correction.
-- This is metadata for logging only (no dose calculations).

ALTER TABLE public.entry_insulin
  ADD COLUMN IF NOT EXISTS insulin_entry_type text NOT NULL DEFAULT 'meal_bolus';

ALTER TABLE public.entry_insulin
  DROP CONSTRAINT IF EXISTS entry_insulin_insulin_entry_type_check;

ALTER TABLE public.entry_insulin
  ADD CONSTRAINT entry_insulin_insulin_entry_type_check
  CHECK (insulin_entry_type IN ('basal', 'meal_bolus', 'correction'));

-- Backfill existing rows with sensible defaults.
UPDATE public.entry_insulin
SET insulin_entry_type = CASE
  WHEN lower(coalesce(insulin_name, '')) LIKE '%lantus%' THEN 'basal'
  WHEN insulin_type = 'long_acting' THEN 'basal'
  ELSE 'meal_bolus'
END;

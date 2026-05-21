-- Onboarding flag: shown once after first registration (existing users are backfilled).

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;

-- Existing accounts should not see onboarding again.
UPDATE public.users
SET onboarding_completed = true
WHERE onboarding_completed = false;

-- Optional: einmalig ausführen, falls bestehende Nutzer das Onboarding nach dem Migration-Lauf sehen.
UPDATE users
SET onboarding_completed = true
WHERE onboarding_completed = false;

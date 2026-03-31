-- Optional: einmalig in Supabase SQL ausführen, falls nach dem Hinzufügen von consent_given
-- alle Zeilen false erhalten haben, ältere Konten aber bereits consent_date gesetzt hatten.
UPDATE users
SET consent_given = true
WHERE consent_date IS NOT NULL;

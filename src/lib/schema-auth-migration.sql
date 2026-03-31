-- Migration: Add authentication columns to users table
-- Run this in Supabase SQL Editor after the base schema is created

-- Add new columns for authentication
ALTER TABLE users ADD COLUMN IF NOT EXISTS pseudonym TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pin_hash TEXT;
-- consent_given wird nach Registrierung auf true gesetzt, sobald der Nutzer den Consent-Screen bestätigt (API /api/auth/consent).
ALTER TABLE users ADD COLUMN IF NOT EXISTS consent_given BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS consent_date TIMESTAMPTZ;
-- Bestandsnutzer mit bereits gesetztem consent_date: optional schema-backfill-consent-existing-users.sql ausführen.
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;

-- Make email optional (not required for pseudonymous accounts)
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;

-- Create index on pseudonym for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_pseudonym ON users(pseudonym);

-- Note: The old test user with email 'test@glucocompanion.de' can remain for backward compatibility
-- New users will be created with pseudonym instead of email

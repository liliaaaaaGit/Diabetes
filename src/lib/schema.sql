-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE,
  display_name TEXT,
  preferred_unit TEXT DEFAULT 'mg_dl' CHECK (preferred_unit IN ('mg_dl', 'mmol_l')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Entries base table
CREATE TABLE IF NOT EXISTS entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'conversation', 'import')),
  type TEXT NOT NULL CHECK (type IN ('glucose', 'insulin', 'meal', 'activity', 'mood')),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  note TEXT,
  conversation_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Type-specific tables
CREATE TABLE IF NOT EXISTS entry_glucose (
  entry_id UUID PRIMARY KEY REFERENCES entries(id) ON DELETE CASCADE,
  value NUMERIC NOT NULL,
  context TEXT CHECK (context IN ('fasting', 'pre_meal', 'post_meal', 'bedtime', 'other'))
);

CREATE TABLE IF NOT EXISTS entry_insulin (
  entry_id UUID PRIMARY KEY REFERENCES entries(id) ON DELETE CASCADE,
  dose NUMERIC NOT NULL,
  insulin_type TEXT CHECK (insulin_type IN ('rapid', 'long_acting', 'mixed', 'other')),
  insulin_name TEXT
);

CREATE TABLE IF NOT EXISTS entry_meal (
  entry_id UUID PRIMARY KEY REFERENCES entries(id) ON DELETE CASCADE,
  description TEXT,
  carbs_grams NUMERIC,
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  linked_insulin_id UUID REFERENCES entries(id)
);

CREATE TABLE IF NOT EXISTS entry_activity (
  entry_id UUID PRIMARY KEY REFERENCES entries(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  duration_minutes INTEGER,
  intensity TEXT CHECK (intensity IN ('low', 'medium', 'high'))
);

CREATE TABLE IF NOT EXISTS entry_mood (
  entry_id UUID PRIMARY KEY REFERENCES entries(id) ON DELETE CASCADE,
  mood_value INTEGER NOT NULL CHECK (mood_value BETWEEN 1 AND 5)
);

-- Conversations
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  title TEXT,
  summary TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  mood_emoji TEXT,
  emotions JSONB,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Insights
CREATE TABLE IF NOT EXISTS insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  type TEXT NOT NULL CHECK (type IN ('pattern', 'stat', 'theme', 'goal', 'motivation')),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  source_refs TEXT[],
  dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Goals
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  target_days INTEGER DEFAULT 7,
  completed_days INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_entries_user_id ON entries(user_id);
CREATE INDEX IF NOT EXISTS idx_entries_type ON entries(type);
CREATE INDEX IF NOT EXISTS idx_entries_timestamp ON entries(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id);

-- Create a default test user
INSERT INTO users (id, email, display_name, preferred_unit)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'test@glucocompanion.de',
  'Tanja',
  'mg_dl'
)
ON CONFLICT (email) DO NOTHING;


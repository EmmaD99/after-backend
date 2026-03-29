-- ============================================================
-- AFTER — Schéma PostgreSQL (Supabase)
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- recherche textuelle

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Infos de base
  name TEXT NOT NULL,
  age INT NOT NULL CHECK (age >= 18 AND age <= 99),
  gender TEXT NOT NULL CHECK (gender IN ('homme', 'femme', 'non-binaire', 'autre')),
  seeking TEXT[] NOT NULL DEFAULT '{}', -- ['homme','femme','non-binaire','autre']
  city TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'FR',
  bio TEXT CHECK (char_length(bio) <= 300),
  job TEXT,
  photos TEXT[] DEFAULT '{}', -- URLs Supabase Storage

  -- Traits de personnalité (1-5)
  trait_adventure INT DEFAULT 3 CHECK (trait_adventure BETWEEN 1 AND 5),
  trait_creativity INT DEFAULT 3 CHECK (trait_creativity BETWEEN 1 AND 5),
  trait_ambition INT DEFAULT 3 CHECK (trait_ambition BETWEEN 1 AND 5),
  trait_empathy INT DEFAULT 3 CHECK (trait_empathy BETWEEN 1 AND 5),
  trait_humor INT DEFAULT 3 CHECK (trait_humor BETWEEN 1 AND 5),
  trait_independence INT DEFAULT 3 CHECK (trait_independence BETWEEN 1 AND 5),
  trait_stability INT DEFAULT 3 CHECK (trait_stability BETWEEN 1 AND 5),
  trait_spontaneity INT DEFAULT 3 CHECK (trait_spontaneity BETWEEN 1 AND 5),

  -- Préférences relationnelles
  relation_type TEXT[] DEFAULT '{}', -- ['sérieux','casual','amitié']
  values TEXT[] DEFAULT '{}',        -- ['famille','voyages','carrière',...]
  dealbreakers TEXT[] DEFAULT '{}',

  -- Statut
  is_active BOOLEAN DEFAULT TRUE,
  is_complete BOOLEAN DEFAULT FALSE,
  last_seen TIMESTAMPTZ DEFAULT NOW(),

  -- Monétisation
  simulations_left INT DEFAULT 3,    -- crédit gratuit
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'premium', 'gold'))
);

-- ============================================================
-- POTENTIAL MATCHES (profils vus)
-- ============================================================
CREATE TABLE match_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  viewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  compatibility_score FLOAT NOT NULL CHECK (compatibility_score BETWEEN 0 AND 100),
  UNIQUE(viewer_id, viewed_id)
);

-- ============================================================
-- SIMULATIONS
-- ============================================================
CREATE TABLE simulations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Score et tag
  chemistry INT NOT NULL CHECK (chemistry BETWEEN 0 AND 100),
  tag TEXT NOT NULL,

  -- Contenu généré (4 chapitres)
  chapter_week1 JSONB NOT NULL,   -- messages
  chapter_month1 JSONB NOT NULL,  -- moment de vie
  chapter_month6 JSONB NOT NULL,  -- dispute
  chapter_year1 JSONB NOT NULL,   -- snapshot

  -- Métadonnées
  model_used TEXT DEFAULT 'claude-sonnet-4-20250514',
  tokens_used INT,
  generation_ms INT,

  UNIQUE(requester_id, target_id)
);

-- ============================================================
-- ACTIONS (like / pass / super-like)
-- ============================================================
CREATE TABLE actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  actor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('like', 'pass', 'superlike')),
  UNIQUE(actor_id, target_id)
);

-- ============================================================
-- MATCHES MUTUELS
-- ============================================================
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  simulation_id UUID REFERENCES simulations(id),
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(user1_id, user2_id)
);

-- ============================================================
-- MESSAGES (chat post-match)
-- ============================================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 1000),
  is_read BOOLEAN DEFAULT FALSE
);

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('premium', 'gold')),
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired')),
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_profiles_city ON profiles(city);
CREATE INDEX idx_profiles_active ON profiles(is_active, is_complete);
CREATE INDEX idx_profiles_age ON profiles(age);
CREATE INDEX idx_match_views_viewer ON match_views(viewer_id);
CREATE INDEX idx_simulations_requester ON simulations(requester_id);
CREATE INDEX idx_actions_actor ON actions(actor_id);
CREATE INDEX idx_actions_target ON actions(target_id);
CREATE INDEX idx_messages_match ON messages(match_id, created_at);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Profiles : lecture publique (profils actifs), écriture propriétaire
CREATE POLICY "profiles_public_read" ON profiles
  FOR SELECT USING (is_active = TRUE AND is_complete = TRUE);
CREATE POLICY "profiles_own_write" ON profiles
  FOR ALL USING (auth.uid() = id);

-- Simulations : accès propriétaire uniquement
CREATE POLICY "simulations_own" ON simulations
  FOR ALL USING (auth.uid() = requester_id);

-- Actions : accès propriétaire
CREATE POLICY "actions_own" ON actions
  FOR ALL USING (auth.uid() = actor_id);

-- Matches : les deux parties
CREATE POLICY "matches_participants" ON matches
  FOR ALL USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Messages : participants du match
CREATE POLICY "messages_participants" ON messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = messages.match_id
      AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
  );

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Mise à jour automatique updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Création match mutuel automatique quand deux likes se croisent
CREATE OR REPLACE FUNCTION check_mutual_like()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.action_type IN ('like', 'superlike') THEN
    IF EXISTS (
      SELECT 1 FROM actions
      WHERE actor_id = NEW.target_id
      AND target_id = NEW.actor_id
      AND action_type IN ('like', 'superlike')
    ) THEN
      INSERT INTO matches (user1_id, user2_id)
      VALUES (LEAST(NEW.actor_id, NEW.target_id), GREATEST(NEW.actor_id, NEW.target_id))
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_match
  AFTER INSERT ON actions
  FOR EACH ROW EXECUTE FUNCTION check_mutual_like();

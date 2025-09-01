-- Data Snack v3 Database Schema
-- PostgreSQL with Supabase Extensions

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "timescaledb";

-- Users table with GDPR compliance
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fingerprint_hash TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Consent management (GDPR)
  consent_version INTEGER NOT NULL DEFAULT 1,
  consent_categories JSONB NOT NULL DEFAULT '{
    "necessary": true,
    "analytics": false,
    "marketing": false,
    "personalization": false
  }'::jsonb,
  consent_granted_at TIMESTAMPTZ,
  consent_ip_address INET,
  
  -- GDPR rights
  data_retention_days INTEGER DEFAULT 90,
  deletion_requested_at TIMESTAMPTZ,
  anonymized_at TIMESTAMPTZ,
  data_export_requested_at TIMESTAMPTZ,
  last_export_at TIMESTAMPTZ,
  
  -- User profile
  personality_type TEXT,
  total_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  achievements JSONB DEFAULT '[]'::jsonb,
  market_value DECIMAL(10, 2),
  
  -- Indexes
  CONSTRAINT users_fingerprint_hash_key UNIQUE (fingerprint_hash),
  CONSTRAINT users_level_positive CHECK (level > 0),
  CONSTRAINT users_xp_positive CHECK (total_xp >= 0)
);

-- Create indexes for users table
CREATE INDEX idx_users_fingerprint ON users (fingerprint_hash);
CREATE INDEX idx_users_created_at ON users (created_at DESC);
CREATE INDEX idx_users_consent ON users ((consent_categories->>'analytics'));
CREATE INDEX idx_users_deletion ON users (deletion_requested_at) WHERE deletion_requested_at IS NOT NULL;

-- Events table (will be converted to hypertable)
CREATE TABLE events (
  time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL,
  
  -- Event data
  event_type TEXT NOT NULL,
  event_name TEXT NOT NULL,
  properties JSONB DEFAULT '{}'::jsonb,
  context JSONB DEFAULT '{}'::jsonb,
  
  -- Metadata
  server_timestamp TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  
  -- Privacy flags
  is_anonymous BOOLEAN DEFAULT FALSE,
  consent_state JSONB,
  
  PRIMARY KEY (time, id)
);

-- Convert to TimescaleDB hypertable (automatic partitioning by time)
SELECT create_hypertable('events', 'time', if_not_exists => TRUE);

-- Create indexes for events table
CREATE INDEX idx_events_user_time ON events (user_id, time DESC);
CREATE INDEX idx_events_session ON events (session_id);
CREATE INDEX idx_events_type ON events (event_type, time DESC);
CREATE INDEX idx_events_name ON events (event_name, time DESC);
CREATE INDEX idx_events_anonymous ON events (is_anonymous) WHERE is_anonymous = TRUE;

-- Snack sessions table
CREATE TABLE snack_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  snack_id TEXT NOT NULL,
  snack_version TEXT NOT NULL DEFAULT '1.0.0',
  
  -- Timing
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  abandoned_at TIMESTAMPTZ,
  duration_ms INTEGER,
  
  -- Data collection
  raw_data JSONB DEFAULT '{}'::jsonb,
  processed_data JSONB DEFAULT '{}'::jsonb,
  
  -- Results & Analysis
  personality_analysis JSONB,
  personality_type TEXT,
  market_value DECIMAL(10, 2),
  uniqueness_score DECIMAL(3, 2),
  confidence_score DECIMAL(3, 2),
  
  -- Gamification
  xp_awarded INTEGER DEFAULT 0,
  achievements_unlocked JSONB DEFAULT '[]'::jsonb,
  
  -- Sharing
  share_token TEXT UNIQUE,
  shared_at TIMESTAMPTZ,
  share_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT FALSE,
  
  -- Constraints
  CONSTRAINT snack_sessions_duration_positive CHECK (duration_ms > 0),
  CONSTRAINT snack_sessions_xp_positive CHECK (xp_awarded >= 0),
  CONSTRAINT snack_sessions_share_count_positive CHECK (share_count >= 0),
  CONSTRAINT snack_sessions_uniqueness_valid CHECK (uniqueness_score BETWEEN 0 AND 1),
  CONSTRAINT snack_sessions_confidence_valid CHECK (confidence_score BETWEEN 0 AND 1)
);

-- Indexes for snack_sessions
CREATE INDEX idx_snack_sessions_user ON snack_sessions (user_id);
CREATE INDEX idx_snack_sessions_snack ON snack_sessions (snack_id);
CREATE INDEX idx_snack_sessions_started ON snack_sessions (started_at DESC);
CREATE INDEX idx_snack_sessions_completed ON snack_sessions (completed_at DESC) WHERE completed_at IS NOT NULL;
CREATE INDEX idx_snack_sessions_share_token ON snack_sessions (share_token) WHERE share_token IS NOT NULL;

-- Achievements table
CREATE TABLE achievements (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 0,
  icon TEXT,
  requirements JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_secret BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT achievements_xp_positive CHECK (xp_reward >= 0)
);

-- User achievements (many-to-many)
CREATE TABLE user_achievements (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL REFERENCES achievements(id),
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  context JSONB DEFAULT '{}'::jsonb,
  
  PRIMARY KEY (user_id, achievement_id)
);

-- Create indexes for achievements
CREATE INDEX idx_user_achievements_user ON user_achievements (user_id);
CREATE INDEX idx_user_achievements_unlocked ON user_achievements (unlocked_at DESC);

-- Real-time analytics views
CREATE MATERIALIZED VIEW hourly_stats AS
SELECT 
  time_bucket('1 hour', time) as hour,
  event_type,
  COUNT(*) as event_count,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT session_id) as sessions,
  COUNT(*) FILTER (WHERE is_anonymous = TRUE) as anonymous_events
FROM events
WHERE time > NOW() - INTERVAL '7 days'
GROUP BY 1, 2
ORDER BY 1 DESC, 2;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX idx_hourly_stats_unique ON hourly_stats (hour, event_type);

-- Daily snack stats
CREATE MATERIALIZED VIEW daily_snack_stats AS
SELECT 
  DATE(started_at) as date,
  snack_id,
  COUNT(*) as sessions_started,
  COUNT(*) FILTER (WHERE completed_at IS NOT NULL) as sessions_completed,
  COUNT(*) FILTER (WHERE abandoned_at IS NOT NULL) as sessions_abandoned,
  AVG(duration_ms) FILTER (WHERE duration_ms IS NOT NULL) as avg_duration_ms,
  AVG(xp_awarded) as avg_xp_awarded,
  COUNT(*) FILTER (WHERE shared_at IS NOT NULL) as sessions_shared
FROM snack_sessions
WHERE started_at > NOW() - INTERVAL '30 days'
GROUP BY 1, 2
ORDER BY 1 DESC, 2;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX idx_daily_snack_stats_unique ON daily_snack_stats (date, snack_id);

-- Functions for automatic updates
CREATE OR REPLACE FUNCTION update_user_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users 
  SET 
    last_seen_at = NOW(),
    updated_at = NOW()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update last_seen_at on events
CREATE TRIGGER trigger_update_user_last_seen
  AFTER INSERT ON events
  FOR EACH ROW
  WHEN (NEW.user_id IS NOT NULL)
  EXECUTE FUNCTION update_user_last_seen();

-- Function to anonymize user data
CREATE OR REPLACE FUNCTION anonymize_user_data(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  -- Anonymize user record
  UPDATE users 
  SET 
    fingerprint_hash = 'anonymized-' || user_uuid::text,
    consent_ip_address = NULL,
    anonymized_at = NOW()
  WHERE id = user_uuid;
  
  -- Anonymize events
  UPDATE events 
  SET 
    user_id = NULL,
    ip_address = NULL,
    user_agent = SPLIT_PART(user_agent, ' ', 1), -- Keep only browser name
    is_anonymous = TRUE
  WHERE user_id = user_uuid;
  
  -- Keep snack sessions but remove personal data
  UPDATE snack_sessions
  SET 
    raw_data = raw_data - 'personal_info',
    processed_data = processed_data - 'personal_info'
  WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate XP level
CREATE OR REPLACE FUNCTION calculate_level(xp INTEGER)
RETURNS INTEGER AS $$
BEGIN
  RETURN FLOOR(xp / 1000.0) + 1;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY hourly_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY daily_snack_stats;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE snack_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own data
CREATE POLICY users_own_data ON users
  FOR ALL USING (auth.uid() = id::text);

-- Policy: Events are accessible based on user consent
CREATE POLICY events_own_data ON events
  FOR ALL USING (
    auth.uid() = user_id::text 
    OR is_anonymous = TRUE
  );

-- Policy: Snack sessions are accessible by owner
CREATE POLICY snack_sessions_own_data ON snack_sessions
  FOR ALL USING (
    auth.uid() = user_id::text 
    OR (is_public = TRUE AND share_token IS NOT NULL)
  );

-- Policy: User achievements are accessible by owner
CREATE POLICY user_achievements_own_data ON user_achievements
  FOR ALL USING (auth.uid() = user_id::text);

-- Insert default achievements
INSERT INTO achievements (id, name, description, category, xp_reward, icon) VALUES
('first-snack', 'First Bite', 'Complete your first Data Snack', 'beginner', 100, '🍪'),
('privacy-aware', 'Privacy Ninja', 'Complete the Privacy Leak Detector', 'privacy', 250, '🥷'),
('click-master', 'Click Master', 'Analyze your clicking patterns', 'behavioral', 200, '🖱️'),
('scroll-guru', 'Scroll Sage', 'Master the art of scrolling', 'behavioral', 200, '📜'),
('consent-hero', 'Transparency Hero', 'Grant full analytics consent', 'privacy', 150, '🛡️'),
('social-sharer', 'Data Evangelist', 'Share 5 snack results', 'social', 300, '📢'),
('high-value', 'Digital Gold', 'Reach €10,000+ market value', 'achievement', 500, '💰'),
('level-up', 'Level Master', 'Reach Level 5', 'progression', 1000, '⭐'),
('completionist', 'Snack Collector', 'Complete all available snacks', 'completion', 750, '🏆'),
('unique-fingerprint', 'Digital Ghost', 'Achieve 95%+ uniqueness score', 'privacy', 400, '👻');

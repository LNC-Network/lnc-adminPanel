-- Create web analytics tables

-- Page views tracking
CREATE TABLE IF NOT EXISTS web_analytics_pageviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path TEXT NOT NULL,
  page_title TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_address TEXT,
  country TEXT,
  city TEXT,
  device_type TEXT, -- mobile, desktop, tablet
  browser TEXT,
  os TEXT,
  session_id TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  duration INTEGER, -- time spent on page in seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Visitor sessions
CREATE TABLE IF NOT EXISTS web_analytics_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address TEXT,
  country TEXT,
  city TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  landing_page TEXT,
  exit_page TEXT,
  page_count INTEGER DEFAULT 1,
  total_duration INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Performance metrics
CREATE TABLE IF NOT EXISTS web_analytics_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path TEXT NOT NULL,
  load_time INTEGER, -- in milliseconds
  ttfb INTEGER, -- time to first byte
  fcp INTEGER, -- first contentful paint
  lcp INTEGER, -- largest contentful paint
  fid INTEGER, -- first input delay
  cls DECIMAL(10, 4), -- cumulative layout shift
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Custom events tracking
CREATE TABLE IF NOT EXISTS web_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  event_data JSONB,
  page_path TEXT,
  session_id TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_pageviews_created_at ON web_analytics_pageviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pageviews_page_path ON web_analytics_pageviews(page_path);
CREATE INDEX IF NOT EXISTS idx_pageviews_country ON web_analytics_pageviews(country);
CREATE INDEX IF NOT EXISTS idx_pageviews_session ON web_analytics_pageviews(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON web_analytics_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON web_analytics_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_performance_page_path ON web_analytics_performance(page_path);
CREATE INDEX IF NOT EXISTS idx_performance_created_at ON web_analytics_performance(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_event_name ON web_analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON web_analytics_events(created_at DESC);

-- Enable RLS
ALTER TABLE web_analytics_pageviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_analytics_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_analytics_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_analytics_events ENABLE ROW LEVEL SECURITY;

-- Policies (allow service role to manage, users can only read their own data)
CREATE POLICY "Service role can manage pageviews"
  ON web_analytics_pageviews
  FOR ALL
  USING (true);

CREATE POLICY "Service role can manage sessions"
  ON web_analytics_sessions
  FOR ALL
  USING (true);

CREATE POLICY "Service role can manage performance"
  ON web_analytics_performance
  FOR ALL
  USING (true);

CREATE POLICY "Service role can manage events"
  ON web_analytics_events
  FOR ALL
  USING (true);

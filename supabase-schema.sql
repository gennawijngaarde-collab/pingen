-- ==========================================
-- PinGen - Supabase Database Schema
-- ==========================================

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- ==========================================
-- PROFILES TABLE
-- ==========================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  plan TEXT DEFAULT 'starter' CHECK (plan IN ('starter', 'pro', 'business')),
  pins_created_this_month INTEGER DEFAULT 0,
  pinterest_accounts_connected INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- PINS TABLE
-- ==========================================
CREATE TABLE pins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  link TEXT,
  board_id TEXT,
  board_name TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  pinterest_pin_id TEXT,
  hashtags TEXT[] DEFAULT '{}',
  alt_text TEXT,
  retry_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE pins ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own pins"
  ON pins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own pins"
  ON pins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pins"
  ON pins FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own pins"
  ON pins FOR DELETE
  USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_pins_user_id ON pins(user_id);
CREATE INDEX idx_pins_status ON pins(status);
CREATE INDEX idx_pins_scheduled_at ON pins(scheduled_at);

-- ==========================================
-- PINTEREST ACCOUNTS TABLE
-- ==========================================
CREATE TABLE pinterest_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pinterest_user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  profile_image TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  boards JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE pinterest_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own pinterest accounts"
  ON pinterest_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own pinterest accounts"
  ON pinterest_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pinterest accounts"
  ON pinterest_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own pinterest accounts"
  ON pinterest_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- Index
CREATE INDEX idx_pinterest_accounts_user_id ON pinterest_accounts(user_id);

-- ==========================================
-- SUBSCRIPTIONS TABLE
-- ==========================================
CREATE TABLE subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan TEXT DEFAULT 'starter' CHECK (plan IN ('starter', 'pro', 'business')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- ==========================================
-- PIN ANALYTICS TABLE
-- ==========================================
CREATE TABLE pin_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pin_id UUID REFERENCES pins(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  impressions INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  closeups INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE pin_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own analytics"
  ON pin_analytics FOR SELECT
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_pin_analytics_user_id ON pin_analytics(user_id);
CREATE INDEX idx_pin_analytics_pin_id ON pin_analytics(pin_id);
CREATE INDEX idx_pin_analytics_date ON pin_analytics(date);

-- ==========================================
-- SCHEDULED JOBS TABLE (for cron jobs)
-- ==========================================
CREATE TABLE scheduled_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  executed_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE scheduled_jobs ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- FUNCTIONS
-- ==========================================

-- Function to reset monthly pin count
CREATE OR REPLACE FUNCTION reset_monthly_pin_count()
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET pins_created_this_month = 0,
      updated_at = NOW()
  WHERE plan != 'business';
END;
$$ LANGUAGE plpgsql;

-- Function to increment pin count
CREATE OR REPLACE FUNCTION increment_pin_count(user_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET pins_created_this_month = pins_created_this_month + 1,
      updated_at = NOW()
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to check pin limit
CREATE OR REPLACE FUNCTION check_pin_limit(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_plan TEXT;
  pin_count INTEGER;
  pin_limit INTEGER;
BEGIN
  SELECT plan, pins_created_this_month INTO user_plan, pin_count
  FROM profiles
  WHERE id = user_uuid;
  
  pin_limit := CASE user_plan
    WHEN 'starter' THEN 10
    WHEN 'pro' THEN 100
    WHEN 'business' THEN 999999
    ELSE 10
  END;
  
  RETURN pin_count < pin_limit;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- VIEWS
-- ==========================================

-- View for user dashboard stats
CREATE VIEW user_dashboard_stats AS
SELECT 
  p.id as user_id,
  p.plan,
  p.pins_created_this_month,
  COUNT(DISTINCT pins.id) as total_pins,
  COUNT(DISTINCT CASE WHEN pins.status = 'published' THEN pins.id END) as published_pins,
  COUNT(DISTINCT CASE WHEN pins.status = 'scheduled' THEN pins.id END) as scheduled_pins,
  COUNT(DISTINCT CASE WHEN pins.status = 'draft' THEN pins.id END) as draft_pins,
  COUNT(DISTINCT pa.id) as connected_accounts
FROM profiles p
LEFT JOIN pins ON pins.user_id = p.id
LEFT JOIN pinterest_accounts pa ON pa.user_id = p.id
GROUP BY p.id, p.plan, p.pins_created_this_month;

-- ==========================================
-- SEED DATA (Optional)
-- ==========================================

-- Insert test user (for development only)
-- INSERT INTO auth.users (id, email, raw_user_meta_data)
-- VALUES (
--   '00000000-0000-0000-0000-000000000000',
--   'test@example.com',
--   '{"full_name": "Test User"}'::jsonb
-- );

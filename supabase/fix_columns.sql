-- ================================================================
--  StoneVision AI — Column Fixes
--  Run this in Supabase SQL Editor if you get column errors
--  Safe to run multiple times (uses IF NOT EXISTS)
-- ================================================================

-- Fix companies table - add any missing columns
ALTER TABLE companies ADD COLUMN IF NOT EXISTS gst_number TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS gstin TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS subdomain TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- Fix user_profiles table
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'owner';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_superadmin BOOLEAN DEFAULT FALSE;

-- Fix subscriptions table
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS plan_id TEXT DEFAULT 'trial';
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS price_paid_inr INTEGER DEFAULT 0;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS payment_mode TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS activated_by_uid UUID;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS addon_branding BOOLEAN DEFAULT FALSE;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS addon_trust_gallery BOOLEAN DEFAULT FALSE;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS addon_api_access BOOLEAN DEFAULT FALSE;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS is_founder BOOLEAN DEFAULT FALSE;

-- Fix stones table  
ALTER TABLE stones ADD COLUMN IF NOT EXISTS scan_code TEXT;
ALTER TABLE stones ADD COLUMN IF NOT EXISTS variety_reasoning TEXT;
ALTER TABLE stones ADD COLUMN IF NOT EXISTS reference_stick_ok BOOLEAN DEFAULT TRUE;
ALTER TABLE stones ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;
ALTER TABLE stones ADD COLUMN IF NOT EXISTS public_link TEXT;
ALTER TABLE stones ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE stones ADD COLUMN IF NOT EXISTS catalog_pdf_url TEXT;

-- Create plans table if not exists
CREATE TABLE IF NOT EXISTS plans (
  id           TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  price_inr    INTEGER NOT NULL,
  founder_price INTEGER,
  scans_per_month INTEGER NOT NULL,
  max_users    INTEGER DEFAULT 1,
  features     TEXT[],
  sort_order   INTEGER DEFAULT 0
);

-- Insert plans if not exist
INSERT INTO plans VALUES
  ('trial',   'Free Trial',   0,     NULL,  100,  1,  ARRAY['100 scans','PDF export','WhatsApp share'], 0),
  ('basic',   'Basic',        10000, 5000,  200,  2,  ARRAY['200 scans/mo','PDF + WhatsApp','2 users'], 1),
  ('elite',   'Elite',        20000, 10000, 500,  5,  ARRAY['500 scans/mo','5 users','Buyer portal'], 2),
  ('premium', 'Premium',      30000, 15000, 1500, 10, ARRAY['1500 scans/mo','10 users','Custom branding'], 3),
  ('ultra',   'Ultra',        50000, 25000, -1,   25, ARRAY['Unlimited scans','25 users','White-label'], 4)
ON CONFLICT (id) DO NOTHING;

-- Recreate security helpers
CREATE OR REPLACE FUNCTION my_company_id()
RETURNS UUID LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT company_id FROM user_profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT COALESCE(is_superadmin, FALSE) FROM user_profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION is_buyer()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT role = 'buyer' FROM user_profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Auto-create trial on company signup
CREATE OR REPLACE FUNCTION auto_create_trial()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO subscriptions (
    company_id, plan_id, scans_limit, scans_used,
    trial_starts_at, trial_ends_at, is_active
  ) VALUES (
    NEW.id, 'trial', 100, 0,
    NOW(), NOW() + INTERVAL '30 days', TRUE
  ) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_trial ON companies;
CREATE TRIGGER trg_auto_trial
  AFTER INSERT ON companies
  FOR EACH ROW EXECUTE FUNCTION auto_create_trial();

-- ================================================================
--  AFTER RUNNING THIS:
--  Make yourself superadmin (replace with your email):
--
--  UPDATE user_profiles
--  SET is_superadmin = TRUE
--  WHERE id = (SELECT id FROM auth.users WHERE email = 'YOUR@EMAIL.COM');
-- ================================================================


-- MODULE 1: Supplier invitation tracking table
CREATE TABLE IF NOT EXISTS supplier_invites (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token            TEXT UNIQUE NOT NULL,
  exporter_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  exporter_name    TEXT,
  supplier_company TEXT NOT NULL,
  contact_person   TEXT NOT NULL,
  email            TEXT NOT NULL,
  whatsapp         TEXT NOT NULL,
  audit_type       TEXT NOT NULL,
  audit_type_label TEXT,
  notes            TEXT,
  status           TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','scheduled','completed','expired')),
  expires_at       TIMESTAMPTZ NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invites_token    ON supplier_invites(token);
CREATE INDEX IF NOT EXISTS idx_invites_exporter ON supplier_invites(exporter_id);
CREATE INDEX IF NOT EXISTS idx_invites_status   ON supplier_invites(status, expires_at);

-- Enable RLS on invites
ALTER TABLE supplier_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invite_owner_access" ON supplier_invites
  FOR ALL USING (exporter_id = my_company_id() OR is_superadmin());

-- Public read for token verification (no auth needed for supplier to verify)
CREATE POLICY "invite_public_verify" ON supplier_invites
  FOR SELECT USING (status = 'pending' AND expires_at > NOW());

-- ================================================================
--  StoneVision AI — Supabase Migration v4.0 FINAL
--  5-Tier Pricing · 100-scan Trial · Admin Panel
--  Founder Discount · Add-ons · Payment Activation
--
--  Run in Supabase Dashboard → SQL Editor → Run All
-- ================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── 1. COMPANIES ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS companies (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  owner_email     TEXT NOT NULL UNIQUE,
  whatsapp        TEXT,
  city            TEXT DEFAULT 'Melur',
  state           TEXT DEFAULT 'Tamil Nadu',
  gstin           TEXT,
  is_verified     BOOLEAN DEFAULT FALSE,   -- StoneVision Certified badge
  logo_url        TEXT,
  subdomain       TEXT UNIQUE,             -- aryan-granites.stonevision.in
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. PLANS reference table ────────────────────────────────
CREATE TABLE IF NOT EXISTS plans (
  id              TEXT PRIMARY KEY,        -- 'trial','basic','elite','premium','ultra'
  display_name    TEXT NOT NULL,
  price_inr       INTEGER NOT NULL,        -- full price
  founder_price   INTEGER,                 -- 50% discount price
  scans_per_month INTEGER NOT NULL,        -- -1 = unlimited
  max_users       INTEGER DEFAULT 1,
  features        TEXT[],
  sort_order      INTEGER DEFAULT 0
);

INSERT INTO plans VALUES
  ('trial',   'Free Trial',   0,     NULL,  100,  1,  ARRAY['100 scans','PDF export','WhatsApp share'], 0),
  ('basic',   'Basic',        10000, 5000,  200,  2,  ARRAY['200 scans/mo','PDF + WhatsApp','2 users','Email support'], 1),
  ('elite',   'Elite',        20000, 10000, 500,  5,  ARRAY['500 scans/mo','5 users','Buyer portal','Priority support'], 2),
  ('premium', 'Premium',      30000, 15000, 1500, 10, ARRAY['1500 scans/mo','10 users','Custom branding','API access'], 3),
  ('ultra',   'Ultra',        50000, 25000, -1,   25, ARRAY['Unlimited scans','25 users','White-label','Dedicated manager'], 4)
ON CONFLICT (id) DO NOTHING;

-- ── 3. SUBSCRIPTIONS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id        UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
  plan_id           TEXT NOT NULL DEFAULT 'trial' REFERENCES plans(id),
  is_founder        BOOLEAN DEFAULT FALSE,     -- 50% lifetime discount applied
  price_paid_inr    INTEGER DEFAULT 0,         -- actual amount paid
  scans_limit       INTEGER DEFAULT 100,       -- copied from plan at activation
  scans_used        INTEGER DEFAULT 0,
  trial_starts_at   TIMESTAMPTZ DEFAULT NOW(),
  trial_ends_at     TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  billing_starts_at TIMESTAMPTZ,
  billing_ends_at   TIMESTAMPTZ,
  is_active         BOOLEAN DEFAULT TRUE,
  payment_ref       TEXT,                      -- UPI/bank TXN ID
  payment_mode      TEXT,                      -- 'upi','bank','cash','cheque'
  activated_by_uid  UUID,                      -- superadmin uid
  activated_at      TIMESTAMPTZ,
  notes             TEXT,
  -- Add-ons (can be activated independently)
  addon_branding    BOOLEAN DEFAULT FALSE,     -- Custom PDF branding ₹2000/mo
  addon_trust_gallery BOOLEAN DEFAULT FALSE,  -- Public trust gallery ₹1500/mo
  addon_api_access  BOOLEAN DEFAULT FALSE,    -- API key access ₹5000/mo
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. STONES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stones (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id             UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  scan_code              TEXT UNIQUE DEFAULT 'SV-' || UPPER(SUBSTR(MD5(RANDOM()::TEXT),1,8)),
  variety                TEXT,
  variety_confidence     NUMERIC(5,2) CHECK (variety_confidence IS NULL OR (variety_confidence >= 0 AND variety_confidence <= 100)),
  variety_reasoning      TEXT,
  length_cm              NUMERIC(8,2) CHECK (length_cm IS NULL OR length_cm > 0),
  width_cm               NUMERIC(8,2) CHECK (width_cm IS NULL OR width_cm > 0),
  height_cm              NUMERIC(8,2) CHECK (height_cm IS NULL OR height_cm > 0),
  volume_m3              NUMERIC(10,4) GENERATED ALWAYS AS
                           (CASE WHEN length_cm IS NOT NULL AND width_cm IS NOT NULL AND height_cm IS NOT NULL
                            THEN ROUND((length_cm * width_cm * height_cm / 1000000)::NUMERIC, 4)
                            ELSE NULL END) STORED,
  volume_cft             NUMERIC(10,4) GENERATED ALWAYS AS
                           (CASE WHEN length_cm IS NOT NULL AND width_cm IS NOT NULL AND height_cm IS NOT NULL
                            THEN ROUND((length_cm * width_cm * height_cm / 1000000 * 35.3147)::NUMERIC, 4)
                            ELSE NULL END) STORED,
  measurement_confidence NUMERIC(5,2) CHECK (measurement_confidence IS NULL OR (measurement_confidence >= 0 AND measurement_confidence <= 100)),
  quality_grade          TEXT CHECK (quality_grade IN ('A1','A2','B1','B2')),
  quality_notes          TEXT,
  estimated_weight_kg    INTEGER CHECK (estimated_weight_kg IS NULL OR estimated_weight_kg > 0),
  value_per_cft_inr      INTEGER CHECK (value_per_cft_inr IS NULL OR value_per_cft_inr > 0),
  total_value_inr        INTEGER CHECK (total_value_inr IS NULL OR total_value_inr > 0),
  export_markets         TEXT[] DEFAULT '{}',
  image_url              TEXT,
  catalog_pdf_url        TEXT,
  public_link            TEXT,
  ai_flags               TEXT[] DEFAULT '{}',
  reference_stick_ok     BOOLEAN DEFAULT TRUE,
  scanned_at             TIMESTAMPTZ DEFAULT NOW(),
  scanned_by             UUID REFERENCES auth.users(id),
  is_archived            BOOLEAN DEFAULT FALSE
);

-- ── 5. USER PROFILES ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id    UUID REFERENCES companies(id) ON DELETE CASCADE,
  full_name     TEXT,
  role          TEXT DEFAULT 'member' CHECK (role IN ('owner','member')),
  is_superadmin BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── 6. PAYMENT LOGS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payment_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  amount_inr      INTEGER NOT NULL CHECK (amount_inr > 0),
  plan_id         TEXT REFERENCES plans(id),
  is_founder      BOOLEAN DEFAULT FALSE,
  months          INTEGER DEFAULT 1 CHECK (months > 0),
  payment_ref     TEXT,
  payment_mode    TEXT CHECK (payment_mode IN ('upi','bank_transfer','cash','cheque','razorpay','other')),
  addon           TEXT,                  -- if payment is for an add-on
  notes           TEXT,
  recorded_by     UUID,
  recorded_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── 7. SHARE EVENTS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS share_events (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stone_id    UUID NOT NULL REFERENCES stones(id) ON DELETE CASCADE,
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  channel     TEXT CHECK (channel IN ('whatsapp','email','link','pdf')),
  shared_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
--  ROW LEVEL SECURITY
-- ================================================================
ALTER TABLE companies     ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stones        ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_logs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_events  ENABLE ROW LEVEL SECURITY;

-- Security helpers
CREATE OR REPLACE FUNCTION my_company_id()
RETURNS UUID LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT company_id FROM user_profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT COALESCE(is_superadmin, FALSE) FROM user_profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Policies
DROP POLICY IF EXISTS "own_company"    ON companies;
DROP POLICY IF EXISTS "own_sub"        ON subscriptions;
DROP POLICY IF EXISTS "own_stones"     ON stones;
DROP POLICY IF EXISTS "public_catalog" ON stones;
DROP POLICY IF EXISTS "own_profile"    ON user_profiles;
DROP POLICY IF EXISTS "admin_payments" ON payment_logs;
DROP POLICY IF EXISTS "own_shares"     ON share_events;

CREATE POLICY "own_company"    ON companies     FOR ALL USING (id = my_company_id() OR is_superadmin());
CREATE POLICY "own_sub"        ON subscriptions FOR ALL USING (company_id = my_company_id() OR is_superadmin());
CREATE POLICY "own_stones"     ON stones        FOR ALL USING (company_id = my_company_id() OR is_superadmin());
CREATE POLICY "public_catalog" ON stones        FOR SELECT USING (public_link IS NOT NULL);
CREATE POLICY "own_profile"    ON user_profiles FOR ALL USING (id = auth.uid() OR is_superadmin());
CREATE POLICY "admin_payments" ON payment_logs  FOR ALL USING (is_superadmin());
CREATE POLICY "own_shares"     ON share_events  FOR ALL USING (company_id = my_company_id() OR is_superadmin());

-- ================================================================
--  SCAN GATE — Atomic check + increment (no race conditions)
-- ================================================================
CREATE OR REPLACE FUNCTION check_scan_eligibility(p_company_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  sub       subscriptions%ROWTYPE;
  remaining INTEGER;
BEGIN
  -- Lock the row to prevent race conditions
  SELECT * INTO sub FROM subscriptions
  WHERE company_id = p_company_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN '{"allowed":false,"reason":"No subscription found"}'::JSONB;
  END IF;

  IF NOT sub.is_active THEN
    RETURN jsonb_build_object('allowed',false,'reason','Account inactive — contact support@stonevision.in');
  END IF;

  IF sub.plan_id = 'trial' AND NOW() > sub.trial_ends_at THEN
    UPDATE subscriptions SET is_active=FALSE, updated_at=NOW() WHERE company_id=p_company_id;
    RETURN '{"allowed":false,"reason":"Trial expired — contact us to activate your plan","upgrade":true}'::JSONB;
  END IF;

  IF sub.scans_limit != -1 AND sub.scans_used >= sub.scans_limit THEN
    RETURN jsonb_build_object(
      'allowed',false,'upgrade',true,
      'reason', format('Scan limit reached (%s/%s) — upgrade to continue', sub.scans_used, sub.scans_limit)
    );
  END IF;

  IF sub.plan_id != 'trial' AND sub.billing_ends_at IS NOT NULL AND NOW() > sub.billing_ends_at THEN
    UPDATE subscriptions SET is_active=FALSE, updated_at=NOW() WHERE company_id=p_company_id;
    RETURN '{"allowed":false,"reason":"Subscription expired — renew to continue","upgrade":true}'::JSONB;
  END IF;

  -- All clear — increment atomically
  UPDATE subscriptions SET scans_used=scans_used+1, updated_at=NOW() WHERE company_id=p_company_id;

  remaining := CASE WHEN sub.scans_limit = -1 THEN -1 ELSE sub.scans_limit - sub.scans_used - 1 END;

  RETURN jsonb_build_object(
    'allowed',true,
    'plan',sub.plan_id,
    'scans_used',sub.scans_used+1,
    'scans_limit',sub.scans_limit,
    'scans_remaining',remaining,
    'show_upgrade_at',CASE WHEN sub.scans_limit != -1 THEN sub.scans_limit - 20 ELSE -1 END,
    'trial_ends_at',sub.trial_ends_at,
    'addon_branding',sub.addon_branding,
    'addon_trust_gallery',sub.addon_trust_gallery
  );
END;
$$;

-- ================================================================
--  ADMIN: ACTIVATE PLAN AFTER PAYMENT RECEIVED
--  Run in Supabase SQL Editor after receiving UPI/bank payment
--
--  Example:
--  SELECT admin_activate_plan(
--    'company-uuid-here',
--    'elite',        -- plan id
--    10000,          -- amount paid in INR
--    FALSE,          -- is founder discount?
--    1,              -- months
--    'UPI-TXN-98765', -- payment reference
--    'upi',          -- payment mode
--    'GPay received 18 May 2025'  -- your notes
--  );
-- ================================================================
CREATE OR REPLACE FUNCTION admin_activate_plan(
  p_company_id  UUID,
  p_plan_id     TEXT,
  p_amount_inr  INTEGER,
  p_is_founder  BOOLEAN DEFAULT FALSE,
  p_months      INTEGER DEFAULT 1,
  p_payment_ref TEXT    DEFAULT NULL,
  p_pay_mode    TEXT    DEFAULT 'upi',
  p_notes       TEXT    DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  plan_rec    plans%ROWTYPE;
  comp_name   TEXT;
  billing_end TIMESTAMPTZ;
BEGIN
  IF NOT is_superadmin() THEN
    RETURN '{"success":false,"error":"Unauthorized — superadmin only"}'::JSONB;
  END IF;

  SELECT * INTO plan_rec FROM plans WHERE id = p_plan_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success',false,'error','Unknown plan: ' || p_plan_id);
  END IF;

  billing_end := NOW() + (p_months || ' months')::INTERVAL;

  UPDATE subscriptions SET
    plan_id           = p_plan_id,
    is_founder        = p_is_founder,
    price_paid_inr    = p_amount_inr,
    scans_limit       = plan_rec.scans_per_month,
    scans_used        = 0,
    billing_starts_at = NOW(),
    billing_ends_at   = billing_end,
    is_active         = TRUE,
    payment_ref       = p_payment_ref,
    payment_mode      = p_pay_mode,
    activated_by_uid  = auth.uid(),
    activated_at      = NOW(),
    notes             = p_notes,
    updated_at        = NOW()
  WHERE company_id = p_company_id;

  -- Log it
  INSERT INTO payment_logs(company_id,amount_inr,plan_id,is_founder,months,payment_ref,payment_mode,notes,recorded_by)
  VALUES(p_company_id,p_amount_inr,p_plan_id,p_is_founder,p_months,p_payment_ref,p_pay_mode,p_notes,auth.uid());

  SELECT name INTO comp_name FROM companies WHERE id = p_company_id;

  RETURN jsonb_build_object(
    'success',true,
    'company',comp_name,
    'plan',p_plan_id,
    'scans_limit',plan_rec.scans_per_month,
    'billing_until',billing_end,
    'is_founder',p_is_founder,
    'payment_ref',p_payment_ref
  );
END;
$$;

-- ================================================================
--  ADMIN: ACTIVATE ADD-ON
-- ================================================================
CREATE OR REPLACE FUNCTION admin_activate_addon(
  p_company_id UUID,
  p_addon TEXT,        -- 'branding' | 'trust_gallery' | 'api_access'
  p_amount_inr INTEGER DEFAULT 0,
  p_payment_ref TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT is_superadmin() THEN
    RETURN '{"success":false,"error":"Unauthorized"}'::JSONB;
  END IF;

  CASE p_addon
    WHEN 'branding'      THEN UPDATE subscriptions SET addon_branding=TRUE, updated_at=NOW() WHERE company_id=p_company_id;
    WHEN 'trust_gallery' THEN UPDATE subscriptions SET addon_trust_gallery=TRUE, updated_at=NOW() WHERE company_id=p_company_id;
    WHEN 'api_access'    THEN UPDATE subscriptions SET addon_api_access=TRUE, updated_at=NOW() WHERE company_id=p_company_id;
    ELSE RETURN jsonb_build_object('success',false,'error','Unknown addon: '||p_addon);
  END CASE;

  INSERT INTO payment_logs(company_id,amount_inr,addon,payment_ref,notes,recorded_by)
  VALUES(p_company_id,p_amount_inr,p_addon,p_payment_ref,p_notes,auth.uid());

  RETURN jsonb_build_object('success',true,'addon',p_addon,'company_id',p_company_id);
END;
$$;

-- ================================================================
--  ADMIN: SUSPEND / REINSTATE
-- ================================================================
CREATE OR REPLACE FUNCTION admin_suspend(p_company_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT is_superadmin() THEN RETURN '{"success":false,"error":"Unauthorized"}'::JSONB; END IF;
  UPDATE subscriptions SET is_active=FALSE, notes=p_reason, updated_at=NOW() WHERE company_id=p_company_id;
  RETURN '{"success":true,"action":"suspended"}'::JSONB;
END;
$$;

CREATE OR REPLACE FUNCTION admin_reinstate(p_company_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT is_superadmin() THEN RETURN '{"success":false,"error":"Unauthorized"}'::JSONB; END IF;
  UPDATE subscriptions SET is_active=TRUE, updated_at=NOW() WHERE company_id=p_company_id;
  RETURN '{"success":true,"action":"reinstated"}'::JSONB;
END;
$$;

-- ================================================================
--  ADMIN: FULL COMPANY LIST WITH STATUS
-- ================================================================
CREATE OR REPLACE FUNCTION admin_list_companies()
RETURNS TABLE (
  company_id   UUID, name TEXT, owner_email TEXT, whatsapp TEXT, city TEXT,
  plan_id TEXT, display_name TEXT, is_active BOOLEAN, is_founder BOOLEAN,
  scans_used INTEGER, scans_limit INTEGER, usage_pct NUMERIC,
  trial_ends TIMESTAMPTZ, billing_ends TIMESTAMPTZ,
  payment_ref TEXT, payment_mode TEXT, notes TEXT,
  addon_branding BOOLEAN, addon_trust_gallery BOOLEAN, addon_api_access BOOLEAN,
  joined TIMESTAMPTZ
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT is_superadmin() THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  RETURN QUERY
    SELECT c.id, c.name, c.owner_email, c.whatsapp, c.city,
      s.plan_id, p.display_name, s.is_active, s.is_founder,
      s.scans_used, s.scans_limit,
      CASE WHEN s.scans_limit <= 0 THEN 0::NUMERIC
           ELSE ROUND((s.scans_used::NUMERIC/s.scans_limit)*100, 1) END,
      s.trial_ends_at, s.billing_ends_at,
      s.payment_ref, s.payment_mode, s.notes,
      s.addon_branding, s.addon_trust_gallery, s.addon_api_access,
      c.created_at
    FROM companies c
    LEFT JOIN subscriptions s ON s.company_id = c.id
    LEFT JOIN plans p ON p.id = s.plan_id
    ORDER BY c.created_at DESC;
END;
$$;

-- ================================================================
--  AUTO-TRIGGER: Create 100-scan trial on company signup
-- ================================================================
CREATE OR REPLACE FUNCTION auto_create_trial()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO subscriptions(company_id, plan_id, scans_limit, scans_used, trial_starts_at, trial_ends_at, is_active)
  VALUES(NEW.id, 'trial', 100, 0, NOW(), NOW() + INTERVAL '30 days', TRUE);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_trial ON companies;
CREATE TRIGGER trg_auto_trial AFTER INSERT ON companies FOR EACH ROW EXECUTE FUNCTION auto_create_trial();

-- ================================================================
--  INDEXES
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_stones_company  ON stones(company_id, scanned_at DESC);
CREATE INDEX IF NOT EXISTS idx_stones_code     ON stones(scan_code);
CREATE INDEX IF NOT EXISTS idx_stones_active   ON stones(company_id) WHERE is_archived = FALSE;
CREATE INDEX IF NOT EXISTS idx_subs_company    ON subscriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_subs_active     ON subscriptions(is_active, billing_ends_at);
CREATE INDEX IF NOT EXISTS idx_profiles_co     ON user_profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_admin           ON user_profiles(is_superadmin) WHERE is_superadmin=TRUE;
CREATE INDEX IF NOT EXISTS idx_payments_co     ON payment_logs(company_id, recorded_at DESC);

-- ================================================================
--  AFTER RUNNING THIS FILE:
--
--  1. Create your account in the app (sign in with Google)
--  2. Run this to make yourself superadmin (use your email):
--
--     UPDATE user_profiles
--     SET is_superadmin = TRUE
--     WHERE id = (SELECT id FROM auth.users WHERE email = 'YOUR@EMAIL.COM');
--
--  3. To activate a company after payment:
--
--     SELECT admin_activate_plan(
--       'COMPANY-UUID',   -- from admin_list_companies()
--       'elite',          -- plan: basic/elite/premium/ultra
--       10000,            -- amount paid INR
--       FALSE,            -- founder discount?
--       1,                -- months
--       'UPI-TXN-12345',  -- transaction ID
--       'upi',            -- payment mode
--       'GPay from Aryan Granites 18 May'
--     );
-- ================================================================

-- ================================================================
--  MIGRATION v4.1 — BUYER PORTAL EXTENSION
--  Run this AFTER the main migration_v4.sql
--  Adds: buyer role, manifests, invite tokens, buyer-supplier links
-- ================================================================

-- ── Extend user_profiles role to include buyer ─────────────────
-- Drop old constraint and re-add with buyer role
ALTER TABLE user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE user_profiles
  ADD CONSTRAINT user_profiles_role_check
  CHECK (role IN ('owner','member','buyer'));

-- ── buyer_supplier_links ────────────────────────────────────────
-- Links a foreign buyer account to one or more exporter companies
CREATE TABLE IF NOT EXISTS buyer_supplier_links (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_uid    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id   UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  invited_by   UUID REFERENCES auth.users(id),  -- which buyer sent the invite
  status       TEXT NOT NULL DEFAULT 'active'
                 CHECK (status IN ('pending','active','revoked')),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(buyer_uid, company_id)
);

-- ── invite_tokens ───────────────────────────────────────────────
-- Cryptographically unique one-time links to pull exporters in
CREATE TABLE IF NOT EXISTS invite_tokens (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token         TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_by    UUID NOT NULL REFERENCES auth.users(id),  -- buyer who created it
  target_email  TEXT,
  target_whatsapp TEXT,
  company_name_hint TEXT,  -- exporter name pre-filled
  used_by_company UUID REFERENCES companies(id),
  used_at       TIMESTAMPTZ,
  expires_at    TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── stone_manifests ─────────────────────────────────────────────
-- Verification workflow per stone per buyer relationship
CREATE TABLE IF NOT EXISTS stone_manifests (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stone_id             UUID NOT NULL REFERENCES stones(id) ON DELETE CASCADE,
  company_id           UUID NOT NULL REFERENCES companies(id),
  buyer_uid            UUID NOT NULL REFERENCES auth.users(id),
  -- Verification status workflow
  verification_status  TEXT NOT NULL DEFAULT 'pending_upload'
    CHECK (verification_status IN (
      'pending_upload',    -- exporter hasn't submitted yet
      'supplier_submitted',-- exporter submitted dimensions
      'buyer_verified',    -- buyer confirmed and locked
      'disputed'           -- buyer flagged a discrepancy
    )),
  -- Carrier / shipping data (filled by exporter)
  carrier_name         TEXT,
  container_number     TEXT,
  bill_of_lading       TEXT,
  vessel_name          TEXT,
  port_of_loading      TEXT DEFAULT 'Tuticorin (V.O.C. Port)',
  port_of_discharge    TEXT,
  etd                  DATE,  -- estimated departure
  eta                  DATE,  -- estimated arrival
  -- Verification actions
  verified_at          TIMESTAMPTZ,
  verified_by          UUID REFERENCES auth.users(id),
  dispute_reason       TEXT,
  disputed_at          TIMESTAMPTZ,
  -- Integrity (display-only hash — not tamper-proof, honest labelling)
  data_snapshot_hash   TEXT,  -- SHA-256 of stone data at submission time
  snapshot_taken_at    TIMESTAMPTZ,
  -- Notes
  exporter_notes       TEXT,
  buyer_notes          TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(stone_id, buyer_uid)
);

-- ── RLS ─────────────────────────────────────────────────────────
ALTER TABLE buyer_supplier_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_tokens         ENABLE ROW LEVEL SECURITY;
ALTER TABLE stone_manifests       ENABLE ROW LEVEL SECURITY;

-- Helper: is current user a buyer?
CREATE OR REPLACE FUNCTION is_buyer()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT role = 'buyer' FROM user_profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- buyer_supplier_links: buyer sees own links, exporter sees links to their company
CREATE POLICY "buyer_own_links"
  ON buyer_supplier_links FOR ALL
  USING (buyer_uid = auth.uid() OR company_id = my_company_id() OR is_superadmin());

-- invite_tokens: only creator sees their tokens, superadmin sees all
CREATE POLICY "own_invite_tokens"
  ON invite_tokens FOR ALL
  USING (created_by = auth.uid() OR is_superadmin());

-- stone_manifests: buyer sees manifests where they are the buyer,
--                 exporter sees manifests for their company
CREATE POLICY "manifest_access"
  ON stone_manifests FOR ALL
  USING (
    buyer_uid = auth.uid()           -- buyer sees their manifests
    OR company_id = my_company_id()  -- exporter sees their company's manifests
    OR is_superadmin()
  );

-- ── Indexes ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_links_buyer   ON buyer_supplier_links(buyer_uid);
CREATE INDEX IF NOT EXISTS idx_links_company ON buyer_supplier_links(company_id);
CREATE INDEX IF NOT EXISTS idx_manifests_buyer   ON stone_manifests(buyer_uid, verification_status);
CREATE INDEX IF NOT EXISTS idx_manifests_company ON stone_manifests(company_id, verification_status);
CREATE INDEX IF NOT EXISTS idx_tokens_token  ON invite_tokens(token);

-- ── Function: buyer submits verify ──────────────────────────────
CREATE OR REPLACE FUNCTION buyer_verify_manifest(p_manifest_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT is_buyer() THEN
    RETURN '{"success":false,"error":"Only buyers can verify"}'::JSONB;
  END IF;
  UPDATE stone_manifests SET
    verification_status = 'buyer_verified',
    verified_at = NOW(),
    verified_by = auth.uid(),
    updated_at  = NOW()
  WHERE id = p_manifest_id AND buyer_uid = auth.uid()
    AND verification_status = 'supplier_submitted';
  IF NOT FOUND THEN
    RETURN '{"success":false,"error":"Manifest not found or not in correct state"}'::JSONB;
  END IF;
  RETURN '{"success":true,"status":"buyer_verified"}'::JSONB;
END;
$$;

-- ── Function: buyer raises dispute ───────────────────────────────
CREATE OR REPLACE FUNCTION buyer_dispute_manifest(p_manifest_id UUID, p_reason TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT is_buyer() THEN
    RETURN '{"success":false,"error":"Only buyers can dispute"}'::JSONB;
  END IF;
  UPDATE stone_manifests SET
    verification_status = 'disputed',
    dispute_reason  = p_reason,
    disputed_at     = NOW(),
    updated_at      = NOW()
  WHERE id = p_manifest_id AND buyer_uid = auth.uid();
  IF NOT FOUND THEN
    RETURN '{"success":false,"error":"Manifest not found"}'::JSONB;
  END IF;
  RETURN '{"success":true,"status":"disputed"}'::JSONB;
END;
$$;

-- ── Function: create invite token (called by buyer) ──────────────
CREATE OR REPLACE FUNCTION create_invite_token(
  p_target_whatsapp TEXT DEFAULT NULL,
  p_target_email    TEXT DEFAULT NULL,
  p_company_hint    TEXT DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  tok TEXT;
BEGIN
  IF NOT is_buyer() THEN
    RETURN '{"success":false,"error":"Only buyers can create invite links"}'::JSONB;
  END IF;
  INSERT INTO invite_tokens(created_by, target_whatsapp, target_email, company_name_hint)
  VALUES (auth.uid(), p_target_whatsapp, p_target_email, p_company_hint)
  RETURNING token INTO tok;
  RETURN jsonb_build_object('success',true,'token',tok,
    'invite_url','https://stonevision.in/register?invite_token='||tok);
END;
$$;

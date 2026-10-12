-- Phase A directory schema. Booking, payment, payout and dispute tables arrive in Phase B.

CREATE TABLE IF NOT EXISTS vendors (
  id               SERIAL PRIMARY KEY,
  slug             TEXT NOT NULL UNIQUE,
  name             TEXT NOT NULL,
  name_am          TEXT,
  category         TEXT NOT NULL,
  look             TEXT NOT NULL DEFAULT 'classic',
  bio              TEXT NOT NULL DEFAULT '',
  bio_am           TEXT NOT NULL DEFAULT '',
  -- Template section answers keyed by section key: { "<key>": { "en": "...", "am": "..." } }
  sections         JSONB NOT NULL DEFAULT '{}',
  phone            TEXT NOT NULL,
  -- Vendors sign in with a link emailed here. Null for rows created before
  -- email login existed; required for every new signup.
  email            TEXT UNIQUE,
  telegram         TEXT,
  whatsapp         TEXT,
  starting_price   INTEGER,
  status           TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','hidden')),
  verified         BOOLEAN NOT NULL DEFAULT FALSE,
  verified_at      TIMESTAMPTZ,
  no_show_reports  INTEGER NOT NULL DEFAULT 0,
  admin_note       TEXT,
  manage_token     TEXT NOT NULL UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS vendors_category_idx ON vendors (category) WHERE status = 'approved';

CREATE TABLE IF NOT EXISTS packages (
  id           SERIAL PRIMARY KEY,
  vendor_id    INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  name_am      TEXT,
  inclusions   TEXT NOT NULL DEFAULT '',
  hours        NUMERIC(4,1),
  price        INTEGER NOT NULL,
  starting_from BOOLEAN NOT NULL DEFAULT FALSE,
  position     INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS packages_vendor_idx ON packages (vendor_id);

CREATE TABLE IF NOT EXISTS portfolio_items (
  id          SERIAL PRIMARY KEY,
  vendor_id   INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  section     TEXT NOT NULL,
  kind        TEXT NOT NULL CHECK (kind IN ('photo','video','audio')),
  url         TEXT NOT NULL,
  caption     TEXT,
  position    INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS portfolio_vendor_idx ON portfolio_items (vendor_id);

CREATE TABLE IF NOT EXISTS availability (
  vendor_id   INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  day         DATE NOT NULL,
  status      TEXT NOT NULL DEFAULT 'booked' CHECK (status IN ('booked')),
  PRIMARY KEY (vendor_id, day)
);

CREATE TABLE IF NOT EXISTS contact_events (
  id          SERIAL PRIMARY KEY,
  vendor_id   INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  channel     TEXT NOT NULL CHECK (channel IN ('call','telegram','whatsapp')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS contact_events_vendor_idx ON contact_events (vendor_id, created_at);

-- Daily counters behind vendor stats (views, searches appeared in).
CREATE TABLE IF NOT EXISTS vendor_daily_stats (
  vendor_id    INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  day          DATE NOT NULL,
  views        INTEGER NOT NULL DEFAULT 0,
  impressions  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (vendor_id, day)
);

CREATE TABLE IF NOT EXISTS reviews (
  id             SERIAL PRIMARY KEY,
  vendor_id      INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  reviewer_name  TEXT NOT NULL,
  reviewer_phone TEXT NOT NULL,
  event_type     TEXT,
  rating         INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body           TEXT NOT NULL,
  vendor_reply   TEXT,
  -- pending: waiting for moderation; flagged: vendor asked us to check it. Paying never removes a review.
  status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','published','flagged','removed')),
  flag_reason    TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS reviews_vendor_idx ON reviews (vendor_id, status);

CREATE TABLE IF NOT EXISTS subscriptions (
  id          SERIAL PRIMARY KEY,
  vendor_id   INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  plan        TEXT NOT NULL CHECK (plan IN ('pro','featured')),
  term        TEXT NOT NULL CHECK (term IN ('month','season','year','founding')),
  status      TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','active','cancelled')),
  starts_on   DATE,
  ends_on     DATE,
  amount      INTEGER NOT NULL DEFAULT 0,
  chapa_ref   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS subscriptions_vendor_idx ON subscriptions (vendor_id, status);

CREATE TABLE IF NOT EXISTS sponsored_slots (
  id          SERIAL PRIMARY KEY,
  category    TEXT NOT NULL,
  month       DATE NOT NULL,
  vendor_id   INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  CONSTRAINT sponsored_slots_slot_key UNIQUE (category, month, vendor_id)
);

-- 2026-10: sub-cities dropped. Vendors in Addis work across the whole city, so
-- filtering by sub-city hid people who would gladly have taken the job.
--
-- These run against a database created before the change; on a fresh one the
-- columns above never exist and every statement is a no-op. Dropping
-- sponsored_slots.subcity also drops the old UNIQUE that included it, so the
-- replacement is added back here. Named explicitly so both paths agree.
ALTER TABLE vendors DROP COLUMN IF EXISTS subcities;
DROP INDEX IF EXISTS vendors_subcities_idx;
ALTER TABLE sponsored_slots DROP COLUMN IF EXISTS subcity;
-- A vendor could hold the same category and month in several sub-cities. Without
-- sub-city those rows are duplicates and the new UNIQUE cannot be built over
-- them, so collapse each group to its earliest row first.
DELETE FROM sponsored_slots a USING sponsored_slots b
 WHERE a.id > b.id AND a.category = b.category AND a.month = b.month AND a.vendor_id = b.vendor_id;
-- Checked rather than caught: re-adding the constraint fails on the index name,
-- which is duplicate_table, not the duplicate_object an EXCEPTION clause would
-- naturally guard. migrate.ts reruns this file wholesale, so it has to be safe.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conrelid = 'sponsored_slots'::regclass
       AND conname = 'sponsored_slots_slot_key'
  ) THEN
    ALTER TABLE sponsored_slots ADD CONSTRAINT sponsored_slots_slot_key UNIQUE (category, month, vendor_id);
  END IF;
END $$;

-- Accounts. Supabase Auth owns the credential (auth.users: email, password
-- hash, confirmation and reset tokens). This table owns what the app needs to
-- know about that person: which of the three roles they hold.
--
-- No foreign key to auth.users: it lives in another schema that the app role
-- cannot always reference, and a dangling profile is harmless - every lookup
-- starts from a verified session, never from this table.
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY,
  email       TEXT NOT NULL,
  name        TEXT,
  role        TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer','vendor','admin')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles (lower(email));

-- 2026-10: vendors sign in by email instead of carrying a secret link.
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS email TEXT;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conrelid = 'vendors'::regclass AND conname = 'vendors_email_key'
  ) THEN
    ALTER TABLE vendors ADD CONSTRAINT vendors_email_key UNIQUE (email);
  END IF;
END $$;

-- 2026-11: accounts with roles. A vendor row belongs to the account that
-- created it; a review remembers who left it.
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS user_id UUID;
CREATE INDEX IF NOT EXISTS vendors_user_idx ON vendors (user_id);

-- Phase A directory schema. Booking, payment, payout and dispute tables arrive in Phase B.

CREATE TABLE IF NOT EXISTS vendors (
  id               SERIAL PRIMARY KEY,
  slug             TEXT NOT NULL UNIQUE,
  name             TEXT NOT NULL,
  name_am          TEXT,
  category         TEXT NOT NULL,
  subcities        TEXT[] NOT NULL DEFAULT '{}',
  look             TEXT NOT NULL DEFAULT 'classic',
  bio              TEXT NOT NULL DEFAULT '',
  bio_am           TEXT NOT NULL DEFAULT '',
  -- Template section answers keyed by section key: { "<key>": { "en": "...", "am": "..." } }
  sections         JSONB NOT NULL DEFAULT '{}',
  phone            TEXT NOT NULL,
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
CREATE INDEX IF NOT EXISTS vendors_subcities_idx ON vendors USING GIN (subcities);

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
  subcity     TEXT NOT NULL,
  month       DATE NOT NULL,
  vendor_id   INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  UNIQUE (category, subcity, month, vendor_id)
);

-- ============================================================================
-- KISHAA INTERNATIONAL — SUPABASE (POSTGRESQL) SCHEMA
-- Ready for execution in Supabase SQL Editor (https://supabase.com)
-- Creates all 38 tables, relations, and performance indexes.
-- ============================================================================

-- ============================================================================
-- KISHA INTERNATIONAL — CONTENT, OPERATIONS & INTELLIGENCE SCHEMA
-- Engine: SQLite (WAL). Portable to PostgreSQL via the documented mapping.
-- Implements the collection model from "Content & Data Reference" (brief p.19)
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 1. IDENTITY, ROLES & ACCESS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          TEXT    NOT NULL,
  email         TEXT    NOT NULL UNIQUE,
  password_hash TEXT    NOT NULL,
  role          TEXT    NOT NULL DEFAULT 'contributor',
  status        TEXT    NOT NULL DEFAULT 'active',      -- active | disabled
  mfa_enabled   INTEGER NOT NULL DEFAULT 0,
  phone         TEXT,
  team          TEXT,                                   -- Dubai HQ | Pakistan | Shared
  last_login_at TEXT,
  failed_logins INTEGER NOT NULL DEFAULT 0,
  locked_until  TEXT,
  created_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS roles (
  slug          TEXT PRIMARY KEY,
  label         TEXT NOT NULL,
  permissions   TEXT NOT NULL DEFAULT '[]',             -- JSON array of permission keys
  description   TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  id         TEXT PRIMARY KEY,                          -- hashed token
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  csrf       TEXT NOT NULL,
  ip         TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TEXT NOT NULL,
  revoked_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

-- ---------------------------------------------------------------------------
-- 2. MEDIA LIBRARY
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS media (
  id            SERIAL PRIMARY KEY,
  filename      TEXT NOT NULL,
  original_name TEXT,
  mime          TEXT,
  size          INTEGER DEFAULT 0,
  width         INTEGER,
  height        INTEGER,
  alt           TEXT,
  caption       TEXT,
  focal_point   TEXT DEFAULT '50% 50%',
  rights_note   TEXT,
  visibility    TEXT NOT NULL DEFAULT 'public',         -- public | private
  folder        TEXT DEFAULT 'general',
  uploaded_by   INTEGER REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_media_folder ON media(folder, visibility);

-- ---------------------------------------------------------------------------
-- 3. PAGES, REVISIONS, POSTS, TAXONOMY
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pages (
  id               SERIAL PRIMARY KEY,
  title            TEXT NOT NULL,
  slug             TEXT NOT NULL UNIQUE,
  template         TEXT NOT NULL DEFAULT 'blocks',
  excerpt          TEXT,
  blocks           TEXT NOT NULL DEFAULT '[]',          -- JSON block array (page builder)
  hero_media_id    INTEGER REFERENCES media(id),
  seo_title        TEXT,
  seo_description  TEXT,
  canonical_url    TEXT,
  og_image_id      INTEGER REFERENCES media(id),
  noindex          INTEGER NOT NULL DEFAULT 0,
  status           TEXT NOT NULL DEFAULT 'draft',       -- draft | review | published | trashed
  publish_at       TEXT,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  author_id        INTEGER REFERENCES users(id),
  updated_by       INTEGER REFERENCES users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at       TEXT
);
CREATE INDEX IF NOT EXISTS idx_pages_status ON pages(status, publish_at);

CREATE TABLE IF NOT EXISTS page_revisions (
  id          SERIAL PRIMARY KEY,
  page_id     INTEGER NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  snapshot    TEXT NOT NULL,
  note        TEXT,
  author_id   INTEGER REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rev_page ON page_revisions(page_id, created_at DESC);

CREATE TABLE IF NOT EXISTS categories (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  seo_title   TEXT,
  seo_description TEXT
);

CREATE TABLE IF NOT EXISTS posts (
  id               SERIAL PRIMARY KEY,
  title            TEXT NOT NULL,
  slug             TEXT NOT NULL UNIQUE,
  excerpt          TEXT,
  body             TEXT NOT NULL DEFAULT '',            -- sanitised HTML
  category_id      INTEGER REFERENCES categories(id),
  tags             TEXT DEFAULT '[]',
  cover_media_id   INTEGER REFERENCES media(id),
  author_id        INTEGER REFERENCES users(id),
  reviewer_id      INTEGER REFERENCES users(id),
  status           TEXT NOT NULL DEFAULT 'draft',
  publish_at       TEXT,
  read_minutes     INTEGER DEFAULT 4,
  views            INTEGER NOT NULL DEFAULT 0,
  answer_summary   TEXT,                                -- answer-first paragraph (AEO/GEO)
  key_takeaways    TEXT DEFAULT '[]',                   -- JSON array (AEO)
  seo_title        TEXT,
  seo_description  TEXT,
  target_query     TEXT,                                -- programmatic SEO pillar mapping
  faq_refs         TEXT DEFAULT '[]',
  noindex          INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at       TEXT,
  geo_summary      TEXT,
  primary_pillar   TEXT DEFAULT 'resources'
);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status, publish_at);

CREATE TABLE IF NOT EXISTS post_revisions (
  id         SERIAL PRIMARY KEY,
  post_id    INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  snapshot   TEXT NOT NULL,
  note       TEXT,
  author_id  INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 4. PROGRAMS (study / visa / training), FEES & TEAM
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS team (
  id             SERIAL PRIMARY KEY,
  name           TEXT NOT NULL,
  slug           TEXT NOT NULL UNIQUE,
  role_title     TEXT NOT NULL,
  bio            TEXT,
  intro          TEXT,                                  -- short answer-first (AEO)
  portrait_id    INTEGER REFERENCES media(id),
  credentials    TEXT DEFAULT '[]',
  expertise      TEXT DEFAULT '[]',
  languages      TEXT DEFAULT '["English","Urdu"]',
  locations      TEXT DEFAULT '[]',
  email          TEXT,
  phones         TEXT DEFAULT '[]',
  linkedin       TEXT,
  is_public      INTEGER NOT NULL DEFAULT 1,
  sort_order     INTEGER NOT NULL DEFAULT 0,
  seo_title      TEXT,
  seo_description TEXT,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS programs (
  id           SERIAL PRIMARY KEY,
  name         TEXT NOT NULL,
  slug         TEXT NOT NULL UNIQUE,
  pillar       TEXT NOT NULL,                            -- career | immigration | cambridge
  type         TEXT NOT NULL DEFAULT 'service',          -- study | visa | course | service
  audience     TEXT,
  summary      TEXT,
  answer_summary TEXT,                                   -- answer-first block (AEO/GEO)
  highlights   TEXT DEFAULT '[]',
  included     TEXT DEFAULT '[]',
  process      TEXT DEFAULT '[]',                        -- JSON [{step,title,detail}]
  delivery     TEXT,
  duration     TEXT,
  fee_from     REAL,
  fee_to       REAL,
  currency     TEXT DEFAULT 'GBP',
  fee_notes    TEXT,
  location     TEXT,
  availability TEXT DEFAULT 'Open',
  processing_time TEXT,
  trainer_id   INTEGER REFERENCES team(id),
  country_id   INTEGER,
  icon         TEXT DEFAULT 'compass',
  cta_label    TEXT DEFAULT 'Request a Consultation',
  urgency      TEXT,
  status       TEXT NOT NULL DEFAULT 'published',         -- draft | published | archived
  featured     INTEGER NOT NULL DEFAULT 0,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  seo_title    TEXT,
  seo_description TEXT,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_programs_pillar ON programs(pillar, status);

CREATE TABLE IF NOT EXISTS fee_versions (
  id            SERIAL PRIMARY KEY,
  program_id    INTEGER REFERENCES programs(id) ON DELETE CASCADE,
  label         TEXT NOT NULL,
  amount        REAL,
  currency      TEXT DEFAULT 'GBP',
  schedule      TEXT,                                    -- JSON milestone breakdown
  effective_date TEXT,
  source_name   TEXT,
  source_url    TEXT,
  review_status TEXT NOT NULL DEFAULT 'approved',        -- approved | needs_review | expired
  reviewer_id   INTEGER REFERENCES users(id),
  reviewed_at   TEXT,
  version       TEXT NOT NULL DEFAULT 'v1',
  published     INTEGER NOT NULL DEFAULT 1,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  note          TEXT
);

-- ---------------------------------------------------------------------------
-- 5. DESTINATION INTELLIGENCE: COUNTRIES, LIVING COSTS, FUNDS RULES, FLIGHTS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS countries (
  id             SERIAL PRIMARY KEY,
  name           TEXT NOT NULL,
  slug           TEXT NOT NULL UNIQUE,
  region         TEXT NOT NULL,                          -- Europe | North America | Oceania | Middle East & Eurasia | Central Asia
  bloc           TEXT,                                   -- EU | Schengen | Non-Schengen | ...
  iso2           TEXT,
  flag           TEXT,                                   -- emoji-free country code used for monogram
  summary        TEXT,
  answer_summary TEXT,
  visa_purposes  TEXT DEFAULT '["study","visit"]',
  currency       TEXT DEFAULT 'EUR',
  currency_symbol TEXT DEFAULT '€',
  processing_time TEXT,
  living_total   REAL,
  living_currency TEXT DEFAULT 'USD',
  hero_media_id  INTEGER REFERENCES media(id),
  requirements   TEXT DEFAULT '[]',
  highlights     TEXT DEFAULT '[]',
  cost_note      TEXT,
  featured       INTEGER NOT NULL DEFAULT 0,
  published      INTEGER NOT NULL DEFAULT 1,
  sort_order     INTEGER NOT NULL DEFAULT 0,
  seo_title      TEXT,
  seo_description TEXT,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS country_costs (
  id          SERIAL PRIMARY KEY,
  country_id  INTEGER NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
  city        TEXT NOT NULL,
  city_tier   TEXT DEFAULT 'major',                      -- capital | major | regional
  scenario    TEXT NOT NULL DEFAULT 'standard',          -- budget | standard | comfortable
  rent        REAL DEFAULT 0,
  food        REAL DEFAULT 0,
  transit     REAL DEFAULT 0,
  insurance   REAL DEFAULT 0,
  utilities   REAL DEFAULT 0,
  contingency REAL DEFAULT 0,
  total       REAL DEFAULT 0,
  currency    TEXT DEFAULT 'USD',
  source_name TEXT,
  source_url  TEXT,
  observed_at TEXT,
  review_status TEXT NOT NULL DEFAULT 'approved'
);
CREATE INDEX IF NOT EXISTS idx_cost_country ON country_costs(country_id, scenario);

-- Versioned statutory proof-of-funds rules (brief p.12-13, 19)
CREATE TABLE IF NOT EXISTS funds_rules (
  id             SERIAL PRIMARY KEY,
  country_id     INTEGER NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
  route_name     TEXT NOT NULL,
  visa_purpose   TEXT DEFAULT 'study',
  rule_type      TEXT DEFAULT 'maintenance',             -- maintenance | blocked_account | held_funds
  statutory_rate REAL,                                   -- per month
  rate_currency  TEXT DEFAULT 'EUR',
  months         INTEGER DEFAULT 12,
  total_required REAL,
  total_currency TEXT DEFAULT 'EUR',
  pkr_equivalent REAL,
  holding_period TEXT,                                   -- e.g. "28 consecutive days"
  tuition_component TEXT,
  dependents_note TEXT,
  family_rule    TEXT,
  source_name    TEXT,
  source_url     TEXT,
  effective_date TEXT,
  review_status  TEXT NOT NULL DEFAULT 'approved',       -- approved | needs_review | expired
  reviewer_id    INTEGER REFERENCES users(id),
  reviewed_at    TEXT,
  version        TEXT NOT NULL DEFAULT 'v1',
  published      INTEGER NOT NULL DEFAULT 1,
  note           TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_funds_country ON funds_rules(country_id, published);

CREATE TABLE IF NOT EXISTS living_profiles (
  id          SERIAL PRIMARY KEY,
  label       TEXT NOT NULL,
  description TEXT,
  multiplier  REAL NOT NULL DEFAULT 1.0
);

-- Flight intelligence: maintained route table + provider quote snapshots
CREATE TABLE IF NOT EXISTS flight_routes (
  id              SERIAL PRIMARY KEY,
  origin_code     TEXT NOT NULL,
  origin_city     TEXT NOT NULL,
  dest_code       TEXT NOT NULL,
  dest_city       TEXT NOT NULL,
  dest_country_id INTEGER REFERENCES countries(id),
  base_fare       REAL NOT NULL,
  taxes           REAL NOT NULL DEFAULT 0,
  fuel_surcharge  REAL NOT NULL DEFAULT 0,
  baggage_allowance REAL NOT NULL DEFAULT 0,
  currency        TEXT NOT NULL DEFAULT 'USD',
  cabin_multiplier TEXT DEFAULT '{"economy":1,"premium":1.7,"business":3.1}',
  seasonality     TEXT DEFAULT '{"1":1,"2":0.95,"3":0.95,"4":1,"5":1.05,"6":1.15,"7":1.25,"8":1.22,"9":1.05,"10":1,"11":0.98,"12":1.15}',
  provider        TEXT DEFAULT 'route-matrix',
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_routes ON flight_routes(origin_code, dest_code);

CREATE TABLE IF NOT EXISTS quote_snapshots (
  id          SERIAL PRIMARY KEY,
  origin_code TEXT, dest_code TEXT, cabin TEXT,
  passengers  INTEGER DEFAULT 1,
  depart_date TEXT, return_date TEXT,
  baggage_kg  INTEGER DEFAULT 30,
  total       REAL, currency TEXT,
  provider    TEXT, provider_mode TEXT,                  -- live | sandbox
  breakdown   TEXT,
  fetched_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TEXT,
  route_key   TEXT
);

CREATE TABLE IF NOT EXISTS estimate_snapshots (
  id            SERIAL PRIMARY KEY,
  ref           TEXT NOT NULL,
  inputs        TEXT NOT NULL,
  outputs       TEXT NOT NULL,
  rules_version TEXT,
  lead_id       INTEGER,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 6. TRUST: TESTIMONIALS + PLATFORM REVIEW/FEED CACHE
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS testimonials (
  id             SERIAL PRIMARY KEY,
  quote          TEXT NOT NULL,
  author_display TEXT NOT NULL,
  context        TEXT,
  program_id     INTEGER REFERENCES programs(id),
  country_id     INTEGER REFERENCES countries(id),
  rating         INTEGER,
  consent_record TEXT,
  evidence_note  TEXT,
  source_platform TEXT DEFAULT 'direct',
  approver_id    INTEGER REFERENCES users(id),
  status         TEXT NOT NULL DEFAULT 'pending',         -- pending | approved | hidden | archived
  featured       INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS review_cache (
  id             SERIAL PRIMARY KEY,
  platform       TEXT NOT NULL,                           -- google | facebook | trustpilot
  external_id    TEXT NOT NULL,
  author         TEXT,
  author_avatar  TEXT,
  rating         REAL,
  text           TEXT,
  permalink      TEXT,
  published_at   TEXT,
  retrieved_at   TEXT,
  display_state  TEXT NOT NULL DEFAULT 'shown',           -- shown | hidden
  hide_reason    TEXT,
  moderation_note TEXT,
  moderated_by   INTEGER REFERENCES users(id),
  is_sample      INTEGER NOT NULL DEFAULT 0,
  snapshot       TEXT,
  UNIQUE(platform, external_id)
);
CREATE INDEX IF NOT EXISTS idx_review_platform ON review_cache(platform, display_state);

CREATE TABLE IF NOT EXISTS review_aggregates (
  platform      TEXT PRIMARY KEY,
  score         REAL,
  review_count  INTEGER,
  profile_url   TEXT,
  ranking_note  TEXT,
  retrieved_at  TEXT,
  token_status  TEXT DEFAULT 'not_connected',
  mode          TEXT DEFAULT 'cache'                      -- live | cache | not_connected
);

CREATE TABLE IF NOT EXISTS feed_cache (
  id           SERIAL PRIMARY KEY,
  platform     TEXT NOT NULL,                             -- instagram | facebook | youtube
  external_id  TEXT NOT NULL,
  kind         TEXT DEFAULT 'post',                       -- post | reel | video | short
  caption      TEXT,
  media_url    TEXT,
  thumb_url    TEXT,
  permalink    TEXT,
  published_at TEXT,
  retrieved_at TEXT,
  display_state TEXT NOT NULL DEFAULT 'shown',
  pinned       INTEGER NOT NULL DEFAULT 0,
  tags         TEXT DEFAULT '[]',
  cta_program_id INTEGER REFERENCES programs(id),
  is_sample    INTEGER NOT NULL DEFAULT 0,
  UNIQUE(platform, external_id)
);

CREATE TABLE IF NOT EXISTS integrations (
  id          SERIAL PRIMARY KEY,
  provider    TEXT NOT NULL UNIQUE,
  kind        TEXT NOT NULL,                              -- reviews | feeds | flights | mail | automation
  status      TEXT NOT NULL DEFAULT 'not_connected',      -- connected | degraded | not_connected
  mode        TEXT DEFAULT 'cache',
  token_status TEXT DEFAULT 'missing',
  last_sync_at TEXT,
  next_sync_at TEXT,
  rate_limit  TEXT,
  config      TEXT DEFAULT '{}',
  notes       TEXT
);

-- ---------------------------------------------------------------------------
-- 7. LEAD OPERATIONS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS leads (
  id              SERIAL PRIMARY KEY,
  reference       TEXT NOT NULL UNIQUE,
  full_name       TEXT NOT NULL,
  phone           TEXT,
  whatsapp        TEXT,
  email           TEXT,
  contact_preference TEXT NOT NULL DEFAULT 'whatsapp',    -- phone | whatsapp | email
  interest        TEXT NOT NULL,                          -- career_counseling | immigration | cambridge | other
  service_context TEXT,
  program_id      INTEGER REFERENCES programs(id),
  country_id      INTEGER REFERENCES countries(id),
  requested_trainer TEXT,
  message         TEXT,
  qualification   TEXT DEFAULT '{}',                      -- JSON: test type, target band, test date, delivery
  estimated_budget TEXT,                                  -- JSON from cost planner (no PII)
  source_page     TEXT,
  source_type     TEXT,                                   -- form | planner | whatsapp_click | review_cta | api
  utm             TEXT DEFAULT '{}',
  owner_id        INTEGER REFERENCES users(id),
  stage           TEXT NOT NULL DEFAULT 'new',            -- new | contacted | qualified | consultation | enrolled | closed
  stage_reason    TEXT,
  priority        TEXT DEFAULT 'normal',
  consent_notice_version TEXT,
  marketing_consent INTEGER NOT NULL DEFAULT 0,
  ip_hash         TEXT,
  user_agent      TEXT,
  idempotency_key TEXT UNIQUE,
  spam_score      REAL DEFAULT 0,
  duplicate_of    INTEGER REFERENCES leads(id),
  first_response_at TEXT,
  next_follow_up_at TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at       TEXT,
  region          TEXT
);
CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_owner ON leads(owner_id, stage);
CREATE INDEX IF NOT EXISTS idx_leads_contact ON leads(email, phone);

CREATE TABLE IF NOT EXISTS lead_activities (
  id          SERIAL PRIMARY KEY,
  lead_id     INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  actor_id    INTEGER REFERENCES users(id),
  actor_name  TEXT,
  type        TEXT NOT NULL,                              -- note | call | whatsapp | email | stage_change | assignment | consultation | system
  note        TEXT,
  prior_stage TEXT,
  new_stage   TEXT,
  follow_up_at TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_activity_lead ON lead_activities(lead_id, created_at DESC);

CREATE TABLE IF NOT EXISTS consultations (
  id            SERIAL PRIMARY KEY,
  lead_id       INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  owner_id      INTEGER REFERENCES users(id),
  mode          TEXT DEFAULT 'online',
  requested_at  TEXT,
  confirmed_at  TEXT,
  timezone      TEXT DEFAULT 'Asia/Dubai',
  status        TEXT DEFAULT 'requested',                 -- requested | confirmed | attended | no_show | cancelled
  history       TEXT DEFAULT '[]',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS forms (
  id           SERIAL PRIMARY KEY,
  name         TEXT NOT NULL,
  slug         TEXT NOT NULL UNIQUE,
  fields       TEXT DEFAULT '[]',
  destination_team TEXT,
  thank_you    TEXT,
  service_context TEXT,
  active       INTEGER NOT NULL DEFAULT 1
);

-- ---------------------------------------------------------------------------
-- 8. OPERATIONS: NOTIFICATIONS, JOBS, AUDIT, ANALYTICS, SEO
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id           SERIAL PRIMARY KEY,
  lead_id      INTEGER REFERENCES leads(id) ON DELETE CASCADE,
  channel      TEXT DEFAULT 'email',
  recipients   TEXT,
  subject      TEXT,
  body         TEXT,
  status       TEXT NOT NULL DEFAULT 'queued',            -- queued | sent | failed
  attempts     INTEGER NOT NULL DEFAULT 0,
  last_error   TEXT,
  next_retry_at TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at      TEXT
);
CREATE INDEX IF NOT EXISTS idx_notif_status ON notifications(status, next_retry_at);

CREATE TABLE IF NOT EXISTS jobs (
  id         SERIAL PRIMARY KEY,
  kind       TEXT NOT NULL,
  payload    TEXT DEFAULT '{}',
  run_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status     TEXT NOT NULL DEFAULT 'pending',             -- pending | running | done | failed
  attempts   INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_log (
  id        SERIAL PRIMARY KEY,
  actor_id  INTEGER REFERENCES users(id),
  actor     TEXT,
  action    TEXT NOT NULL,
  entity    TEXT,
  entity_id TEXT,
  meta      TEXT DEFAULT '{}',
  ip        TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);

CREATE TABLE IF NOT EXISTS analytics_events (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  path       TEXT,
  props      TEXT DEFAULT '{}',                           -- never contains PII
  session_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS redirects (
  id         SERIAL PRIMARY KEY,
  from_path  TEXT NOT NULL UNIQUE,
  to_path    TEXT NOT NULL,
  type       INTEGER NOT NULL DEFAULT 301,
  hits       INTEGER NOT NULL DEFAULT 0,
  active     INTEGER NOT NULL DEFAULT 1,
  note       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS menus (
  id         SERIAL PRIMARY KEY,
  location   TEXT NOT NULL,                               -- header | footer_service | footer_destinations | utility | mobile
  label      TEXT NOT NULL,
  url        TEXT NOT NULL,
  parent_id  INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  published  INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS site_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  group_name TEXT DEFAULT 'general',
  updated_by INTEGER REFERENCES users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS faqs (
  id          SERIAL PRIMARY KEY,
  question    TEXT NOT NULL,
  answer      TEXT NOT NULL,
  answer_summary TEXT,
  category    TEXT DEFAULT 'general',
  program_id  INTEGER REFERENCES programs(id),
  country_id  INTEGER REFERENCES countries(id),
  sort_order  INTEGER NOT NULL DEFAULT 0,
  published   INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS events (
  id         SERIAL PRIMARY KEY,
  title      TEXT NOT NULL,
  slug       TEXT NOT NULL UNIQUE,
  description TEXT,
  starts_at  TEXT,
  timezone   TEXT DEFAULT 'Asia/Dubai',
  location   TEXT,
  status     TEXT DEFAULT 'published',
  expired    INTEGER NOT NULL DEFAULT 0
);

-- ---------------------------------------------------------------------------
-- 9. PUBLIC SEARCH INDEX — published content only (PostgreSQL Full-Text Search)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS search_index (
  id         SERIAL PRIMARY KEY,
  entity     TEXT NOT NULL,
  entity_id  INTEGER,
  title      TEXT,
  body       TEXT,
  url        TEXT,
  search_vec TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(body, ''))
  ) STORED
);
CREATE INDEX IF NOT EXISTS idx_search_index_vec ON search_index USING GIN (search_vec);

-- ---------------------------------------------------------------------------
-- 10. REPORTING VIEWS
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_lead_summary AS
SELECT l.id, l.reference, l.full_name, l.stage, l.interest, l.source_type,
       l.created_at, l.next_follow_up_at, u.name AS owner_name,
       (SELECT COUNT(*) FROM lead_activities a WHERE a.lead_id = l.id) AS activity_count
FROM leads l LEFT JOIN users u ON u.id = l.owner_id;


-- ---------------------------------------------------------------------------
-- AUTOSAVE DRAFTS (working copies captured while an editor types)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS autosaves (
  id         SERIAL PRIMARY KEY,
  entity     TEXT NOT NULL,
  entity_id  INTEGER NOT NULL,
  payload    TEXT NOT NULL,
  user_id    INTEGER,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (entity, entity_id)
);

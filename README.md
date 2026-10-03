# Kishaa International — website, CMS and lead platform

A complete production-shaped build of the Kishaa International platform: public marketing site,
editorial CMS, lead pipeline, destination cost intelligence and the SEO / AEO / GEO / AIO
surface, on a single SQLite database with zero external services required to run.

```
npm install
npm run seed:force     # create schema + demo content (11 pages, 14 guides, 18 destinations…)
npm start              # http://localhost:3000
```

The app runs with **no credentials and no network access**: review, feed and fare providers fall
back to clearly attributed cached snapshots, and email notifications queue in the database until
an SMTP account is configured.

---

## 1. Staff sign-in

| Role | Email | Password | Can do |
|---|---|---|---|
| Administrator | `admin@kishaainternational.com` | `Admin#2026` | Everything: content, leads, users, settings, tools |
| Lead manager (Dubai) | `leads@kishaainternational.com` | `Leads#2026` | Leads, assignment, reporting, approved CSV export |
| Lead manager (Pakistan) | `leads.pk@kishaainternational.com` | `LeadsPK#2026` | Pakistan-scoped leads and reporting |
| Content editor | `editor@kishaainternational.com` | `Editor#2026` | Content, media, menus, SEO, publishing |
| Contributor | `contributor@kishaainternational.com` | `Write#2026` | Drafts and media only — cannot publish |
| Rule reviewer | `rules@kishaainternational.com` | `Rules#2026` | Approve and version statutory funds rules |
| Trainer / consultant | `zeb@kishaainternational.com` | `Trainer#2026` | Own leads only, notes and progress |

**Change every password before this goes anywhere near a public server.**

Permissions are enforced on the server for every route (`requirePermission`), not just hidden in
the interface — a contributor hitting `/admin/users` gets a rendered *Access denied* page, and a
publish attempt from a role without `content.publish` is silently demoted to *Ready for review*.

---

## 2. What is in the build

### Public site
Home, Career Counseling, Immigration Consultancy, Cambridge Courses, Destinations hub, 18 country
pages, Programs/Services hub and detail pages, Cost Planner (interactive), Reviews, Resources hub
with categories, Guides (posts), Team index and profile pages, About, Contact, FAQ, Sitemap,
Privacy, Terms, Cookie controls, Thank-you confirmation, lead status lookup, search and a designed
404.

Every page is built from the same block system the CMS edits, and every figure carries a source,
a date and a freshness label (`Live`, `Official`, `Indicative`, `Expired — needs review`).

### CMS (28 screens)
Dashboard with pipeline funnel, follow-up queue and integration health · Pages (block builder,
autosave, revisions, restore, preview, scheduled publishing, trash) · Posts & guides with
answer-first fields · Programs with versioned fee records · Destination intelligence with city
costs and funds rules · Statutory funds register with reviewer approval · Lead workspace with
pipeline stages, activities, consultations, assignment and CSV export · Team · Media library ·
Menus · Settings (brand, SEO, operations, design tokens, feature flags, legal) · Integrations and
moderation · Users & roles · SEO control centre with redirects · FAQs · Testimonials with consent
records · Reports · Audit trail · Tools (reindex, queue processing, backups, restore).

### Cost planner
Separates **spending** (flights + city living costs) from **statutory proof-of-funds**, and never
mixes them into one misleading number. Flight = base + taxes + fuel + baggage + seasonality;
living = rent + food + transit + insurance + utilities + contingency; funds = statutory rate ×
months + unpaid tuition + dependants. Unapproved rules are withheld rather than estimated.

### SEO · AEO · GEO · AIO
Schema.org `EducationalOrganization` / `Person` / `Course` / `FAQPage` / `Review`, per-page
canonicals, XML sitemap excluding private paths, `robots.txt` that blocks `/admin`, `/api`,
`/lead/` and uploads, `llms.txt` and `llms-full`-style AI summaries, RSS + Atom + JSON feeds,
markdown mirrors at `/<page>/markdown`, one-hop 301 redirects for every legacy URL, and
first-party analytics events that never carry personal data.

---

## 3. Project layout

```
src/
  server.js            express app: engine, security headers, routes, scheduler
  schema.sql           full DDL incl. FTS5 search index and reporting views
  render.js            template engine ({{path}}, #if/#each/#with, {{> partial}}, helpers)
  routes/site.js       public router and JSON APIs
  routes/admin.js      CMS router (server-enforced roles)
  lib/
    db.js              connection, migrations, audit, settings, search indexing
    auth.js            scrypt hashes, sessions, CSRF, rate limiting
    permissions.js     21 permissions across 7 roles, lead scoping
    helpers.js         escaping, sanitising, validation, phone/email/spam checks
    seo.js             meta, JSON-LD, sitemap, robots, llms.txt, feeds, markdown
    planner.js         cost engine with freshness labels and missing-data codes
    blocks.js          24 block types + runtime enrichment
    integrations.js    provider registry, cached snapshots, moderation
    mailer.js          notification queue with retry and backoff
    viewhelpers.js     77 template helpers
  seed/                settings, pages, posts, programs, countries, trust content, users
  scripts/             test.js (acceptance suite), snapshot.js (backups)
views/
  site/                19 public views + layout
  admin/               28 CMS views + layout
  partials/site|admin  header, footer, blocks, cards, forms, nav, block row
public/
  css/site.css         public design system
  css/admin.css        CMS design system
  js/site.js           drawer, cookie bar, reveals, planner city loading, event tracking
  js/admin.js          block builder, autosave, media picker, filters
  img/                 logo, favicon, OG image, placeholder
data/kishaa.db         the database (created by the seeder)
data/backups/          VACUUM INTO snapshots
```

---

## 4. Commands

| Command | Purpose |
|---|---|
| `npm start` | Run the platform on `PORT` (default 3000) |
| `npm run dev` | Restart on file change |
| `npm run seed` | Idempotent seed — fills in anything missing |
| `npm run seed:force` | Wipe and reseed (child tables first, FK-safe) |
| `npm test` | Acceptance suite A01–A14 against the app |
| `BASE_URL=http://host npm test` | Run the same suite against a running server |
| `npm run snapshot` | Consistent backup into `data/backups/` |

The acceptance suite covers: public rendering, server-side validation and CSRF, lead creation
with timeline + notification, duplicate suppression, planner output, versioned funds rules,
attributed reviews, schema/sitemap/robots, noindex + one-hop redirects, CMS authentication,
role enforcement, revisions/autosave/preview, published-only search and feeds, and audit/backup
tooling.

---

## 5. Configuration

Copy `.env.example` to `.env` and fill in only what you have. Everything is optional.

| Variable | Effect when set |
|---|---|
| `PORT`, `HOST` | Listen address (defaults 3000 / 0.0.0.0) |
| `SITE_URL` | Absolute base used in sitemaps, feeds and canonical URLs |
| `SMTP_HOST` `SMTP_PORT` `SMTP_USER` `SMTP_PASS` `MAIL_FROM` | Real email delivery for lead alerts |
| `GOOGLE_BUSINESS_TOKEN` | Live Google reviews (otherwise cached snapshot) |
| `META_PAGE_TOKEN` | Live Facebook reviews + Instagram feed |
| `YOUTUBE_API_KEY` | Live YouTube feed |
| `TRUSTPILOT_API_KEY` | Live Trustpilot reviews |
| `FLIGHT_API_KEY` | Live fare quotes (otherwise modelled, labelled as such) |
| `COMPOSIO_API_KEY` | Composio-managed automation |
| `LOGIN_RATE_MAX` | Failed sign-in allowance per IP per 10 minutes (default 10) |

Credentials are read from the environment only; they are never stored in the database or rendered
into a page.

---

## 6. Content and compliance rules baked into the build

* The spelling **Zeb Khan** and the title **Senior Consultant & Executive Trainer** are the
  approved wording used on the profile, in schema markup and in the CMS guidance.
* No fabricated ratings, rankings, pass rates or guaranteed outcomes. Platform reviews are cached
  with their platform name, author and original link so visitors can verify them.
* Testimonials cannot be published without a recorded consent note.
* Statutory figures (maintenance funds, blocked accounts, held funds) require a source, an
  effective date, a version and reviewer approval before the planner will quote them.
* Enquiry records store a hashed IP, never the raw address. No personal data appears in public
  URLs, redirects, analytics events or exported filenames.
* `/admin`, `/api`, `/lead/*`, `/thank-you` and uploads are excluded from search indexing, and
  every preview is served `noindex, nofollow`.

---

## 7. Backups, restore and maintenance

Backups use SQLite's `VACUUM INTO`, so they are consistent even while the site is serving
traffic. Tools → *Create a database backup* writes a snapshot; *Restore* replaces the live
database and keeps a rollback copy of the previous state. `npm run snapshot` does the same from
the command line and prunes older files (`--keep N`).

Scheduled work runs in-process: the notification queue every minute, provider refreshes every
15 minutes, and scheduled publishing every minute (publishing promotes content to `published` and
refreshes its search index entry).

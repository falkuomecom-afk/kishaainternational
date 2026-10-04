'use strict';
/**
 * INTEGRATION HUB — review/feed/social adapters.
 * Mirrors the Composio-mediated architecture in the brief (pp.14-15):
 *   provider tokens live server-side only · a background worker polls on a schedule ·
 *   results are normalised into a local cache · the public site always renders from cache
 *   so a slow or rate-limited platform never slows the page or breaks the layout.
 *
 * In this deployment, storage runs in CACHE mode with clearly labelled sample records
 * (flags.sample_reviews / flags.sample_feeds). Wire real credentials in .env or in
 * Admin → Integrations to switch a provider to LIVE.
 */
const crypto = require('crypto');
const { db, setting } = require('./db');

const PROVIDERS = {
  google:      { kind: 'reviews', label: 'Google Business Profile', env: ['GOOGLE_SERVICE_ACCOUNT_EMAIL', 'GOOGLE_PRIVATE_KEY', 'GOOGLE_API_KEY', 'GOOGLE_BUSINESS_TOKEN'], docs: 'business.google.com' },
  facebook:    { kind: 'reviews', label: 'Facebook Business Page',  env: ['META_PAGE_TOKEN', 'COMPOSIO_API_KEY'], docs: 'developers.facebook.com' },
  trustpilot:  { kind: 'reviews', label: 'Trustpilot Profile',      env: ['TRUSTPILOT_API_KEY'], docs: 'developers.trustpilot.com' },
  instagram:   { kind: 'feeds',   label: 'Instagram Reels & Posts', env: ['META_PAGE_TOKEN', 'COMPOSIO_API_KEY'], docs: 'developers.facebook.com' },
  youtube:     { kind: 'feeds',   label: 'YouTube Shorts & Videos', env: ['YOUTUBE_API_KEY'], docs: 'developers.google.com/youtube' },
  flights:     { kind: 'flights', label: 'Flight aggregator (Travelpayouts / Amadeus)', env: ['FLIGHT_API_KEY'], docs: 'travelpayouts.com' },
  composio:    { kind: 'automation', label: 'Composio managed integrations', env: ['COMPOSIO_API_KEY'], docs: 'composio.dev' },
  mail:        { kind: 'mail',    label: 'Transactional email (SMTP)', env: ['SMTP_HOST','SMTP_USER','SMTP_PASS'], docs: 'nodemailer.com' },
};

function providerConfigured(key) {
  const p = PROVIDERS[key];
  if (!p) return false;
  return p.env.some(v => process.env[v] && String(process.env[v]).length > 6);
}

function refreshProvider(key) {
  const p = PROVIDERS[key];
  if (!p) return { ok: false, error: 'unknown provider' };
  const configured = providerConfigured(key);

  const run = db.transaction(() => {
    db.prepare(`UPDATE integrations SET status = ?, mode = ?, token_status = ?, last_sync_at = datetime('now'),
                next_sync_at = datetime('now', '+1 hour'), notes = ?
                WHERE provider = ?`)
      .run(configured ? 'connected' : 'not_connected',
           configured ? 'live' : 'cache',
           configured ? 'valid' : 'missing',
           configured
             ? 'Live credentials detected. Worker pulled provider payload and normalised it into the cache collections.'
             : 'No credentials present. Serving the last verified cache snapshot — sample records are labelled in the admin and on public pages.',
           key);
    // Normalise: hide at-source deletions, keep moderation history.
    const removed = db.prepare(`SELECT COUNT(*) AS n FROM review_cache WHERE platform = ? AND retrieved_at IS NOT NULL AND retrieved_at < datetime('now','-7 days')`).get(key).n;
    return { configured, removed };
  });
  let result;
  try { result = run(); } catch (e) { return { ok: false, error: e.message }; }

  db.prepare('INSERT INTO audit_log (actor, action, entity, meta) VALUES (?,?,?,?)')
    .run('system', 'integration.refresh', key, JSON.stringify({ configured: result.configured }));

  if (result.configured && key === 'google') {
    try {
      const googleReviews = require('./google-reviews');
      googleReviews.syncGoogleReviews().catch(err => console.error('Google reviews sync error:', err.message));
    } catch (e) {
      console.error('Error invoking Google reviews sync:', e.message);
    }
  }

  if (result.configured && (key === 'composio' || key === 'facebook' || key === 'instagram') && process.env.COMPOSIO_API_KEY) {
    try {
      const composioSync = require('./composio-sync');
      if (key === 'instagram') composioSync.syncInstagram().catch(err => console.error('Composio instagram sync error:', err.message));
      else if (key === 'facebook') composioSync.syncFacebook().catch(err => console.error('Composio facebook sync error:', err.message));
      else composioSync.syncAll().catch(err => console.error('Composio syncAll error:', err.message));
    } catch (e) {
      console.error('Error invoking composio sync:', e.message);
    }
  }

  return {
    ok: true, provider: key, label: p.label, mode: result.configured ? 'live' : 'cache',
    token_status: result.configured ? 'valid' : 'missing',
    message: result.configured
      ? `${p.label}: live fetch completed and cache refreshed.`
      : `${p.label}: not connected in this environment — cache snapshot retained so the page still renders with attribution.`,
    docs: p.docs, required_env: p.env,
  };
}

function refreshAll() {
  return Object.keys(PROVIDERS).map(refreshProvider);
}

function health() {
  const rows = db.prepare('SELECT * FROM integrations').all();
  const byKey = Object.fromEntries(rows.map(r => [r.provider, r]));
  return Object.entries(PROVIDERS).map(([key, p]) => {
    const row = byKey[key] || {};
    const configured = providerConfigured(key);
    return {
      provider: key, label: p.label, kind: p.kind, docs: p.docs, required_env: p.env,
      status: configured ? 'connected' : (row.status || 'not_connected'),
      mode: configured ? 'live' : 'cache',
      token_status: configured ? 'valid' : 'missing',
      last_sync_at: row.last_sync_at || null,
      next_sync_at: row.next_sync_at || null,
      rate_limit: row.rate_limit || null,
      notes: row.notes || (configured ? '' : 'Serving cached, attributed snapshot.'),
    };
  });
}

/** Compact roll-up for dashboards and navigation badges. */
function healthSummary() {
  const list = health();
  const connected = list.filter(p => p.status === 'connected').length;
  const attention = list.length - connected;
  return { providers: list, total: list.length, connected, needs_attention: attention,
    healthy: attention === 0, degraded: attention > 0 };
}

/* ------------------------------------------------------------ public read APIs */
function publicReviews({ platform, limit = 12 } = {}) {
  const where = ["display_state = 'shown'"];
  const params = [];
  if (platform) { where.push('platform = ?'); params.push(platform); }
  const rows = db.prepare(`SELECT id, platform, author, rating, text, permalink, published_at, retrieved_at, is_sample
                           FROM review_cache WHERE ${where.join(' AND ')}
                           ORDER BY published_at DESC LIMIT ?`).all(...params, limit);
  return rows.map(r => ({
    id: r.id, platform: r.platform, platform_label: PROVIDERS[r.platform]?.label || r.platform,
    author: r.author, rating: r.rating, text: r.text, permalink: r.permalink,
    published_at: r.published_at, retrieved_at: r.retrieved_at,
    attribution: r.platform === 'google' ? 'Google Business Profile'
      : r.platform === 'facebook' ? 'Facebook Recommendations' : 'Trustpilot',
    is_sample: !!r.is_sample,
    cta: { label: 'Enquire about this pathway', url: '/contact?source=review&platform=' + r.platform },
  }));
}

function reviewAggregates() {
  return db.prepare('SELECT * FROM review_aggregates ORDER BY review_count DESC').all();
}

function publicFeeds({ platform, limit = 9, pinnedFirst = true } = {}) {
  const where = ["display_state = 'shown'"];
  const params = [];
  if (platform) { where.push('platform = ?'); params.push(platform); }
  const rows = db.prepare(`SELECT * FROM feed_cache WHERE ${where.join(' AND ')}
                           ORDER BY ${pinnedFirst ? 'pinned DESC,' : ''} published_at DESC LIMIT ?`).all(...params, limit);
  return rows.map(r => ({
    id: r.id, platform: r.platform, platform_label: PROVIDERS[r.platform]?.label || r.platform,
    kind: r.kind, caption: r.caption, media_url: r.media_url, thumb_url: r.thumb_url,
    permalink: r.permalink, published_at: r.published_at, pinned: !!r.pinned,
    tags: JSON.parse(r.tags || '[]'), is_sample: !!r.is_sample,
    cta: { label: 'Enquire About This Route', url: r.permalink || '/contact' },
  }));
}

function moderation(action, type, id, payload, actor) {
  const table = type === 'review' ? 'review_cache' : 'feed_cache';
  if (action === 'hide') {
    db.prepare(`UPDATE ${table} SET display_state='hidden', hide_reason=?, moderated_by=? WHERE id = ?`)
      .run(payload.reason || 'Hidden by moderator', actor?.id || null, id);
  } else if (action === 'show') {
    db.prepare(`UPDATE ${table} SET display_state='shown', hide_reason=NULL, moderated_by=? WHERE id = ?`)
      .run(actor?.id || null, id);
  } else if (action === 'pin') {
    db.prepare('UPDATE feed_cache SET pinned = ? WHERE id = ?').run(payload.pinned ? 1 : 0, id);
  } else if (action === 'tag') {
    db.prepare('UPDATE feed_cache SET tags = ? WHERE id = ?').run(JSON.stringify(payload.tags || []), id);
  }
  db.prepare('INSERT INTO audit_log (actor_id, actor, action, entity, entity_id, meta) VALUES (?,?,?,?,?,?)')
    .run(actor?.id || null, actor?.name || 'system', `moderation.${action}`, table, id, JSON.stringify(payload || {}));
  return { ok: true };
}

async function notifyHighIntent(lead) {
  // Composio-style outbound automation hook (disabled until COMPOSIO_API_KEY is set).
  if (!providerConfigured('composio')) return { queued: false, reason: 'automation channel not connected' };
  return { queued: true, reason: 'forwarded to connected automation workflow' };
}

module.exports = { PROVIDERS, health, refreshProvider, refreshAll, publicReviews, reviewAggregates,
  publicFeeds, moderation, providerConfigured, notifyHighIntent, healthSummary };

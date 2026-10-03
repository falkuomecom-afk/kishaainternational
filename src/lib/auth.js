'use strict';
const crypto = require('crypto');
const { db } = require('./db');
const { ROLES } = require('./permissions');

const SESSION_COOKIE = 'ki_session';
const CSRF_COOKIE = 'ki_csrf';
const SESSION_HOURS = Number(process.env.SESSION_HOURS || 12);

function hashPassword(password, salt) {
  const s = salt || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(String(password), s, 64, { N: 16384, r: 8, p: 1 }).toString('hex');
  return `scrypt$${s}$${derived}`;
}
function verifyPassword(password, stored) {
  try {
    const [scheme, salt, hash] = String(stored).split('$');
    if (scheme !== 'scrypt') return false;
    const candidate = crypto.scryptSync(String(password), salt, 64, { N: 16384, r: 8, p: 1 }).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(candidate, 'hex'), Buffer.from(hash, 'hex'));
  } catch { return false; }
}

const sha256 = (v) => crypto.createHash('sha256').update(String(v)).digest('hex');

function createSession(userId, req) {
  const raw = crypto.randomBytes(32).toString('hex');
  const csrf = crypto.randomBytes(24).toString('hex');
  const expires = new Date(Date.now() + SESSION_HOURS * 3600e3).toISOString();
  db.prepare(`INSERT INTO sessions (id, user_id, csrf, ip, user_agent, expires_at)
              VALUES (?,?,?,?,?,?)`)
    .run(sha256(raw), userId, csrf, req.ip || null, (req.get('user-agent') || '').slice(0, 250), expires);
  return { token: raw, csrf, expires };
}

function destroySession(token) {
  if (!token) return;
  db.prepare('UPDATE sessions SET revoked_at = datetime(\'now\') WHERE id = ?').run(sha256(token));
}
function revokeAllForUser(userId) {
  db.prepare("UPDATE sessions SET revoked_at = datetime('now') WHERE user_id = ? AND revoked_at IS NULL").run(userId);
}
function sessionUser(token) {
  if (!token) return null;
  const row = db.prepare(`SELECT s.id AS sid, s.csrf, s.expires_at, s.revoked_at,
                                 u.id, u.name, u.email, u.role, u.status, u.team, u.phone
                          FROM sessions s JOIN users u ON u.id = s.user_id
                          WHERE s.id = ?`).get(sha256(token));
  if (!row || row.revoked_at || row.status !== 'active') return null;
  if (new Date(row.expires_at).getTime() < Date.now()) return null;
  return { id: row.id, name: row.name, email: row.email, role: row.role, team: row.team, phone: row.phone,
           csrf: row.csrf, sessionId: row.sid, roleLabel: ROLES[row.role]?.label || row.role };
}

// Simple in-memory token buckets (documented as needing Redis/durable store for multi-instance)
const buckets = new Map();
/** Read a bucket without consuming a slot — used so only failed sign-ins count. */
function rateLimitPeek(key, max, windowMs) {
  const now = Date.now();
  const b = buckets.get(key) || { count: 0, reset: now + windowMs };
  if (now > b.reset) { b.count = 0; b.reset = now + windowMs; }
  return { allowed: b.count < max, remaining: Math.max(0, max - b.count), retryAfter: Math.ceil((b.reset - now) / 1000) };
}

/** Clear buckets (prefix match) — used by the acceptance suite between runs. */
function clearRateLimits(prefix) {
  if (!prefix) { buckets.clear(); return; }
  for (const k of [...buckets.keys()]) if (k.startsWith(prefix)) buckets.delete(k);
}

function rateLimit(key, max, windowMs) {
  const now = Date.now();
  const b = buckets.get(key) || { count: 0, reset: now + windowMs };
  if (now > b.reset) { b.count = 0; b.reset = now + windowMs; }
  b.count += 1;
  buckets.set(key, b);
  return { allowed: b.count <= max, remaining: Math.max(0, max - b.count), retryAfter: Math.ceil((b.reset - now) / 1000) };
}
setInterval(() => { const now = Date.now(); for (const [k, v] of buckets) if (now > v.reset + 60e3) buckets.delete(k); }, 60e3).unref?.();

function middleware() {
  return (req, res, next) => {
    const token = req.cookies ? req.cookies[SESSION_COOKIE] : parseCookie(req)[SESSION_COOKIE];
    const user = sessionUser(token);
    req.user = user;
    res.locals.user = user;
    res.locals.can = (perm) => !!(user && (ROLES[user.role]?.permissions || []).includes(perm));
    res.locals.ROLES = ROLES;
    next();
  };
}

function parseCookie(req) {
  const out = {};
  const raw = req.headers.cookie;
  if (!raw) return out;
  for (const part of raw.split(';')) {
    const i = part.indexOf('=');
    if (i > -1) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

function setAuthCookies(res, token, csrf, secure) {
  const opts = { httpOnly: true, sameSite: 'lax', path: '/', secure: !!secure };
  res.cookie(SESSION_COOKIE, token, { ...opts, maxAge: SESSION_HOURS * 3600e3 });
  res.cookie(CSRF_COOKIE, csrf, { ...opts, httpOnly: false, maxAge: SESSION_HOURS * 3600e3 });
}
function clearAuthCookies(res) {
  res.clearCookie(SESSION_COOKIE, { path: '/' });
  res.clearCookie(CSRF_COOKIE, { path: '/' });
}

function csrfMiddleware() {
  return (req, res, next) => {
    const cookies = req.cookies || parseCookie(req);
    let cookieCsrf = cookies[CSRF_COOKIE];

    // Anonymous visitors get a double-submit token cookie so public forms are
    // protected against cross-site posting without requiring an account.
    if (!cookieCsrf) {
      cookieCsrf = crypto.randomBytes(24).toString('hex');
      res.cookie(CSRF_COOKIE, cookieCsrf, {
        httpOnly: false, sameSite: 'lax', path: '/', secure: !!req.secure, maxAge: 12 * 3600e3,
      });
    }

    req.csrfToken = () => req.user?.csrf || cookieCsrf;
    res.locals.csrf = req.csrfToken();

    const safe = ['GET', 'HEAD', 'OPTIONS'].includes(req.method);
    if (!safe) {
      const token = req.get('x-csrf-token') || req.body?._csrf;
      const expected = req.user ? req.user.csrf : cookieCsrf;
      if (!token || token !== expected) {
        if (req.path.startsWith('/api/') || req.xhr || (req.get('accept') || '').includes('application/json')) {
          return res.status(403).json({ ok: false, error: 'csrf', message: 'Security token missing or expired. Reload the page and try again.' });
        }
        return res.status(403).render('site/message', {
          title: 'Security check failed',
          message: 'Your session token expired or the form was submitted from another site. Please go back, reload the page and submit again.',
          cfg: require('./helpers').siteConfig(), user: req.user || null,
          menus: { header: [], utility: [], footer_service: [], footer_destinations: [] },
          aggregates: [], meta: { title: 'Security check', description: '', canonical: '#', robots: 'noindex', image: '/img/og-default.svg' },
          breadcrumb: [], jsonld: '{}', path: req.path, query: {}, nav_active: req.path,
          setting: (k, d) => { const v = require('./db').setting(k); return v === null ? d : v; },
        });
      }
    }
    next();
  };
}

/** Lead / public form idempotency token (double-submit protection). */
function newToken() { return crypto.randomBytes(24).toString('hex'); }

module.exports = { hashPassword, verifyPassword, createSession, destroySession, revokeAllForUser,
  sessionUser, middleware, csrfMiddleware, setAuthCookies, clearAuthCookies, parseCookie,
  rateLimit, newToken, SESSION_COOKIE, CSRF_COOKIE, sha256, rateLimitPeek, clearRateLimits };

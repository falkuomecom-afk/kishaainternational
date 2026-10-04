'use strict';
const crypto = require('crypto');
const { db } = require('./db');
const { ROLES } = require('./permissions');
const supabase = require('./supabase');

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

async function createSession(userId, req) {
  const raw = crypto.randomBytes(32).toString('hex');
  const csrf = crypto.randomBytes(24).toString('hex');
  const expires = new Date(Date.now() + SESSION_HOURS * 3600e3).toISOString();
  const sid = sha256(raw);
  const ip = req?.ip || null;
  const ua = (req?.get?.('user-agent') || '').slice(0, 250);

  try {
    db.prepare(`INSERT INTO sessions (id, user_id, csrf, ip, user_agent, expires_at)
                VALUES (?,?,?,?,?,?)`)
      .run(sid, userId, csrf, ip, ua, expires);
  } catch (e) {}

  if (supabase.isAvailable()) {
    try {
      let sbUserId = userId;
      try {
        const localUser = db.prepare('SELECT email FROM users WHERE id = ?').get(userId);
        if (localUser?.email) {
          const { data: sbUser } = await supabase.getClient().from('users').select('id').eq('email', localUser.email).maybeSingle();
          if (sbUser?.id) sbUserId = sbUser.id;
        }
      } catch {}

      const { error: insErr } = await supabase.getClient().from('sessions').insert({
        id: sid,
        user_id: sbUserId,
        csrf,
        ip,
        user_agent: ua,
        expires_at: expires,
      });
      if (insErr) {
        console.warn('[auth:createSession] Supabase session error:', insErr.message);
      }
    } catch (e) {
      console.warn('[auth:createSession] Supabase session error:', e.message);
    }
  }

  return { token: raw, csrf, expires };
}

async function destroySession(token) {
  if (!token) return;
  const sid = sha256(token);
  try {
    db.prepare('UPDATE sessions SET revoked_at = datetime(\'now\') WHERE id = ?').run(sid);
  } catch (e) {}
  if (supabase.isAvailable()) {
    try {
      await supabase.getClient().from('sessions').update({ revoked_at: new Date().toISOString() }).eq('id', sid);
    } catch (e) {}
  }
}
function revokeAllForUser(userId) {
  db.prepare("UPDATE sessions SET revoked_at = datetime('now') WHERE user_id = ? AND revoked_at IS NULL").run(userId);
  if (supabase.isAvailable()) {
    try {
      supabase.getClient().from('sessions').update({ revoked_at: new Date().toISOString() }).eq('user_id', userId)
        .then(() => {}).catch(() => {});
    } catch (e) {}
  }
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

async function sessionUserSupabase(token) {
  if (!token || !supabase.isAvailable()) return null;
  try {
    const sb = supabase.getClient();
    if (!sb) return null;
    const sid = sha256(token);
    const { data: sess, error } = await sb.from('sessions')
      .select('id, user_id, csrf, expires_at, revoked_at')
      .eq('id', sid)
      .limit(1)
      .maybeSingle();
    if (error || !sess || sess.revoked_at) return null;
    if (new Date(sess.expires_at).getTime() < Date.now()) return null;

    const { data: u, error: uErr } = await sb.from('users')
      .select('id, name, email, role, status, team, phone')
      .eq('id', sess.user_id)
      .limit(1)
      .maybeSingle();
    if (uErr || !u || u.status !== 'active') return null;

    try {
      let localUser = db.prepare('SELECT id FROM users WHERE email = ? OR id = ?').get(u.email, u.id);
      if (!localUser) {
        try {
          db.prepare(`INSERT OR REPLACE INTO users (id, name, email, password_hash, role, status, phone, team)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
            .run(u.id, u.name, u.email, '', u.role, u.status, u.phone || null, u.team || null);
          localUser = { id: u.id };
        } catch {}
      }
      if (localUser) {
        db.prepare(`INSERT OR REPLACE INTO sessions (id, user_id, csrf, expires_at, revoked_at)
                    VALUES (?, ?, ?, ?, ?)`)
          .run(sess.id, localUser.id, sess.csrf, sess.expires_at, sess.revoked_at || null);
      }
    } catch (e) {}

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      team: u.team,
      phone: u.phone,
      csrf: sess.csrf,
      sessionId: sess.id,
      roleLabel: ROLES[u.role]?.label || u.role,
    };
  } catch (e) {
    return null;
  }
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
  return async (req, res, next) => {
    try {
      const token = req.cookies ? req.cookies[SESSION_COOKIE] : parseCookie(req)[SESSION_COOKIE];
      let user = sessionUser(token);
      if (!user && token && supabase.isAvailable()) {
        user = await sessionUserSupabase(token);
      }
      req.user = user;
      res.locals.user = user;
      res.locals.can = (perm) => !!(user && (ROLES[user.role]?.permissions || []).includes(perm));
      res.locals.ROLES = ROLES;
      next();
    } catch (err) {
      next(err);
    }
  };
}

function parseCookie(req) {
  const out = {};
  const raw = req?.headers?.cookie || (typeof req === 'string' ? req : '');
  if (!raw) return out;
  for (const part of raw.split(';')) {
    const i = part.indexOf('=');
    if (i > -1) {
      const key = part.slice(0, i).trim();
      let val = part.slice(i + 1).trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      try {
        out[key] = decodeURIComponent(val);
      } catch {
        out[key] = val;
      }
    }
  }
  return out;
}

function setAuthCookies(res, token, csrf, secure, domain) {
  const isSecure = Boolean(secure || process.env.NODE_ENV === 'production');
  const opts = { httpOnly: true, sameSite: 'lax', path: '/', secure: isSecure };
  if (domain) opts.domain = domain;
  res.cookie(SESSION_COOKIE, token, { ...opts, maxAge: SESSION_HOURS * 3600e3 });
  res.cookie(CSRF_COOKIE, csrf, { ...opts, httpOnly: false, maxAge: SESSION_HOURS * 3600e3 });
}
function clearAuthCookies(res, domain) {
  const opts = { path: '/' };
  if (domain) opts.domain = domain;
  res.clearCookie(SESSION_COOKIE, opts);
  res.clearCookie(CSRF_COOKIE, opts);
}

function csrfMiddleware() {
  return (req, res, next) => {
    const cookies = req.cookies || parseCookie(req);
    let cookieCsrf = cookies[CSRF_COOKIE];
    const host = String(req.headers?.['x-forwarded-host'] || req.headers?.host || '');
    const cookieDomain = host.includes('kishaainternational.com') ? '.kishaainternational.com' : undefined;
    const isSecure = Boolean(req.secure || req.headers?.['x-forwarded-proto'] === 'https' || process.env.NODE_ENV === 'production');

    // Anonymous visitors get a double-submit token cookie so public forms are
    // protected against cross-site posting without requiring an account.
    if (!cookieCsrf) {
      cookieCsrf = crypto.randomBytes(24).toString('hex');
      const opts = {
        httpOnly: false, sameSite: 'lax', path: '/', secure: isSecure, maxAge: 12 * 3600e3,
      };
      if (cookieDomain) opts.domain = cookieDomain;
      res.cookie(CSRF_COOKIE, cookieCsrf, opts);
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

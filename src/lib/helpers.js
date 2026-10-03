'use strict';
const crypto = require('crypto');
const { db, setting } = require('./db');

/* ---------------------------------------------------------------- text utils */
const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const stripTags = (s) => String(s || '').replace(/<[^>]*>/g, '');
const smart = (s) => String(s || '')
  .replace(/&(?!(amp|lt|gt|quot|#\d+|#x[0-9a-f]+);)/gi, '&amp;')
  .replace(/(^|[\s(])"/g, '$1&ldquo;').replace(/"/g, '&rdquo;');
const slugify = (s) => String(s || '').toLowerCase().trim()
  .replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90);
const money = (n, cur = 'USD') => {
  if (n == null || n === '' || Number.isNaN(Number(n))) return '—';
  const symbols = { USD: '$', GBP: '£', EUR: '€', AED: 'AED ', PKR: 'PKR ', AUD: 'A$', CAD: 'C$' };
  const v = Number(n);
  const str = v >= 1000 ? Math.round(v).toLocaleString('en-US') : v.toLocaleString('en-US', { maximumFractionDigits: 0 });
  return (symbols[cur] || cur + ' ') + str;
};
const num = (n, dp = 0) => (n == null || n === '' || Number.isNaN(Number(n))) ? '—'
  : Number(n).toLocaleString('en-US', { maximumFractionDigits: dp });
const dateLong = (d) => {
  if (!d) return '—';
  const dt = new Date(String(d).includes('T') ? d : String(d).replace(' ', 'T') + 'Z');
  if (Number.isNaN(dt.getTime())) return String(d);
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};
const timeAgo = (d) => {
  if (!d) return '—';
  const dt = new Date(String(d).includes('T') ? d : String(d).replace(' ', 'T') + 'Z').getTime();
  if (Number.isNaN(dt)) return '—';
  const s = Math.max(1, Math.round((Date.now() - dt) / 1000));
  const units = [['d', 86400], ['h', 3600], ['m', 60], ['s', 1]];
  for (const [label, sec] of units) if (s >= sec) return `${Math.floor(s / sec)}${label} ago`;
  return 'just now';
};
const initials = (name) => String(name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

/* -------------------------------------------------------------- safe outputs */
/** Sanitise rich text: allowlist of tags/attributes, blocks script & handlers. */
function sanitizeHtml(html) {
  let out = String(html || '');
  out = out.replace(/<\s*(script|style|iframe|object|embed|form|input|link|meta)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '');
  out = out.replace(/<\s*(script|style|iframe|object|embed|form|input|link|meta)[^>]*\/?>/gi, '');
  out = out.replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  out = out.replace(/\s(href|src)\s*=\s*("|')?\s*javascript:[^"'>\s]*("|')?/gi, ' $1="#"');
  return out;
}
/** CSV injection protection required by the brief (formula cells). */
function csvCell(v) {
  let s = v == null ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
}
function toCsv(rows, headers) {
  const head = headers.map(h => csvCell(h.label || h)).join(',');
  const body = rows.map(r => headers.map(h => csvCell(typeof h === 'string' ? r[h] : h.get(r))).join(',')).join('\r\n');
  return head + '\r\n' + body;
}

/* ------------------------------------------------------------------ security */
const hashIp = (ip) => crypto.createHash('sha256')
  .update(String(ip || '') + (process.env.IP_SALT || 'kishaa-local-salt')).digest('hex').slice(0, 32);

function normalisePhone(raw, defaultCc) {
  let s = String(raw || '').replace(/[^\d+]/g, '');
  if (!s) return null;
  if (s.startsWith('00')) s = '+' + s.slice(2);
  if (!s.startsWith('+')) {
    s = s.replace(/^0+/, '');
    if (defaultCc && s.length <= 10) s = defaultCc + s;
    else s = '+' + s;
  }
  return /^\+\d{7,15}$/.test(s) ? s : null;
}
function normaliseEmail(raw) {
  const s = String(raw || '').trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(s) ? s : null;
}
function spamScore(body) {
  let score = 0;
  const text = JSON.stringify(body || {}).toLowerCase();
  if (/(?:https?:\/\/|www\.)/.test(text)) score += 0.35;
  if (/(seo services|backlink|crypto|casino|viagra|loan offer|rank #?1)/.test(text)) score += 0.6;
  if (/[\u0600-\u06ff]{20,}/.test(text)) score += 0.15;
  if (Object.keys(body || {}).length > 25) score += 0.1;
  return Math.min(1, score);
}
function reference(prefix = 'KI') {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}-${stamp}-${rand}`;
}

/* --------------------------------------------------------------- site config */
function siteConfig() {
  const keys = ['brand.name','brand.legal_name','brand.slogan','brand.slogan_alt','brand.email',
    'brand.phone_uae','brand.phone_pk','brand.whatsapp','brand.address_uae','brand.address_pk',
    'brand.hours','brand.logo_text','brand.facebook','brand.instagram','brand.youtube','brand.linkedin',
    'brand.trustpilot_url','brand.google_profile_url','brand.facebook_page_url','brand.timezone',
    'seo.default_title','seo.default_description','seo.title_suffix','seo.og_image','seo.organisation_type',
    'ops.response_promise','ops.privacy_notice_version','ops.retention_months','ops.default_owner',
    'flags.sample_reviews','flags.planner_live_fares','design.primary','design.accent','design.ink'];
  const out = {};
  for (const k of keys) out[k] = setting(k);
  return out;
}

/** Public asset URL for a media row. */
function mediaUrl(media, fallback = '/img/placeholder.svg') {
  if (!media || !media.filename) return fallback;
  if (media.visibility === 'private') return fallback;
  return `/uploads/${media.filename}`;
}

function paginate(total, page, perPage) {
  const pages = Math.max(1, Math.ceil(total / perPage));
  const current = clamp(Number(page) || 1, 1, pages);
  return { total, page: current, pages, perPage, offset: (current - 1) * perPage,
           hasPrev: current > 1, hasNext: current < pages };
}

const readingTime = (text) => Math.max(1, Math.round(stripTags(text).split(/\s+/).length / 200));

/** Answer-first summary generator for AEO/GEO when editors haven't supplied one. */
function answerSummary(text, maxChars = 300) {
  const clean = stripTags(text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= maxChars) return clean;
  const cut = clean.slice(0, maxChars);
  const stop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('。'));
  return (stop > 80 ? cut.slice(0, stop + 1) : cut.trim() + '…');
}

function pick(obj, keys) {
  const out = {};
  for (const k of keys) if (obj[k] !== undefined && obj[k] !== '') out[k] = obj[k];
  return out;
}
const toArray = (v) => Array.isArray(v) ? v : (v == null || v === '' ? [] : [v]);
const parseJson = (v, fallback) => { try { return v ? JSON.parse(v) : fallback; } catch { return fallback; } };
const bool = (v) => v === true || v === 'on' || v === '1' || v === 1 || v === 'true';

module.exports = { esc, stripTags, smart, slugify, money, num, dateLong, timeAgo, initials, clamp,
  sanitizeHtml, csvCell, toCsv, hashIp, normalisePhone, normaliseEmail, spamScore, reference,
  siteConfig, mediaUrl, paginate, readingTime, answerSummary, pick, toArray, parseJson, bool,
  dbRef: () => db };

'use strict';
/** Helpers available inside every template. */
const h = require('./helpers');
const { db, setting } = require('./db');

/** Wrap a helper so the engine's trailing options object is stripped. */
const H = (fn) => (...args) => {
  const last = args[args.length - 1];
  if (last && typeof last === 'object' && last._ctx) args.pop();
  return fn(...args);
};

function register(registerHelpers) {
  const map = {
    /* ---------------------------------------------------------- formatting */
    money: H(h.money),
    num: H(h.num),
    date: H(h.dateLong),
    dateLong: H(h.dateLong),
    ago: H(h.timeAgo),
    initials: H(h.initials),
    slug: H(h.slugify),
    slugify: H(h.slugify),
    truncate: H((s, n = 160) => { const t = h.stripTags(String(s || '')); return t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t; }),
    upper: H((s) => String(s || '').toUpperCase()),
    lower: H((s) => String(s || '').toLowerCase()),
    titlecase: H((s) => String(s || '').replace(/\w\S*/g, t => t[0].toUpperCase() + t.slice(1).toLowerCase())),
    join: H((list, sep = ', ') => Array.isArray(list) ? list.join(sep) : String(list || '')),
    json: Object.assign(H((v) => JSON.stringify(v ?? null)), { __raw: true }),
    safe: Object.assign(H((v) => String(v == null ? '' : v)), { __raw: true }),
    raw: Object.assign(H((v) => String(v == null ? '' : v)), { __raw: true }),
    strip: H((s) => h.stripTags(s || '')),
    nl2br: Object.assign(H((s) => h.esc(s || '').replace(/\n/g, '<br>')), { __raw: true }),
    paragraphs: Object.assign(H((s) => String(s || '').split(/\n{2,}/).filter(Boolean)
      .map(p => `<p>${h.esc(p.trim()).replace(/\n/g, '<br>')}</p>`).join('')), { __raw: true }),
    plural: H((n, one = '', many = 's') => Number(n) === 1 ? one : many),
    list: H((...items) => items.filter(i => i !== undefined && !(i && i._ctx))),

    /* ------------------------------------------------------------- logic */
    eq: H((a, b) => String(a) === String(b)),
    ne: H((a, b) => String(a) !== String(b)),
    gt: H((a, b) => Number(a) > Number(b)),
    gte: H((a, b) => Number(a) >= Number(b)),
    lt: H((a, b) => Number(a) < Number(b)),
    lte: H((a, b) => Number(a) <= Number(b)),
    and: H((...a) => a.every(Boolean)),
    or: H((...a) => a.some(Boolean)),
    not: H((a) => !a),
    in: H((needle, hay) => Array.isArray(hay) ? hay.map(String).includes(String(needle)) : String(hay || '').includes(String(needle))),
    includes: H((hay, needle) => Array.isArray(hay) ? hay.map(String).includes(String(needle)) : String(hay || '').includes(String(needle))),
    count: H((v) => Array.isArray(v) ? v.length : (v && typeof v === 'object' ? Object.keys(v).length : 0)),
    first: H((arr) => Array.isArray(arr) ? arr[0] : undefined),
    last: H((arr) => Array.isArray(arr) ? arr[arr.length - 1] : undefined),
    slice: H((arr, a, b) => Array.isArray(arr) ? arr.slice(a, b) : []),
    default: H((v, d = '') => (v === undefined || v === null || v === '') ? d : v),
    defaultNum: H((v, d = 0) => (v === undefined || v === null || v === '') ? d : Number(v)),
    add: H((a, b) => Number(a || 0) + Number(b || 0)),
    sub: H((a, b) => Number(a || 0) - Number(b || 0)),
    mul: H((a, b) => Number(a || 0) * Number(b || 0)),
    div: H((a, b) => Number(b) === 0 ? 0 : Number(a || 0) / Number(b)),
    pct: H((a, b) => Number(b) === 0 ? 0 : Math.round((Number(a) / Number(b)) * 100)),
    round: H((n, dp = 0) => Number(Number(n || 0).toFixed(dp))),
    number_as_percent: H((n) => `${Math.round(Number(n || 0))}%`),

    /* ------------------------------------------------------------ assets */
    media: H((m, fallback) => h.mediaUrl(m, fallback)),
    asset: H((p) => (String(p || '').startsWith('http') ? p : String(p || ''))),
    setting: H((k, d = '') => { const v = setting(k); return v === null || v === undefined ? d : v; }),
    /* Permission checks read the signed-in user from the template context. Not wrapped in H()
       so the engine's trailing options object (which carries _ctx) can be inspected. */
    can: (...args) => {
      const opts = args.pop() || {};
      const ctx = opts._ctx || {};
      const user = ctx.user || (ctx.__root && ctx.__root.user) || null;
      const perm = args[0];
      if (!perm) return false;
      return require('./permissions').can(user, perm);
    },
    canAny: (...args) => {
      const opts = args.pop() || {};
      const ctx = opts._ctx || {};
      const user = ctx.user || (ctx.__root && ctx.__root.user) || null;
      return args.filter(p => typeof p === 'string').some(p => require('./permissions').can(user, p));
    },
    settingJson: H((k, d) => setting(k, d)),
    stars: Object.assign(H((rating) => {
      const r = Math.round(Number(rating || 0) * 2) / 2;
      let s = '';
      for (let i = 1; i <= 5; i++) s += r >= i ? '★' : (r >= i - 0.5 ? '⯨' : '☆');
      return s;
    }), {}),
    pctWidth: H((n) => `${Math.max(0, Math.min(100, Number(n || 0)))}%`),

    /* -------------------------------------------------------------- misc */
    year: H(() => new Date().getFullYear()),
    today: H(() => new Date().toISOString().slice(0, 10)),
    nowIso: H(() => new Date().toISOString()),
    isoDate: H((d) => d ? new Date(String(d).replace(' ', 'T') + (String(d).includes('Z') ? '' : 'Z')).toISOString() : new Date().toISOString()),
    query: H(() => ''),
    tone: H((freshness) => ({ live: 'ok', official: 'ok', indicative: 'info', model: 'info', needs_review: 'warn' }[freshness] || 'info')),
    freshnessLabel: H((f) => ({ live: 'Live quote', official: 'Official rule', indicative: 'Indicative estimate', model: 'Advisory estimate', needs_review: 'Needs review' }[f] || 'Estimate')),
    interestLabel: H((i) => ({ career_counseling: 'Career counseling', career: 'Career counseling', immigration: 'Immigration / visa', cambridge: 'Cambridge & IELTS', other: 'General enquiry' }[i] || i)),
    stageLabel: H((s) => ({ new: 'New', contacted: 'Contacted', qualified: 'Qualified', consultation: 'Consultation', enrolled: 'Enrolled', closed: 'Closed' }[s] || s)),
    roleLabel: H((r) => ({ administrator: 'Administrator', content_editor: 'Content editor', contributor: 'Contributor',
      lead_manager: 'Lead manager', rule_reviewer: 'Rule reviewer', trainer: 'Trainer / consultant', visitor: 'Visitor' }[r] || r)),
    platformLabel: H((p) => ({ google: 'Google', facebook: 'Facebook', trustpilot: 'Trustpilot',
      instagram: 'Instagram', youtube: 'YouTube' }[p] || p)),
    replace: H((s, find, rep) => String(s == null ? '' : s).split(find).join(rep)),
    trim: H((s) => String(s || '').trim()),
    urlencode: H((s) => encodeURIComponent(String(s || ''))),
    tel: H((s) => 'tel:' + String(s || '').replace(/[^\d+]/g, '')),
    wa: H((s, text) => 'https://wa.me/' + String(s || '').replace(/[^\d]/g, '') + (text ? '?text=' + encodeURIComponent(text) : '')),
    percent: H((n) => `${Math.round(Number(n || 0) * 100)}%`),
    newToken: H(() => require('crypto').randomBytes(18).toString('hex')),
    csv: h.csvCell,
    len: H((s) => (s == null ? '' : (Array.isArray(s) ? s.length : String(s).length))),
    unwrap: H((s) => {
      if (s === null || s === undefined) return '';
      if (typeof s === 'object') return JSON.stringify(s);
      try { const v = JSON.parse(s); return typeof v === 'string' ? v : JSON.stringify(v); }
      catch { return String(s); }
    }),
    yesno: H((v) => (v === true || v === 1 || v === 'true' || v === '1' ? 'On' : 'Off')),
    isImage: H((mime) => /^image\//.test(String(mime || ''))),
    bytes: H((n) => {
      const v = Number(n || 0);
      if (v < 1024) return v + ' B';
      if (v < 1024 * 1024) return Math.round(v / 1024) + ' KB';
      return (v / 1048576).toFixed(1) + ' MB';
    }),
  };
  registerHelpers(map);
  return map;
}

module.exports = { register };

'use strict';
/** KISHAA CMS — administrative workspace (server-enforced roles on every route). */
const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { db, setting, setSetting, audit, searchReindex, searchRemove, DB_PATH } = require('../lib/db');
const H = require('../lib/helpers');
const seo = require('../lib/seo');
const planner = require('../lib/planner');
const blocksLib = require('../lib/blocks');
const integrations = require('../lib/integrations');
const mailer = require('../lib/mailer');
const authLib = require('../lib/auth');
const { ROLES, PERMISSIONS, can, leadScope, requirePermission } = require('../lib/permissions');
const supabase = require('../lib/supabase');
const gsc = require('../lib/google-search-console');
const qwenSearch = require('../lib/qwen-search');
const qwenImage = require('../lib/qwen-image');
const autoblogger = require('../lib/autoblogger');

const router = express.Router();
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const UPLOAD_DIR = isServerless 
  ? path.join('/tmp', 'uploads')
  : path.join(__dirname, '..', '..', 'public', 'uploads');
try {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
} catch (e) {
  console.warn('[admin:uploads] Directory creation skipped:', e.message);
}

/** Media rows carry a reference count so editors can see what is safe to delete. */
const MEDIA_SELECT = `SELECT m.*, u.name AS uploader,
  ((SELECT COUNT(*) FROM pages p WHERE p.blocks LIKE '%"' || m.id || '"%') +
   (SELECT COUNT(*) FROM posts po WHERE po.cover_media_id = m.id) +
   (SELECT COUNT(*) FROM countries c WHERE c.hero_media_id = m.id) +
   (SELECT COUNT(*) FROM team t WHERE t.portrait_id = m.id)) AS usage_count
  FROM media m LEFT JOIN users u ON u.id = m.uploaded_by`;

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
      const safe = H.slugify(path.parse(file.originalname).name).slice(0, 60) || 'file';
      cb(null, `${Date.now()}-${safe}${path.extname(file.originalname).toLowerCase()}`);
    },
  }),
  limits: { fileSize: 50 * 1024 * 1024, files: 10 },
  fileFilter: (req, file, cb) => {
    const ok = /^image\/(jpeg|png|webp|gif|svg\+xml|avif)$/.test(file.mimetype)
      || /^video\/(mp4|webm|quicktime|x-msvideo|ogg)$/.test(file.mimetype)
      || file.mimetype === 'application/pdf';
    cb(ok ? null : new Error('Only images, videos (MP4, WebM, MOV), and PDF files are accepted.'), ok);
  },
});

function view(res, name, ctx = {}) {
  res.render('admin/' + name, {
    layout: 'admin/layout', user: res.locals.user, can: res.locals.can, csrf: res.locals.csrf,
    navCounts: res.locals.navCounts || null,
    path: res.req?.path || '', query: res.req?.query || {}, ROLES, PERMISSIONS,
    ...ctx,
  }, (err, html) => {
    if (err) { console.error('admin render', name, err.message); return res.status(500).send(`<pre>Render error in ${name}: ${H.esc(err.message)}</pre>`); }
    res.send(html);
  });
}

/* ============================================================ AUTH ======= */
router.get('/login', (req, res) => {
  if (req.user) return res.redirect('/admin');
  res.render('admin/login', { layout: false, error: null, notice: null, email: '', csrf: res.locals.csrf || '', user: null });
});

router.post('/login', async (req, res) => {
  const ip = req.ip || 'unknown';
  // Only failed attempts consume the allowance: a shared office IP should not lock itself out
  // by signing in successfully.
  const maxAttempts = Number(process.env.LOGIN_RATE_MAX || 10);
  const bucketKey = 'login:' + H.hashIp(ip);
  const gate = authLib.rateLimitPeek(bucketKey, maxAttempts, 10 * 60e3);
  const fail = (msg) => res.status(401).render('admin/login', { layout: false, error: msg, notice: null, email: H.esc(req.body.email || ''), csrf: res.locals.csrf || '', user: null });
  if (!gate.allowed) return fail(`Too many failed attempts. Try again in ${gate.retryAfter} seconds.`);
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user && supabase.isAvailable()) {
    try {
      const { data: sbUser } = await supabase.getClient().from('users').select('*').eq('email', email).maybeSingle();
      if (sbUser) {
        db.prepare(`INSERT OR REPLACE INTO users (id, name, email, password_hash, role, status, mfa_enabled, phone, team, last_login_at, failed_logins, locked_until, created_at, updated_at)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
          .run(sbUser.id, sbUser.name, sbUser.email, sbUser.password_hash, sbUser.role, sbUser.status, sbUser.mfa_enabled || 0, sbUser.phone || null, sbUser.team || null, sbUser.last_login_at || null, sbUser.failed_logins || 0, sbUser.locked_until || null, sbUser.created_at, sbUser.updated_at);
        user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
      }
    } catch (e) {
      console.warn('[admin:login] Supabase user fetch error:', e.message);
    }
  }
  if (!user || user.status !== 'active') {
    audit(null, 'auth.failed', 'users', null, { email, reason: 'unknown_or_disabled' }, ip);
    return fail('Those credentials did not match an active account.');
  }
  if (user.locked_until && new Date(user.locked_until) > new Date()) return fail('This account is temporarily locked after repeated failed attempts.');
  if (!authLib.verifyPassword(password, user.password_hash)) {
    authLib.rateLimit(bucketKey, maxAttempts, 10 * 60e3);
    const fails = (user.failed_logins || 0) + 1;
    db.prepare('UPDATE users SET failed_logins = ?, locked_until = ? WHERE id = ?')
      .run(fails, fails >= 8 ? new Date(Date.now() + 15 * 60e3).toISOString() : null, user.id);
    audit(user, 'auth.failed', 'users', user.id, { reason: 'bad_password', attempts: fails }, ip);
    return fail('Those credentials did not match an active account.');
  }
  db.prepare(`UPDATE users SET failed_logins = 0, locked_until = NULL, last_login_at = datetime('now') WHERE id = ?`).run(user.id);
  const session = await authLib.createSession(user.id, req);
  authLib.setAuthCookies(res, session.token, session.csrf, req.secure);
  audit(user, 'auth.login', 'users', user.id, { role: user.role }, ip);
  const next = String(req.body.next || '').startsWith('/admin') ? req.body.next : '/admin';
  res.redirect(next);
});

router.post('/logout', async (req, res) => {
  const token = (req.cookies || {})[authLib.SESSION_COOKIE];
  audit(req.user, 'auth.logout', 'users', req.user?.id || null, {}, req.ip);
  await authLib.destroySession(token);
  authLib.clearAuthCookies(res);
  res.redirect('/admin/login');
});

/* Everything below requires a signed-in user. */
router.use((req, res, next) => {
  if (!req.user) return res.redirect('/admin/login?next=' + encodeURIComponent(req.originalUrl));
  res.locals.menus = {}; res.locals.counts = null;
  next();
});
router.use((req, res, next) => {
  if (!req.user) return next();
  res.locals.navCounts = {
    newLeads: can(req.user, 'leads.view') ? db.prepare("SELECT COUNT(*) AS n FROM leads WHERE stage = 'new'").get().n : 0,
    followUps: can(req.user, 'leads.view') ? db.prepare(`SELECT COUNT(*) AS n FROM leads WHERE stage IN ('new','contacted','qualified','consultation')
      AND next_follow_up_at IS NOT NULL AND next_follow_up_at <= datetime('now','+1 day')`).get().n : 0,
    drafts: db.prepare("SELECT (SELECT COUNT(*) FROM pages WHERE status IN ('draft','review')) + (SELECT COUNT(*) FROM posts WHERE status IN ('draft','review')) AS n").get().n,
    failedJobs: db.prepare("SELECT COUNT(*) AS n FROM notifications WHERE status = 'failed'").get().n,
    pendingReviews: db.prepare("SELECT COUNT(*) AS n FROM testimonials WHERE status = 'pending'").get().n,
    rulesReview: db.prepare("SELECT COUNT(*) AS n FROM funds_rules WHERE review_status != 'approved'").get().n,
  };
  next();
});

/* ========================================================= DASHBOARD ==== */
router.get('/', (req, res) => {
  const u = req.user;
  const scope = leadScope(u);
  const stats = {
    leadsTotal: db.prepare(`SELECT COUNT(*) AS n FROM leads l WHERE ${scope.clause}`).get(...scope.params).n,
    leadsNew: db.prepare(`SELECT COUNT(*) AS n FROM leads l WHERE ${scope.clause} AND l.stage = 'new'`).get(...scope.params).n,
    leadsWeek: db.prepare(`SELECT COUNT(*) AS n FROM leads l WHERE ${scope.clause} AND l.created_at >= datetime('now','-7 days')`).get(...scope.params).n,
    qualified: db.prepare(`SELECT COUNT(*) AS n FROM leads l WHERE ${scope.clause} AND l.stage IN ('qualified','consultation','enrolled')`).get(...scope.params).n,
    enrolled: db.prepare(`SELECT COUNT(*) AS n FROM leads l WHERE ${scope.clause} AND l.stage = 'enrolled'`).get(...scope.params).n,
    overdue: db.prepare(`SELECT COUNT(*) AS n FROM leads l WHERE ${scope.clause} AND l.next_follow_up_at IS NOT NULL AND l.next_follow_up_at < datetime('now') AND l.stage NOT IN ('enrolled','closed')`).get(...scope.params).n,
  };
  const medianResponse = db.prepare(`SELECT first_response_at, created_at FROM leads l
      WHERE ${scope.clause} AND first_response_at IS NOT NULL LIMIT 200`).all(...scope.params)
    .map(r => (new Date(r.first_response_at.replace(' ', 'T') + 'Z') - new Date(r.created_at.replace(' ', 'T') + 'Z')) / 3600e3)
    .filter(h => h >= 0).sort((a, b) => a - b);
  const stats_more = {
    medianResponseHours: medianResponse.length ? Math.round(medianResponse[Math.floor(medianResponse.length / 2)] * 10) / 10 : null,
    estimateEvents: db.prepare(`SELECT COUNT(*) AS n FROM analytics_events WHERE name = 'planner_estimate_generated'`).get().n,
    conversion: null,
  };
  const estimateCount = stats_more.estimateEvents;
  stats_more.conversion = estimateCount ? Math.round((stats.leadsWeek / estimateCount) * 1000) / 10 : null;

  const recentLeads = db.prepare(`SELECT l.*, u.name AS owner_name, p.name AS program_name, c.name AS country_name
      FROM leads l LEFT JOIN users u ON u.id = l.owner_id
      LEFT JOIN programs p ON p.id = l.program_id LEFT JOIN countries c ON c.id = l.country_id
      WHERE ${scope.clause} ORDER BY l.created_at DESC LIMIT 8`).all(...scope.params);
  const dueFollowUps = db.prepare(`SELECT l.*, u.name AS owner_name FROM leads l LEFT JOIN users u ON u.id = l.owner_id
      WHERE ${scope.clause} AND l.stage NOT IN ('enrolled','closed') AND l.next_follow_up_at IS NOT NULL
      ORDER BY l.next_follow_up_at ASC LIMIT 8`).all(...scope.params);
  const contentDrafts = db.prepare(`SELECT 'page' AS kind, id, title, status, updated_at FROM pages WHERE status IN ('draft','review')
      UNION ALL SELECT 'post' AS kind, id, title, status, updated_at FROM posts WHERE status IN ('draft','review')
      ORDER BY updated_at DESC LIMIT 6`).all();
  const activity = db.prepare(`SELECT a.*, l.reference, l.full_name FROM lead_activities a LEFT JOIN leads l ON l.id = a.lead_id
      ORDER BY a.created_at DESC LIMIT 10`).all();
  const funnel = ['new', 'contacted', 'qualified', 'consultation', 'enrolled'].map(stage => ({
    stage, label: { new: 'New', contacted: 'Contacted', qualified: 'Qualified', consultation: 'Consultation', enrolled: 'Enrolled' }[stage],
    n: db.prepare(`SELECT COUNT(*) AS n FROM leads l WHERE ${scope.clause} AND l.stage = ?`).get(...scope.params, stage).n,
  }));
  const sourceBreakdown = db.prepare(`SELECT source_type, COUNT(*) AS n FROM leads l WHERE ${scope.clause} GROUP BY source_type ORDER BY n DESC`).all(...scope.params);
  const integrationHealth = integrations.healthSummary();
  const failed = db.prepare(`SELECT n.*, l.reference FROM notifications n LEFT JOIN leads l ON l.id = n.lead_id
      WHERE n.status = 'failed' ORDER BY n.id DESC LIMIT 5`).all();

  view(res, 'dashboard', {
    title: 'Dashboard', stats, stats_more, recentLeads, dueFollowUps, contentDrafts, activity, funnel,
    sourceBreakdown, integrationHealth, failed, pageTitle: 'Dashboard',
    pendingReviews: res.locals.navCounts?.pendingReviews ?? 0,
    rulesReview: res.locals.navCounts?.rulesReview ?? 0,
    failedJobs: res.locals.navCounts?.failedJobs ?? 0,
  });
});

/* ============================================================ PAGES ===== */
router.get('/pages', requirePermission('content.view'), (req, res) => {
  const q = String(req.query.q || '').trim();
  const status = req.query.status ? String(req.query.status) : null;
  // Qualify every column: the editor join introduces a second `status` column.
  const where = ['p.deleted_at IS NULL'];
  const params = [];
  if (q) { where.push('(p.title LIKE ? OR p.slug LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }
  if (status) { where.push('p.status = ?'); params.push(status); } else { where.push("p.status != 'trashed'"); }
  const pages = db.prepare(`SELECT p.*, u.name AS editor_name FROM pages p LEFT JOIN users u ON u.id = p.updated_by
      WHERE ${where.join(' AND ')} ORDER BY p.sort_order, p.title`).all(...params);
  view(res, 'pages-list', { title: 'Pages', pageTitle: 'Pages', pages, q, status, BLOCK_TYPES: blocksLib.BLOCK_TYPES,
    trashed: db.prepare('SELECT COUNT(*) AS n FROM pages WHERE deleted_at IS NOT NULL').get().n });
});

router.get('/pages/new', requirePermission('content.create'), (req, res) => {
  view(res, 'page-edit', { title: 'New page', pageTitle: 'Add new page', page: { id: null, title: '', slug: '', template: 'blocks', blocks: [], status: 'draft', noindex: 0 },
    blocks: [], BLOCK_TYPES: blocksLib.BLOCK_TYPES, revisions: [], autosave: null,
    media: db.prepare('SELECT id, filename, alt FROM media ORDER BY id DESC LIMIT 40').all() });
});

router.get('/pages/:id/edit', requirePermission('content.view'), (req, res) => {
  const page = db.prepare('SELECT * FROM pages WHERE id = ?').get(Number(req.params.id));
  if (!page) return res.status(404).render('admin/error', { title: 'Not found', status: 404, message: 'That page no longer exists.' });
  const revisions = db.prepare(`SELECT r.*, u.name AS author_name FROM page_revisions r LEFT JOIN users u ON u.id = r.author_id
      WHERE r.page_id = ? ORDER BY r.created_at DESC LIMIT 20`).all(page.id);
  view(res, 'page-edit', { title: page.title, pageTitle: `Edit: ${page.title}`, page,
    blocks: H.parseJson(page.blocks, []), BLOCK_TYPES: blocksLib.BLOCK_TYPES, revisions,
    autosave: autosaveFor('page', page.id),
    media: db.prepare('SELECT id, filename, alt FROM media ORDER BY id DESC LIMIT 40').all() });
});

function snapshotPage(page, userId, note) {
  db.prepare('INSERT INTO page_revisions (page_id, snapshot, note, author_id) VALUES (?,?,?,?)')
    .run(page.id, JSON.stringify(page), note || 'Saved', userId);
}
function snapshotPost(post, userId, note) {
  db.prepare('INSERT INTO post_revisions (post_id, snapshot, note, author_id) VALUES (?,?,?,?)')
    .run(post.id, JSON.stringify(post), note || 'Saved', userId);
}

function autosaveFor(entity, entityId) {
  try {
    const row = db.prepare('SELECT a.*, u.name AS author FROM autosaves a LEFT JOIN users u ON u.id = a.user_id WHERE a.entity = ? AND a.entity_id = ?').get(entity, entityId);
    if (!row) return null;
    return { ...row, data: H.parseJson(row.payload, {}) || {} };
  } catch { return null; }
}

function readBlocksFromForm(body) {
  // Blocks arrive as parallel arrays (type[], heading[], …) from the page builder.
  const types = [].concat(body.block_type || []);
  const out = [];
  types.forEach((type, i) => {
    if (!type) return;
    // Values arrive as parallel arrays. If an array length does not match the block count the
    // submission is malformed, so the field is dropped rather than attached to the wrong block.
    const get = (k) => {
      const raw = body[`block_${k}`];
      if (raw === undefined) return undefined;
      const arr = [].concat(raw);
      if (arr.length !== types.length) return undefined;
      return arr[i];
    };
    const block = { type };
    for (const key of ['eyebrow', 'title', 'subtitle', 'heading', 'subheading', 'html', 'variant', 'preselect', 'teamSlug',
      'pillar', 'filter', 'limit', 'team_slug', 'tone', 'text', 'note', 'category', 'question', 'answer', 'image', 'reverse', 'compact']) {
      const v = get(key);
      if (v !== undefined && v !== '') block[key] = /^limit$/.test(key) ? Number(v) : v;
    }
    for (const arrKey of ['actions', 'stats', 'items', 'steps', 'columns', 'rows', 'bullets', 'countries', 'badges']) {
      const raw = get(arrKey);
      if (raw === undefined) continue;
      try {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (parsed && (Array.isArray(parsed) || typeof parsed === 'object')) block[arrKey] = parsed;
      } catch { /* keep editor text out of the JSON path if it is malformed */ }
    }
    out.push(block);
  });
  return out;
}

router.post('/pages/:id?', requirePermission('content.edit'), (req, res) => {
  const id = req.params.id ? Number(req.params.id) : null;
  const b = req.body;
  const data = {
    title: String(b.title || 'Untitled').slice(0, 200),
    slug: H.slugify(b.slug || b.title) || 'page-' + Date.now(),
    template: ['blocks', 'home', 'tool'].includes(b.template) ? b.template : 'blocks',
    excerpt: String(b.excerpt || '').slice(0, 400),
    blocks: JSON.stringify(readBlocksFromForm(b)),
    seo_title: String(b.seo_title || '').slice(0, 200),
    seo_description: String(b.seo_description || '').slice(0, 400),
    canonical_url: String(b.canonical_url || '').slice(0, 300),
    noindex: H.bool(b.noindex) ? 1 : 0,
    updated_by: req.user.id,
    updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
  };
  const requestedStatus = ['draft', 'review', 'published', 'trashed'].includes(b.status) ? b.status : 'draft';
  const canPublish = can(req.user, 'content.publish');
  const status = (requestedStatus === 'published' && !canPublish) ? 'review' : requestedStatus;
  const publishAt = b.publish_at ? String(b.publish_at).replace('T', ' ') : null;

  if (id) {
    const before = db.prepare('SELECT * FROM pages WHERE id = ?').get(id);
    if (!before) return res.status(404).render('admin/error', { title: 'Not found', status: 404, message: 'Page not found.' });
    snapshotPage(before, req.user.id, 'Before save');
    db.prepare(`UPDATE pages SET title=?, slug=?, template=?, excerpt=?, blocks=?, seo_title=?, seo_description=?,
        canonical_url=?, noindex=?, status=?, publish_at=?, updated_by=?, updated_at=? WHERE id=?`)
      .run(data.title, data.slug, data.template, data.excerpt, data.blocks, data.seo_title, data.seo_description,
        data.canonical_url, data.noindex, status, publishAt, data.updated_by, data.updated_at, id);
    audit(req.user, 'page.update', 'pages', id, { title: data.title, status }, req.ip);
    if (status === 'published' && !publishAt) reindexPage(id);
  } else {
    const info = db.prepare(`INSERT INTO pages (title, slug, template, excerpt, blocks, seo_title, seo_description,
        canonical_url, noindex, status, publish_at, author_id, updated_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run(data.title, data.slug, data.template, data.excerpt, data.blocks, data.seo_title, data.seo_description,
        data.canonical_url, data.noindex, status, publishAt, req.user.id, req.user.id);
    audit(req.user, 'page.create', 'pages', info.lastInsertRowid, { title: data.title, status }, req.ip);
    db.prepare('UPDATE pages SET author_id = COALESCE(author_id, ?) WHERE id = ?').run(req.user.id, info.lastInsertRowid);
    snapshotPage(db.prepare('SELECT * FROM pages WHERE id = ?').get(info.lastInsertRowid), req.user.id, 'Created');
    if (status === 'published') reindexPage(info.lastInsertRowid);
    return res.redirect('/admin/pages/' + info.lastInsertRowid + '/edit?saved=1');
  }
  res.redirect('/admin/pages/' + id + '/edit?saved=1');
});

/* Autosave: the editor posts its working copy every 45 seconds so nothing is lost. */
router.post('/pages/:id/autosave', requirePermission('content.edit'), express.json({ limit: '512kb' }), (req, res) => {
  const id = Number(req.params.id);
  const page = db.prepare('SELECT id FROM pages WHERE id = ?').get(id);
  if (!page) return res.status(404).json({ ok: false, error: 'Page not found' });
  const payload = JSON.stringify({ ...req.body, blocks: readBlocksFromForm(req.body || {}) });
  db.prepare(`INSERT INTO autosaves (entity, entity_id, payload, user_id, updated_at) VALUES ('page',?,?,?,datetime('now'))
              ON CONFLICT(entity, entity_id) DO UPDATE SET payload=excluded.payload, user_id=excluded.user_id, updated_at=datetime('now')`)
    .run(id, payload, req.user.id);
  res.json({ ok: true, saved_at: new Date().toISOString() });
});

router.post('/pages/:id/autosave/discard', requirePermission('content.edit'), (req, res) => {
  db.prepare("DELETE FROM autosaves WHERE entity = 'page' AND entity_id = ?").run(Number(req.params.id));
  res.redirect('/admin/pages/' + req.params.id + '/edit?notice=' + encodeURIComponent('Autosaved working copy discarded.'));
});

router.post('/posts/:id/autosave', requirePermission('content.edit'), express.json({ limit: '512kb' }), (req, res) => {
  const id = Number(req.params.id);
  const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(id);
  if (!post) return res.status(404).json({ ok: false, error: 'Guide not found' });
  db.prepare(`INSERT INTO autosaves (entity, entity_id, payload, user_id, updated_at) VALUES ('post',?,?,?,datetime('now'))
              ON CONFLICT(entity, entity_id) DO UPDATE SET payload=excluded.payload, user_id=excluded.user_id, updated_at=datetime('now')`)
    .run(id, JSON.stringify(req.body || {}), req.user.id);
  res.json({ ok: true, saved_at: new Date().toISOString() });
});

router.post('/pages/:id/restore/:revId', requirePermission('content.edit'), (req, res) => {
  const rev = db.prepare('SELECT * FROM page_revisions WHERE id = ? AND page_id = ?').get(Number(req.params.revId), Number(req.params.id));
  if (!rev) return res.status(404).render('admin/error', { title: 'Not found', status: 404, message: 'Revision not found.' });
  const snap = JSON.parse(rev.snapshot);
  db.prepare(`UPDATE pages SET title=?, blocks=?, seo_title=?, seo_description=?, status='draft', updated_by=?, updated_at=datetime('now') WHERE id=?`)
    .run(snap.title, snap.blocks, snap.seo_title, snap.seo_description, req.user.id, Number(req.params.id));
  snapshotPage(db.prepare('SELECT * FROM pages WHERE id = ?').get(Number(req.params.id)), req.user.id, `Restored revision #${rev.id} into draft`);
  audit(req.user, 'page.restore', 'pages', Number(req.params.id), { revision: rev.id }, req.ip);
  searchRemove('page', Number(req.params.id));
  res.redirect('/admin/pages/' + req.params.id + '/edit?restored=1');
});

router.post('/pages/:id/status', requirePermission('content.publish'), (req, res) => {
  const status = ['draft', 'review', 'published', 'trashed'].includes(req.body.status) ? req.body.status : 'draft';
  const page = db.prepare('SELECT * FROM pages WHERE id = ?').get(Number(req.params.id));
  if (!page) return res.status(404).render('admin/error', { title: 'Not found', status: 404, message: 'Page not found.' });
  db.prepare("UPDATE pages SET status=?, deleted_at = CASE WHEN ? = 'trashed' THEN datetime('now') ELSE NULL END, updated_by=?, updated_at=datetime('now') WHERE id=?")
    .run(status, status, req.user.id, page.id);
  if (status === 'published') {
    reindexPage(page.id);
    gsc.publishIndexingNotification(`${seo.siteBase(req)}/${page.slug}`, 'URL_UPDATED').catch(() => {});
  } else {
    searchRemove('page', page.id);
    if (status === 'trashed') {
      gsc.publishIndexingNotification(`${seo.siteBase(req)}/${page.slug}`, 'URL_DELETED').catch(() => {});
    }
  }
  audit(req.user, 'page.status', 'pages', page.id, { from: page.status, to: status }, req.ip);
  res.redirect(req.get('referer') || '/admin/pages');
});

function reindexPage(id) {
  const p = db.prepare('SELECT * FROM pages WHERE id = ?').get(id);
  if (!p || p.status !== 'published') return;
  const text = (H.parseJson(p.blocks, []) || []).map(b => [b.title, b.subtitle, b.heading, b.subheading, b.html, b.answer]
    .filter(Boolean).join(' ')).join(' ');
  searchReindex('page', p.id, p.title, `${p.excerpt || ''} ${H.stripTags(text)}`, '/' + p.slug);
}

/* ============================================================ POSTS ===== */
router.get('/posts', requirePermission('content.view'), (req, res) => {
  const q = String(req.query.q || '').trim();
  const where = ['p.deleted_at IS NULL'];
  const params = [];
  if (q) { where.push('(p.title LIKE ? OR p.body LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }
  const posts = db.prepare(`SELECT p.*, c.name AS category_name, u.name AS author_name FROM posts p
      LEFT JOIN categories c ON c.id = p.category_id LEFT JOIN users u ON u.id = p.author_id
      WHERE ${where.join(' AND ')} ORDER BY p.updated_at DESC`).all(...params);
  view(res, 'posts-list', { title: 'Posts & guides', pageTitle: 'Posts & guides', posts, q,
    categories: db.prepare('SELECT * FROM categories ORDER BY id').all() });
});

router.get('/posts/new', requirePermission('content.create'), (req, res) => {
  view(res, 'post-edit', { title: 'New guide', pageTitle: 'Add new guide',
    post: { id: null, title: '', slug: '', body: '', status: 'draft', key_takeaways: '[]', tags: '[]', faq_refs: '[]' }, autosave: null,
    takeaways: [], tags: [], categories: db.prepare('SELECT * FROM categories ORDER BY id').all(), revisions: [],
    media: db.prepare('SELECT id, filename, alt FROM media ORDER BY id DESC LIMIT 40').all() });
});

router.get('/posts/:id/edit', requirePermission('content.view'), (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(Number(req.params.id));
  if (!post) return res.status(404).render('admin/error', { title: 'Not found', status: 404, message: 'Post not found.' });
  view(res, 'post-edit', { title: post.title, pageTitle: `Edit: ${post.title}`, post,
    takeaways: H.parseJson(post.key_takeaways, []), tags: H.parseJson(post.tags, []),
    categories: db.prepare('SELECT * FROM categories ORDER BY id').all(),
    autosave: autosaveFor('post', post.id),
    revisions: db.prepare(`SELECT r.*, u.name AS author_name FROM post_revisions r LEFT JOIN users u ON u.id = r.author_id
      WHERE r.post_id = ? ORDER BY r.created_at DESC LIMIT 15`).all(post.id),
    media: db.prepare('SELECT id, filename, alt FROM media ORDER BY id DESC LIMIT 40').all() });
});

router.post('/posts/:id?', requirePermission('content.edit'), (req, res) => {
  const id = req.params.id ? Number(req.params.id) : null;
  const b = req.body;
  const body = H.sanitizeHtml(String(b.body || ''));
  const takeaways = String(b.key_takeaways_text || '').split('\n').map(s => s.trim()).filter(Boolean).slice(0, 8);
  const data = {
    title: String(b.title || 'Untitled').slice(0, 220),
    slug: H.slugify(b.slug || b.title) || 'guide-' + Date.now(),
    excerpt: String(b.excerpt || H.answerSummary(body, 200)).slice(0, 400),
    body, answer_summary: String(b.answer_summary || H.answerSummary(body, 320)).slice(0, 600),
    key_takeaways: JSON.stringify(takeaways),
    tags: JSON.stringify(String(b.tags || '').split(',').map(s => s.trim()).filter(Boolean).slice(0, 10)),
    category_id: b.category_id ? Number(b.category_id) : null,
    primary_pillar: String(b.primary_pillar || 'resources').slice(0, 40),
    target_query: String(b.target_query || '').slice(0, 200),
    seo_title: String(b.seo_title || '').slice(0, 200),
    seo_description: String(b.seo_description || '').slice(0, 400),
    noindex: H.bool(b.noindex) ? 1 : 0,
    read_minutes: H.readingTime(body),
    geo_summary: String(b.geo_summary || '').slice(0, 600),
    cover_media_id: b.cover_media_id ? Number(b.cover_media_id) : null,
    faq_refs: JSON.stringify(String(b.faq_refs || '').split(',').map(v => Number(v.trim())).filter(Boolean).slice(0, 8)),
    reviewer_id: can(req.user, 'content.review') ? req.user.id : null,
    publish_at: b.publish_at ? String(b.publish_at).replace('T', ' ') : new Date().toISOString().slice(0, 19).replace('T', ' '),
    updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
  };
  const requested = ['draft', 'review', 'published', 'trashed'].includes(b.status) ? b.status : 'draft';
  const status = (requested === 'published' && !can(req.user, 'content.publish')) ? 'review' : requested;

  if (id) {
    const before = db.prepare('SELECT * FROM posts WHERE id = ?').get(id);
    if (!before) return res.status(404).render('admin/error', { title: 'Not found', status: 404, message: 'Post not found.' });
    snapshotPost(before, req.user.id, 'Before save');
    db.prepare(`UPDATE posts SET title=?, slug=?, excerpt=?, body=?, answer_summary=?, key_takeaways=?, tags=?,
        category_id=?, primary_pillar=?, target_query=?, seo_title=?, seo_description=?, noindex=?, read_minutes=?,
        geo_summary=?, cover_media_id=?, faq_refs=?, reviewer_id=COALESCE(?, reviewer_id), publish_at=?, status=?, updated_at=? WHERE id=?`)
      .run(data.title, data.slug, data.excerpt, data.body, data.answer_summary, data.key_takeaways, data.tags,
        data.category_id, data.primary_pillar, data.target_query, data.seo_title, data.seo_description, data.noindex,
        data.read_minutes, data.geo_summary, data.cover_media_id, data.faq_refs, data.reviewer_id,
        data.publish_at, status, data.updated_at, id);
    audit(req.user, 'post.update', 'posts', id, { title: data.title, status }, req.ip);
    if (status === 'published') reindexPost(id); else searchRemove('post', id);
    return res.redirect('/admin/posts/' + id + '/edit?saved=1');
  }
  const info = db.prepare(`INSERT INTO posts (title, slug, excerpt, body, answer_summary, key_takeaways, tags,
      category_id, primary_pillar, target_query, seo_title, seo_description, noindex, read_minutes,
      geo_summary, cover_media_id, faq_refs, reviewer_id, publish_at,
      status, author_id, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(data.title, data.slug, data.excerpt, data.body, data.answer_summary, data.key_takeaways, data.tags,
      data.category_id, data.primary_pillar, data.target_query, data.seo_title, data.seo_description, data.noindex,
      data.read_minutes, data.geo_summary, data.cover_media_id, data.faq_refs, data.reviewer_id,
      data.publish_at, status, req.user.id, data.updated_at);
  if (status === 'published') reindexPost(info.lastInsertRowid);
  audit(req.user, 'post.create', 'posts', info.lastInsertRowid, { title: data.title, status }, req.ip);
  res.redirect('/admin/posts/' + info.lastInsertRowid + '/edit?saved=1');
});

function reindexPost(id) {
  const p = db.prepare('SELECT * FROM posts WHERE id = ?').get(id);
  if (!p || p.status !== 'published') return;
  searchReindex('post', p.id, p.title, `${p.answer_summary || ''} ${H.stripTags(p.body)}`, '/resources/' + p.slug);
}

router.post('/posts/:id/status', requirePermission('content.publish'), (req, res) => {
  const status = ['draft', 'review', 'published', 'trashed'].includes(req.body.status) ? req.body.status : 'draft';
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(Number(req.params.id));
  if (!post) return res.status(404).render('admin/error', { title: 'Not found', status: 404, message: 'Post not found.' });
  db.prepare(`UPDATE posts SET status=?, deleted_at = CASE WHEN ? = 'trashed' THEN datetime('now') ELSE NULL END,
              publish_at = COALESCE(publish_at, datetime('now')) WHERE id=?`).run(status, status, post.id);
  if (status === 'published') {
    reindexPost(post.id);
    gsc.publishIndexingNotification(`${seo.siteBase(req)}/resources/${post.slug}`, 'URL_UPDATED').catch(() => {});
  } else {
    searchRemove('post', post.id);
    if (status === 'trashed') {
      gsc.publishIndexingNotification(`${seo.siteBase(req)}/resources/${post.slug}`, 'URL_DELETED').catch(() => {});
    }
  }
  audit(req.user, 'post.status', 'posts', post.id, { from: post.status, to: status }, req.ip);
  res.redirect(req.get('referer') || '/admin/posts');
});

/* ========================================================== PROGRAMS ==== */
router.get('/programs', requirePermission('content.view'), (req, res) => {
  const programs = db.prepare(`SELECT p.*, t.name AS trainer_name, c.name AS country_name,
      (SELECT COUNT(*) FROM fee_versions f WHERE f.program_id = p.id) AS fee_versions
      FROM programs p LEFT JOIN team t ON t.id = p.trainer_id LEFT JOIN countries c ON c.id = p.country_id
      ORDER BY p.pillar, p.sort_order`).all();
  view(res, 'programs-list', { title: 'Programs & services', pageTitle: 'Programs, visa packages & courses', programs });
});

router.get('/programs/new', requirePermission('content.create'), (req, res) => {
  view(res, 'program-edit', { title: 'New program', pageTitle: 'Add program',
    program: { id: null, pillar: 'career', type: 'study', name: '', slug: '', status: 'draft', highlights: '[]', included: '[]', process: '[]' },
    highlights: [], included: [], process: [], fees: [], team: db.prepare('SELECT id, name FROM team ORDER BY sort_order').all(),
    countries: db.prepare('SELECT id, name FROM countries ORDER BY sort_order').all() });
});

router.get('/programs/:id/edit', requirePermission('content.view'), (req, res) => {
  const program = db.prepare('SELECT * FROM programs WHERE id = ?').get(Number(req.params.id));
  if (!program) return res.status(404).render('admin/error', { title: 'Not found', status: 404, message: 'Program not found.' });
  view(res, 'program-edit', { title: program.name, pageTitle: `Edit: ${program.name}`, program,
    highlights: H.parseJson(program.highlights, []), included: H.parseJson(program.included, []),
    process: H.parseJson(program.process, []),
    fees: db.prepare('SELECT * FROM fee_versions WHERE program_id = ? ORDER BY id').all(program.id)
      .map(f => ({ ...f, schedule_list: H.parseJson(f.schedule, []) })),
    team: db.prepare('SELECT id, name FROM team ORDER BY sort_order').all(),
    countries: db.prepare('SELECT id, name FROM countries ORDER BY sort_order').all() });
});

router.post('/programs/:id?', requirePermission('content.edit'), (req, res) => {
  const id = req.params.id ? Number(req.params.id) : null;
  const b = req.body;
  const list = (text, limit = 12) => JSON.stringify(String(text || '').split('\n').map(s => s.trim()).filter(Boolean).slice(0, limit));
  let process = [];
  try { process = JSON.parse(b.process_json || '[]'); } catch { process = []; }
  const data = {
    name: String(b.name || 'Untitled program').slice(0, 200),
    slug: H.slugify(b.slug || b.name) || 'program-' + Date.now(),
    pillar: ['career', 'immigration', 'cambridge'].includes(b.pillar) ? b.pillar : 'career',
    type: ['study', 'visa', 'course', 'service'].includes(b.type) ? b.type : 'study',
    audience: String(b.audience || '').slice(0, 400),
    summary: String(b.summary || '').slice(0, 800),
    answer_summary: String(b.answer_summary || '').slice(0, 900),
    highlights: list(b.highlights_text, 10), included: list(b.included_text, 12),
    process: JSON.stringify(process),
    delivery: String(b.delivery || '').slice(0, 200), duration: String(b.duration || '').slice(0, 200),
    fee_from: b.fee_from === '' ? null : Number(b.fee_from), fee_to: b.fee_to === '' ? null : Number(b.fee_to),
    currency: String(b.currency || 'GBP').slice(0, 4), fee_notes: String(b.fee_notes || '').slice(0, 600),
    location: String(b.location || '').slice(0, 200), availability: String(b.availability || 'Open').slice(0, 40),
    processing_time: String(b.processing_time || '').slice(0, 120),
    trainer_id: b.trainer_id ? Number(b.trainer_id) : null,
    country_id: b.country_id ? Number(b.country_id) : null,
    cta_label: String(b.cta_label || 'Request a Consultation').slice(0, 80),
    urgency: String(b.urgency || '').slice(0, 300),
    status: ['draft', 'published', 'archived'].includes(b.status) ? b.status : 'draft',
    featured: H.bool(b.featured) ? 1 : 0,
    sort_order: Number(b.sort_order || 50),
    seo_title: String(b.seo_title || '').slice(0, 200), seo_description: String(b.seo_description || '').slice(0, 400),
    updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
  };
  const keys = Object.keys(data);
  if (id) {
    db.prepare(`UPDATE programs SET ${keys.map(k => k + '=?').join(', ')} WHERE id=?`).run(...keys.map(k => data[k]), id);
    audit(req.user, 'program.update', 'programs', id, { name: data.name, status: data.status }, req.ip);
    if (data.status === 'published') searchReindex('program', id, data.name, `${data.answer_summary} ${data.summary}`, '/services/' + data.slug);
    else searchRemove('program', id);
    return res.redirect('/admin/programs/' + id + '/edit?saved=1');
  }
  const info = db.prepare(`INSERT INTO programs (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`).run(...keys.map(k => data[k]));
  audit(req.user, 'program.create', 'programs', info.lastInsertRowid, { name: data.name }, req.ip);
  res.redirect('/admin/programs/' + info.lastInsertRowid + '/edit?saved=1');
});

router.post('/programs/:id/fees', requirePermission('rules.approve'), (req, res) => {
  const b = req.body;
  let schedule = [];
  try { schedule = JSON.parse(b.schedule_json || '[]'); } catch {}
  const info = db.prepare(`INSERT INTO fee_versions (program_id, label, amount, currency, schedule, effective_date,
      source_name, source_url, review_status, reviewer_id, reviewed_at, version, note, published)
    VALUES (?,?,?,?,?,?,?,?,?,?,datetime('now'),?,?,1)`).run(
    Number(req.params.id), String(b.label || 'Fee version').slice(0, 200),
    b.amount === '' ? null : Number(b.amount), String(b.currency || 'GBP').slice(0, 4), JSON.stringify(schedule),
    b.effective_date || null, String(b.source_name || '').slice(0, 200), String(b.source_url || '').slice(0, 300),
    ['approved', 'needs_review', 'expired'].includes(b.review_status) ? b.review_status : 'needs_review',
    req.user.id, String(b.version || 'v1').slice(0, 20), String(b.note || '').slice(0, 400));
  audit(req.user, 'fee.version.create', 'fee_versions', info.lastInsertRowid, { program_id: Number(req.params.id) }, req.ip);
  res.redirect('/admin/programs/' + req.params.id + '/edit?saved=fee');
});

/* ================================================== DESTINATIONS ======== */
router.get('/countries', requirePermission('content.view'), (req, res) => {
  const countries = db.prepare(`SELECT c.*,
      (SELECT COUNT(*) FROM country_costs cc WHERE cc.country_id = c.id) AS city_counts,
      (SELECT COUNT(*) FROM funds_rules f WHERE f.country_id = c.id) AS rules
      FROM countries c ORDER BY c.sort_order`).all();
  view(res, 'countries-list', { title: 'Destinations', pageTitle: 'Destination intelligence', countries });
});

router.get('/countries/:id/edit', requirePermission('content.view'), (req, res) => {
  const country = db.prepare('SELECT * FROM countries WHERE id = ?').get(Number(req.params.id));
  if (!country) return res.status(404).render('admin/error', { title: 'Not found', status: 404, message: 'Destination not found.' });
  view(res, 'country-edit', { title: country.name, pageTitle: `Edit: ${country.name}`,
    country: { ...country, visa_purposes_list: H.parseJson(country.visa_purposes, []),
      requirements_list: H.parseJson(country.requirements, []), highlights_list: H.parseJson(country.highlights, []) },
    costs: db.prepare('SELECT * FROM country_costs WHERE country_id = ? ORDER BY scenario, city_tier, total').all(country.id),
    rules: db.prepare(`SELECT f.*, u.name AS reviewer_name FROM funds_rules f LEFT JOIN users u ON u.id = f.reviewer_id
      WHERE f.country_id = ? ORDER BY f.id`).all(country.id) });
});

router.post('/countries/:id', requirePermission('content.edit'), (req, res) => {
  const b = req.body;
  db.prepare(`UPDATE countries SET name=?, region=?, bloc=?, iso2=?, summary=?, answer_summary=?, visa_purposes=?,
      currency=?, currency_symbol=?, processing_time=?, living_total=?, living_currency=?, requirements=?, highlights=?,
      cost_note=?, featured=?, published=?, sort_order=?, seo_title=?, seo_description=?, updated_at=datetime('now')
      WHERE id=?`).run(
    String(b.name).slice(0, 120), String(b.region || 'Europe').slice(0, 60), String(b.bloc || '').slice(0, 60),
    String(b.iso2 || '').slice(0, 2).toUpperCase(), String(b.summary || '').slice(0, 900),
    String(b.answer_summary || '').slice(0, 900),
    JSON.stringify(String(b.visa_purposes || 'study,visit').split(',').map(s => s.trim()).filter(Boolean)),
    String(b.currency || 'USD').slice(0, 4), String(b.currency_symbol || '').slice(0, 6),
    String(b.processing_time || '').slice(0, 120), Number(b.living_total || 0), String(b.living_currency || 'USD').slice(0, 4),
    JSON.stringify(String(b.requirements_text || '').split('\n').map(s => s.trim()).filter(Boolean)),
    JSON.stringify(String(b.highlights_text || '').split('\n').map(s => s.trim()).filter(Boolean)),
    String(b.cost_note || '').slice(0, 500), H.bool(b.featured) ? 1 : 0, H.bool(b.published) ? 1 : 0,
    Number(b.sort_order || 50), String(b.seo_title || '').slice(0, 200), String(b.seo_description || '').slice(0, 400),
    Number(req.params.id));
  audit(req.user, 'country.update', 'countries', Number(req.params.id), { name: b.name }, req.ip);
  const c = db.prepare('SELECT * FROM countries WHERE id = ?').get(Number(req.params.id));
  searchReindex('country', c.id, c.name, `${c.answer_summary} ${c.summary}`, '/destinations/' + c.slug);
  res.redirect('/admin/countries/' + req.params.id + '/edit?saved=1');
});

router.post('/countries/:id/costs', requirePermission('content.edit'), (req, res) => {
  const b = req.body;
  const vals = ['rent', 'food', 'transit', 'insurance', 'utilities', 'contingency'].map(k => Number(b[k] || 0));
  const total = vals.reduce((a, c) => a + c, 0);
  const info = db.prepare(`INSERT INTO country_costs (country_id, city, city_tier, scenario, rent, food, transit,
      insurance, utilities, contingency, total, currency, source_name, source_url, observed_at, review_status)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    Number(req.params.id), String(b.city || 'City').slice(0, 80),
    ['capital', 'major', 'regional'].includes(b.city_tier) ? b.city_tier : 'major',
    ['budget', 'standard', 'comfortable'].includes(b.scenario) ? b.scenario : 'standard',
    ...vals, total, String(b.currency || 'USD').slice(0, 4), String(b.source_name || 'Kishaa maintained profile').slice(0, 200),
    String(b.source_url || '').slice(0, 300), b.observed_at || new Date().toISOString().slice(0, 10),
    ['approved', 'needs_review'].includes(b.review_status) ? b.review_status : 'approved');
  audit(req.user, 'cost.create', 'country_costs', info.lastInsertRowid, { country_id: Number(req.params.id), city: b.city }, req.ip);
  res.redirect('/admin/countries/' + req.params.id + '/edit?saved=cost');
});

router.post('/costs/:id/delete', requirePermission('content.edit'), (req, res) => {
  const row = db.prepare('SELECT * FROM country_costs WHERE id = ?').get(Number(req.params.id));
  if (row) { db.prepare('DELETE FROM country_costs WHERE id = ?').run(row.id); audit(req.user, 'cost.delete', 'country_costs', row.id, { city: row.city }, req.ip); }
  res.redirect('/admin/countries/' + (row?.country_id || '') + '/edit?saved=deleted');
});

/* =================================================== FUNDS RULES ======= */
router.get('/funds-rules', requirePermission('content.view'), (req, res) => {
  const rules = db.prepare(`SELECT f.*, c.name AS country_name, c.slug AS country_slug, u.name AS reviewer_name
      FROM funds_rules f JOIN countries c ON c.id = f.country_id LEFT JOIN users u ON u.id = f.reviewer_id
      ORDER BY c.sort_order, f.id`).all();
  view(res, 'funds-list', { title: 'Statutory funds rules', pageTitle: 'Statutory proof-of-funds rules', rules,
    countries: db.prepare('SELECT id, name FROM countries ORDER BY sort_order').all() });
});

router.post('/funds-rules/:id?', requirePermission('rules.approve'), (req, res) => {
  const b = req.body;
  const id = req.params.id ? Number(req.params.id) : null;
  const data = {
    country_id: Number(b.country_id), route_name: String(b.route_name || '').slice(0, 200),
    visa_purpose: ['study', 'visit', 'work', 'business'].includes(b.visa_purpose) ? b.visa_purpose : 'study',
    rule_type: ['maintenance', 'blocked_account', 'held_funds'].includes(b.rule_type) ? b.rule_type : 'maintenance',
    statutory_rate: b.statutory_rate === '' ? null : Number(b.statutory_rate),
    rate_currency: String(b.rate_currency || 'EUR').slice(0, 4),
    months: Number(b.months || 12),
    total_required: b.total_required === '' ? null : Number(b.total_required),
    total_currency: String(b.total_currency || 'EUR').slice(0, 4),
    pkr_equivalent: b.pkr_equivalent === '' ? null : Number(b.pkr_equivalent),
    holding_period: String(b.holding_period || '').slice(0, 300),
    tuition_component: String(b.tuition_component || '').slice(0, 300),
    dependents_note: String(b.dependents_note || '').slice(0, 300),
    family_rule: String(b.family_rule || '').slice(0, 400),
    source_name: String(b.source_name || '').slice(0, 250), source_url: String(b.source_url || '').slice(0, 400),
    effective_date: b.effective_date || null,
    review_status: ['approved', 'needs_review', 'expired'].includes(b.review_status) ? b.review_status : 'needs_review',
    reviewer_id: req.user.id, reviewed_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
    version: String(b.version || 'v1').slice(0, 20),
    note: String(b.note || '').slice(0, 600),
    published: H.bool(b.published) ? 1 : 0,
  };
  if (id) {
    const keys = Object.keys(data);
    db.prepare(`UPDATE funds_rules SET ${keys.map(k => k + '=?').join(', ')} WHERE id=?`).run(...keys.map(k => data[k]), id);
    audit(req.user, 'funds.rule.update', 'funds_rules', id, { country_id: data.country_id, status: data.review_status, version: data.version }, req.ip);
  } else {
    const keys = Object.keys(data);
    const info = db.prepare(`INSERT INTO funds_rules (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`).run(...keys.map(k => data[k]));
    audit(req.user, 'funds.rule.create', 'funds_rules', info.lastInsertRowid, { country_id: data.country_id, status: data.review_status }, req.ip);
  }
  res.redirect('/admin/funds-rules?saved=1');
});

router.post('/funds-rules/:id/review', requirePermission('rules.approve'), (req, res) => {
  const status = ['approved', 'needs_review', 'expired'].includes(req.body.review_status) ? req.body.review_status : 'needs_review';
  const rule = db.prepare('SELECT * FROM funds_rules WHERE id = ?').get(Number(req.params.id));
  if (!rule) return res.status(404).render('admin/error', { title: 'Not found', status: 404, message: 'Rule not found.' });
  db.prepare(`UPDATE funds_rules SET review_status=?, reviewer_id=?, reviewed_at=datetime('now'), version=?, note=?
              WHERE id=?`).run(status, req.user.id, String(req.body.version || rule.version).slice(0, 20),
    String(req.body.note || rule.note || '').slice(0, 600), rule.id);
  audit(req.user, 'funds.rule.review', 'funds_rules', rule.id, { from: rule.review_status, to: status, version: req.body.version }, req.ip);
  res.redirect('/admin/funds-rules?saved=reviewed');
});

/* =========================================================== LEADS ====== */
router.get('/leads', requirePermission('leads.view'), async (req, res) => {
  if (supabase.isAvailable()) {
    try {
      const { data: sbLeads } = await supabase.getClient().from('leads').select('*').order('created_at', { ascending: false }).limit(200);
      if (sbLeads && sbLeads.length > 0) {
        const insLead = db.prepare(`INSERT OR REPLACE INTO leads (
          id, reference, idempotency_key, full_name, email, phone, whatsapp,
          contact_preference, best_time, destination_intent, country_id, program_id,
          timeline, budget_band, notes, source_type, source_page, utm_source,
          utm_medium, utm_campaign, utm_term, utm_content, referrer, ip_hash,
          user_agent, consent_notice_version, marketing_consent, status, stage,
          stage_reason, score, owner_id, priority, first_response_at, next_follow_up_at,
          last_activity_at, region, created_at, updated_at
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
        for (const l of sbLeads) {
          insLead.run(
            l.id, l.reference, l.idempotency_key, l.full_name, l.email, l.phone, l.whatsapp,
            l.contact_preference, l.best_time, l.destination_intent, l.country_id, l.program_id,
            l.timeline, l.budget_band, l.notes, l.source_type, l.source_page, l.utm_source,
            l.utm_medium, l.utm_campaign, l.utm_term, l.utm_content, l.referrer, l.ip_hash,
            l.user_agent, l.consent_notice_version, l.marketing_consent, l.status, l.stage,
            l.stage_reason, l.score, l.owner_id, l.priority, l.first_response_at, l.next_follow_up_at,
            l.last_activity_at, l.region, l.created_at, l.updated_at
          );
        }
      }
    } catch (e) {
      console.warn('[admin:leads] sync from supabase error:', e.message);
    }
  }

  const u = req.user;
  const scope = leadScope(u);
  const where = [scope.clause];
  const params = [...scope.params];
  const filters = { q: String(req.query.q || '').trim(), stage: req.query.stage || '', interest: req.query.interest || '',
    owner: req.query.owner || '', source: req.query.source || '', due: req.query.due || '', from: req.query.from || '', to: req.query.to || '' };
  if (filters.q) { where.push('(l.full_name LIKE ? OR l.reference LIKE ? OR l.email LIKE ? OR l.phone LIKE ?)');
    params.push(`%${filters.q}%`, `%${filters.q}%`, `%${filters.q}%`, `%${filters.q}%`); }
  if (filters.stage) { where.push('l.stage = ?'); params.push(filters.stage); }
  if (filters.interest) { where.push('l.interest = ?'); params.push(filters.interest); }
  if (filters.source) { where.push('l.source_type = ?'); params.push(filters.source); }
  if (filters.owner) {
    const owner = db.prepare('SELECT id FROM users WHERE email = ? OR name = ?').get(filters.owner, filters.owner);
    where.push('l.owner_id = ?'); params.push(owner?.id || -1);
  }
  if (filters.due === 'overdue') where.push("l.next_follow_up_at IS NOT NULL AND l.next_follow_up_at < datetime('now') AND l.stage NOT IN ('enrolled','closed')");
  if (filters.due === 'today') where.push("date(l.next_follow_up_at) = date('now')");
  if (filters.from) { where.push('date(l.created_at) >= date(?)'); params.push(filters.from); }
  if (filters.to) { where.push('date(l.created_at) <= date(?)'); params.push(filters.to); }
  const page = Number(req.query.page || 1);
  const perPage = 25;
  const total = db.prepare(`SELECT COUNT(*) AS n FROM leads l WHERE ${where.join(' AND ')}`).get(...params).n;
  const pg = H.paginate(total, page, perPage);
  const leads = db.prepare(`SELECT l.*, u.name AS owner_name, p.name AS program_name, c.name AS country_name,
      (SELECT COUNT(*) FROM lead_activities a WHERE a.lead_id = l.id) AS activity_count
      FROM leads l LEFT JOIN users u ON u.id = l.owner_id LEFT JOIN programs p ON p.id = l.program_id
      LEFT JOIN countries c ON c.id = l.country_id WHERE ${where.join(' AND ')}
      ORDER BY CASE l.stage WHEN 'new' THEN 0 WHEN 'contacted' THEN 1 WHEN 'qualified' THEN 2 ELSE 3 END,
      l.created_at DESC LIMIT ? OFFSET ?`).all(...params, perPage, pg.offset);
  const owners = db.prepare(`SELECT id, name, team FROM users WHERE role IN ('lead_manager','trainer','administrator') AND status='active'`).all();
  view(res, 'leads-list', { title: 'Leads', pageTitle: 'Lead workspace', leads, filters, pagination: pg, owners,
    stats: {
      new: db.prepare(`SELECT COUNT(*) AS n FROM leads l WHERE ${scope.clause} AND l.stage='new'`).get(...scope.params).n,
      overdue: db.prepare(`SELECT COUNT(*) AS n FROM leads l WHERE ${scope.clause} AND l.next_follow_up_at < datetime('now') AND l.stage NOT IN ('enrolled','closed')`).get(...scope.params).n,
      unassigned: db.prepare(`SELECT COUNT(*) AS n FROM leads l WHERE ${scope.clause} AND l.owner_id IS NULL`).get(...scope.params).n,
      total,
    } });
});

router.get('/leads/export', requirePermission('leads.export'), (req, res) => {
  const scope = leadScope(req.user);
  const rows = db.prepare(`SELECT l.reference, l.created_at, l.full_name, l.email, l.phone, l.whatsapp,
      l.contact_preference, l.interest, l.service_context, l.stage, l.stage_reason, u.name AS owner_name,
      l.source_type, l.source_page, l.next_follow_up_at, l.first_response_at, l.consent_notice_version,
      l.marketing_consent, l.region, c.name AS country_name, p.name AS program_name
      FROM leads l LEFT JOIN users u ON u.id = l.owner_id LEFT JOIN countries c ON c.id = l.country_id
      LEFT JOIN programs p ON p.id = l.program_id WHERE ${scope.clause} ORDER BY l.created_at DESC LIMIT 5000`).all(...scope.params);
  audit(req.user, 'leads.export', 'leads', null, { rows: rows.length, filters: req.query }, req.ip);
  const csv = H.toCsv(rows, ['reference', 'created_at', 'full_name', 'email', 'phone', 'whatsapp', 'contact_preference',
    'interest', 'service_context', 'stage', 'stage_reason', 'owner_name', 'source_type', 'source_page', 'next_follow_up_at',
    'first_response_at', 'consent_notice_version', 'marketing_consent', 'region', 'country_name', 'program_name']);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="kishaa-leads-${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send('\uFEFF' + csv); // BOM keeps Excel from mangling the encoding
});

router.get('/leads/:id', requirePermission('leads.view'), (req, res) => {
  const scope = leadScope(req.user);
  const lead = db.prepare(`SELECT l.*, u.name AS owner_name, p.name AS program_name, p.slug AS program_slug,
      c.name AS country_name FROM leads l LEFT JOIN users u ON u.id = l.owner_id
      LEFT JOIN programs p ON p.id = l.program_id LEFT JOIN countries c ON c.id = l.country_id
      WHERE l.id = ? AND ${scope.clause}`).get(Number(req.params.id), ...scope.params);
  if (!lead) {
    return res.status(404).render('admin/error', { title: 'Access denied', status: 404,
      message: 'That lead is not assigned to you. Trainers and consultants see only their assigned records — this is enforced on the server, not just hidden in the interface.' });
  }
  const activities = db.prepare(`SELECT a.*, u.name AS actor_display FROM lead_activities a LEFT JOIN users u ON u.id = a.actor_id
      WHERE a.lead_id = ? ORDER BY a.created_at DESC`).all(lead.id);
  const consultations = db.prepare('SELECT * FROM consultations WHERE lead_id = ? ORDER BY id DESC').all(lead.id);
  const notifications = db.prepare('SELECT * FROM notifications WHERE lead_id = ? ORDER BY id DESC').all(lead.id);
  const duplicates = db.prepare('SELECT id, reference, full_name, created_at, stage FROM leads WHERE (id = ? OR duplicate_of = ?) AND id != ?')
    .all(lead.duplicate_of || 0, lead.id, lead.id);
  const owners = db.prepare(`SELECT id, name, team FROM users WHERE role IN ('lead_manager','trainer','administrator') AND status='active'`).all();
  view(res, 'lead-detail', { title: `Lead ${lead.reference}`, pageTitle: lead.full_name, lead, activities,
    consultations: consultations.map(c => ({ ...c, history_list: H.parseJson(c.history, []) })),
    notifications, duplicates, owners,
    qualification: H.parseJson(lead.qualification, {}), utm: H.parseJson(lead.utm, {}),
    estimatedBudget: H.parseJson(lead.estimated_budget, null) });
});

router.post('/leads/:id/activity', requirePermission('leads.edit'), (req, res) => {
  const scope = leadScope(req.user);
  const lead = db.prepare(`SELECT * FROM leads l WHERE l.id = ? AND ${scope.clause}`).get(Number(req.params.id), ...scope.params);
  if (!lead) return res.status(403).render('admin/error', { title: 'Access denied', status: 403, message: 'That lead is not assigned to you.' });
  const b = req.body;
  const type = ['note', 'call', 'whatsapp', 'email', 'consultation', 'stage_change', 'assignment', 'system'].includes(b.type) ? b.type : 'note';
  const newStage = ['new', 'contacted', 'qualified', 'consultation', 'enrolled', 'closed'].includes(b.new_stage) ? b.new_stage : null;
  const followUp = b.follow_up_at ? String(b.follow_up_at).replace('T', ' ') : null;
  db.prepare(`INSERT INTO lead_activities (lead_id, actor_id, actor_name, type, note, prior_stage, new_stage, follow_up_at)
      VALUES (?,?,?,?,?,?,?,?)`).run(lead.id, req.user.id, req.user.name, type,
    String(b.note || '').slice(0, 2000), lead.stage, newStage, followUp);
  const sets = [];
  const params = [];
  if (newStage && newStage !== lead.stage) { sets.push('stage = ?'); params.push(newStage); }
  if (followUp) { sets.push('next_follow_up_at = ?'); params.push(followUp); }
  if (['call', 'whatsapp', 'email', 'note'].includes(type) && !lead.first_response_at) {
    sets.push('first_response_at = ?'); params.push(new Date().toISOString().slice(0, 19).replace('T', ' '));
  }
  if (b.close_reason) { sets.push('stage_reason = ?'); params.push(String(b.close_reason).slice(0, 200)); }
  if (newStage === 'closed' || newStage === 'enrolled') { sets.push('closed_at = datetime(\'now\')'); }
  if (sets.length) {
    sets.push("updated_at = datetime('now')");
    db.prepare(`UPDATE leads SET ${sets.join(', ')} WHERE id = ?`).run(...params, lead.id);
  }
  // Reassign if a trainer/consultant claims or states an owner
  audit(req.user, 'lead.activity', 'leads', lead.id, { type, stage: newStage }, req.ip);
  res.redirect('/admin/leads/' + lead.id + '?saved=1');
});

router.post('/leads/:id/assign', requirePermission('leads.assign'), (req, res) => {
  const ownerId = req.body.owner_id ? Number(req.body.owner_id) : null;
  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(Number(req.params.id));
  if (!lead) return res.status(404).render('admin/error', { title: 'Not found', status: 404, message: 'Lead not found.' });
  const owner = ownerId ? db.prepare('SELECT * FROM users WHERE id = ?').get(ownerId) : null;
  db.prepare("UPDATE leads SET owner_id = ?, updated_at = datetime('now') WHERE id = ?").run(ownerId, lead.id);
  db.prepare(`INSERT INTO lead_activities (lead_id, actor_id, actor_name, type, note, prior_stage, new_stage)
      VALUES (?,?,?,?,?,?,?)`).run(lead.id, req.user.id, req.user.name, 'assignment',
    owner ? `Assigned to ${owner.name} (${owner.team || 'shared'}).` : 'Returned to the shared intake queue.', lead.stage, lead.stage);
  audit(req.user, 'lead.assign', 'leads', lead.id, { owner_id: ownerId }, req.ip);
  res.redirect('/admin/leads/' + lead.id + '?saved=assigned');
});

router.post('/leads/:id/consultation', requirePermission('leads.edit'), (req, res) => {
  const b = req.body;
  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(Number(req.params.id));
  if (!lead) return res.status(404).render('admin/error', { title: 'Not found', status: 404, message: 'Lead not found.' });
  const status = ['requested', 'confirmed', 'attended', 'no_show', 'cancelled'].includes(b.status) ? b.status : 'requested';
  if (status === 'confirmed' && !b.confirmed_at) {
    return res.status(422).render('admin/error', { title: 'Confirmation needs a time', status: 422,
      message: 'A consultation may be recorded as confirmed only after a time has been agreed with the client. Set the confirmed date and time first.' });
  }
  const info = db.prepare(`INSERT INTO consultations (lead_id, owner_id, mode, requested_at, confirmed_at, timezone, status, history)
      VALUES (?,?,?,?,?,?,?,?)`).run(lead.id, req.user.id, String(b.mode || 'online').slice(0, 30),
    b.requested_at ? String(b.requested_at).replace('T', ' ') : null,
    b.confirmed_at ? String(b.confirmed_at).replace('T', ' ') : null,
    String(b.timezone || setting('brand.timezone', 'Asia/Dubai')).slice(0, 60), status, '[]');
  db.prepare(`INSERT INTO lead_activities (lead_id, actor_id, actor_name, type, note, prior_stage, new_stage, follow_up_at)
      VALUES (?,?,?,?,?,?,?,?)`).run(lead.id, req.user.id, req.user.name, 'consultation',
    `Consultation ${status} (${b.mode || 'online'}, timezone ${b.timezone || setting('brand.timezone')}).`,
    lead.stage, status === 'confirmed' ? 'consultation' : lead.stage, b.confirmed_at ? String(b.confirmed_at).replace('T', ' ') : null);
  if (status === 'confirmed') db.prepare("UPDATE leads SET stage = 'consultation', updated_at = datetime('now') WHERE id = ?").run(lead.id);
  audit(req.user, 'consultation.create', 'consultations', info.lastInsertRowid, { lead_id: lead.id, status }, req.ip);
  res.redirect('/admin/leads/' + lead.id + '?saved=consultation');
});

/* ============================================================ TEAM ====== */
router.get('/team', requirePermission('content.view'), (req, res) => {
  const members = db.prepare(`SELECT t.*,
      (SELECT COUNT(*) FROM programs p WHERE p.trainer_id = t.id) AS program_count
      FROM team t ORDER BY t.sort_order`).all().map(m => ({ ...m,
        languages_list: H.parseJson(m.languages, []), locations_list: H.parseJson(m.locations, []),
        credentials_list: H.parseJson(m.credentials, []) }));
  view(res, 'team-list', { title: 'Team & trainers', pageTitle: 'Team & trainers', members });
});
router.get('/team/:id/edit', requirePermission('content.view'), (req, res) => {
  const member = db.prepare('SELECT * FROM team WHERE id = ?').get(Number(req.params.id));
  if (!member) return res.status(404).render('admin/error', { title: 'Not found', status: 404, message: 'Team member not found.' });
  view(res, 'team-edit', { title: member.name, pageTitle: `Edit: ${member.name}`, member,
    credentials: H.parseJson(member.credentials, []), expertise: H.parseJson(member.expertise, []),
    languages: H.parseJson(member.languages, []), locations: H.parseJson(member.locations, []),
    phones: H.parseJson(member.phones, []) });
});
router.post('/team/:id', requirePermission('content.edit'), (req, res) => {
  const b = req.body;
  const lines = (t) => String(t || '').split('\n').map(s => s.trim()).filter(Boolean);
  db.prepare(`UPDATE team SET name=?, role_title=?, bio=?, intro=?, credentials=?, expertise=?, languages=?, locations=?,
      email=?, phones=?, is_public=?, sort_order=?, seo_title=?, seo_description=?, updated_at=datetime('now') WHERE id=?`).run(
    String(b.name).slice(0, 120), String(b.role_title).slice(0, 160), String(b.bio || '').slice(0, 4000),
    String(b.intro || '').slice(0, 800), JSON.stringify(lines(b.credentials_text)),
    JSON.stringify(lines(b.expertise_text)), JSON.stringify(String(b.languages || '').split(',').map(s => s.trim()).filter(Boolean)),
    JSON.stringify(lines(b.locations_text)), String(b.email || '').slice(0, 160),
    JSON.stringify(lines(b.phones_text)), H.bool(b.is_public) ? 1 : 0, Number(b.sort_order || 50),
    String(b.seo_title || '').slice(0, 200), String(b.seo_description || '').slice(0, 400), Number(req.params.id));
  audit(req.user, 'team.update', 'team', Number(req.params.id), { name: b.name }, req.ip);
  const m = db.prepare('SELECT * FROM team WHERE id = ?').get(Number(req.params.id));
  searchReindex('team', m.id, m.name, `${m.role_title} ${m.intro} ${m.bio}`, '/team/' + m.slug);
  res.redirect('/admin/team/' + req.params.id + '/edit?saved=1');
});

/* =========================================================== MEDIA ====== */
router.get('/media', requirePermission('media.manage'), (req, res) => {
  const folder = req.query.folder ? String(req.query.folder) : null;
  const media = folder
    ? db.prepare(`${MEDIA_SELECT} WHERE m.folder = ? ORDER BY m.id DESC`).all(folder)
    : db.prepare(`${MEDIA_SELECT} ORDER BY m.id DESC`).all();
  const folders = db.prepare('SELECT folder, COUNT(*) AS n FROM media GROUP BY folder ORDER BY folder').all();
  view(res, 'media', { title: 'Media library', pageTitle: 'Media library', media, folders, folder, error: req.query.error || null });
});

router.post('/media', requirePermission('media.manage'), (req, res) => {
  upload.array('files', 6)(req, res, (err) => {
    if (err) return res.redirect('/admin/media?error=' + encodeURIComponent(err.message));
    const files = req.files || [];
    for (const f of files) {
      const info = db.prepare(`INSERT INTO media (filename, original_name, mime, size, alt, caption, folder, visibility, uploaded_by)
          VALUES (?,?,?,?,?,?,?,?,?)`).run(f.filename, f.originalname, f.mimetype, f.size,
        H.stripTags(req.body.alt || f.originalname.replace(/\.[^.]+$/, '')), String(req.body.caption || '').slice(0, 300),
        String(req.body.folder || 'general').slice(0, 40), req.body.visibility === 'private' ? 'private' : 'public', req.user.id);
      audit(req.user, 'media.upload', 'media', info.lastInsertRowid, { filename: f.filename }, req.ip);
    }
    res.redirect('/admin/media?saved=' + files.length);
  });
});

router.post('/media/:id', requirePermission('media.manage'), (req, res) => {
  db.prepare('UPDATE media SET alt=?, caption=?, focal_point=?, rights_note=?, visibility=?, folder=? WHERE id=?').run(
    String(req.body.alt || '').slice(0, 250), String(req.body.caption || '').slice(0, 300),
    String(req.body.focal_point || '50% 50%').slice(0, 30), String(req.body.rights_note || '').slice(0, 300),
    req.body.visibility === 'private' ? 'private' : 'public', String(req.body.folder || 'general').slice(0, 40),
    Number(req.params.id));
  audit(req.user, 'media.update', 'media', Number(req.params.id), {}, req.ip);
  res.redirect('/admin/media?saved=1');
});

/* ========================================================== MENUS ======= */
router.get('/menus', requirePermission('menus.manage'), (req, res) => {
  const locations = ['header', 'utility', 'footer_service', 'footer_destinations', 'mobile'];
  const menus = {};
  for (const l of locations) menus[l] = db.prepare('SELECT * FROM menus WHERE location = ? ORDER BY sort_order').all(l);
  view(res, 'menus', { title: 'Menus', pageTitle: 'Menus & global navigation', menus, locations });
});
router.post('/menus', requirePermission('menus.manage'), (req, res) => {
  const b = req.body;
  const location = ['header', 'utility', 'footer_service', 'footer_destinations', 'mobile'].includes(b.location) ? b.location : 'header';
  if (b.id) {
    db.prepare('UPDATE menus SET label=?, url=?, sort_order=?, published=? WHERE id=?').run(
      String(b.label).slice(0, 80), String(b.url).slice(0, 200), Number(b.sort_order || 50), H.bool(b.published) ? 1 : 0, Number(b.id));
    audit(req.user, 'menu.update', 'menus', Number(b.id), { label: b.label }, req.ip);
  } else {
    const info = db.prepare('INSERT INTO menus (location, label, url, sort_order, published) VALUES (?,?,?,?,?)')
      .run(location, String(b.label).slice(0, 80), String(b.url).slice(0, 200), Number(b.sort_order || 50), H.bool(b.published) ? 1 : 0);
    audit(req.user, 'menu.create', 'menus', info.lastInsertRowid, { label: b.label, location }, req.ip);
  }
  res.redirect('/admin/menus?saved=1');
});
router.post('/menus/:id/delete', requirePermission('menus.manage'), (req, res) => {
  db.prepare('DELETE FROM menus WHERE id = ?').run(Number(req.params.id));
  audit(req.user, 'menu.delete', 'menus', Number(req.params.id), {}, req.ip);
  res.redirect('/admin/menus?deleted=1');
});

/* ======================================================== SETTINGS ====== */
const SETTING_GROUPS = {
  brand: { label: 'Brand & identity', keys: ['brand.name', 'brand.legal_name', 'brand.slogan', 'brand.slogan_alt', 'brand.email',
    'brand.phone_uae', 'brand.phone_pk', 'brand.whatsapp', 'brand.whatsapp_pk', 'brand.address_uae', 'brand.address_pk',
    'brand.hours', 'brand.timezone', 'brand.facebook_page_url', 'brand.instagram', 'brand.youtube', 'brand.linkedin',
    'brand.google_profile_url', 'brand.trustpilot_url'] },
  seo: { label: 'SEO, AEO, GEO & AIO', keys: ['seo.default_title', 'seo.default_description', 'seo.title_suffix', 'seo.og_image',
    'seo.canonical_base', 'seo.base_url', 'seo.twitter_handle', 'seo.ga4_id', 'seo.indexnow_key', 'seo.default_keywords',
    'seo.allow_ai_crawlers', 'seo.sitemap_include_posts'] },
  ops: { label: 'Lead operations', keys: ['ops.response_promise', 'ops.privacy_notice_version', 'ops.retention_months',
    'ops.notification_recipients', 'ops.recipients_uae', 'ops.recipients_pakistan', 'ops.first_response_target_hours', 'ops.lead_prefix'] },
  design: { label: 'Design tokens', keys: ['design.primary', 'design.accent', 'design.ink', 'design.radius', 'design.font_heading', 'design.font_body'] },
  flags: { label: 'Feature flags', keys: ['flags.sample_reviews', 'flags.sample_feeds', 'flags.planner_live_fares', 'flags.maintenance_mode', 'flags.show_beta_notice', 'flags.cookie_banner'] },
  legal: { label: 'Legal & notices', keys: ['legal.disclaimer', 'legal.no_guarantee', 'legal.cookie_text'] },
};

router.get('/settings', requirePermission('settings.manage'), (req, res) => {
  const group = SETTING_GROUPS[req.query.group] ? req.query.group : 'brand';
  const rows = db.prepare('SELECT * FROM site_settings ORDER BY key').all();
  const map = {};
  for (const r of rows) { try { map[r.key] = JSON.parse(r.value); } catch { map[r.key] = r.value; } }
  view(res, 'settings', { title: 'Settings', pageTitle: 'Site settings', groups: SETTING_GROUPS, group, map, rows });
});

router.post('/settings', requirePermission('settings.manage'), (req, res) => {
  const group = SETTING_GROUPS[req.body._group] ? req.body._group : 'brand';
  const keys = SETTING_GROUPS[group].keys;
  for (const k of keys) {
    let v = req.body[k.replace(/\./g, '__')];
    if (v === undefined) continue;
    if (typeof v === 'string' && (v.startsWith('[') || v.startsWith('{'))) { try { v = JSON.parse(v); } catch {} }
    if (v === 'true') v = true; if (v === 'false') v = false;
    if (k === 'ops.retention_months' || k === 'ops.first_response_target_hours') v = Number(v);
    setSetting(k, v, group, req.user.id);
  }
  audit(req.user, 'settings.update', 'site_settings', group, { keys: keys.length }, req.ip);
  res.redirect('/admin/settings?group=' + group + '&saved=1');
});

/* ====================================================== INTEGRATIONS ==== */
router.get('/integrations', requirePermission('integrations.manage'), (req, res) => {
  view(res, 'integrations', { title: 'Integrations', pageTitle: 'Integrations & connection health',
    health: integrations.health(), summary: integrations.healthSummary(), providers: integrations.PROVIDERS,
    reviews: db.prepare('SELECT * FROM review_cache ORDER BY published_at DESC LIMIT 30').all(),
    feeds: db.prepare('SELECT * FROM feed_cache ORDER BY published_at DESC LIMIT 30').all(),
    jobs: db.prepare('SELECT * FROM jobs ORDER BY id DESC LIMIT 15').all(),
    notifications: db.prepare(`SELECT n.*, l.reference FROM notifications n LEFT JOIN leads l ON l.id = n.lead_id
                               ORDER BY n.id DESC LIMIT 15`).all() });
});
router.post('/integrations/:provider/refresh', requirePermission('integrations.manage'), (req, res) => {
  const result = integrations.refreshProvider(req.params.provider);
  res.redirect('/admin/integrations?saved=' + encodeURIComponent(result.message || ''));
});
router.post('/integrations/refresh-all', requirePermission('integrations.manage'), (req, res) => {
  integrations.refreshAll();
  res.redirect('/admin/integrations?saved=' + encodeURIComponent('All providers polled. Providers without credentials keep serving their cached snapshot.'));
});
router.post('/moderation/:type/:id', requirePermission('content.review'), (req, res) => {
  const type = req.params.type === 'review' ? 'review' : 'feed';
  const action = ['hide', 'show', 'pin', 'tag'].includes(req.body.action) ? req.body.action : 'hide';
  integrations.moderation(action, type, Number(req.params.id), {
    reason: req.body.reason, pinned: H.bool(req.body.pinned),
    tags: String(req.body.tags || '').split(',').map(s => s.trim()).filter(Boolean),
  }, req.user);
  res.redirect(req.get('referer') || '/admin/integrations');
});

/* =========================================================== USERS ====== */
router.get('/users', requirePermission('users.manage'), (req, res) => {
  const users = db.prepare(`SELECT u.*, (SELECT COUNT(*) FROM leads l WHERE l.owner_id = u.id) AS lead_count FROM users u ORDER BY u.role, u.name`).all();
  view(res, 'users', { title: 'Users & roles', pageTitle: 'Users, roles & permissions', users });
});
router.post('/users', requirePermission('users.manage'), (req, res) => {
  const b = req.body;
  const email = String(b.email || '').trim().toLowerCase();
  if (!H.normaliseEmail(email)) return res.redirect('/admin/users?error=' + encodeURIComponent('Enter a valid email address.'));
  if (String(b.password || '').length < 10) return res.redirect('/admin/users?error=' + encodeURIComponent('Passwords must be at least 10 characters.'));
  if (!ROLES[b.role]) return res.redirect('/admin/users?error=' + encodeURIComponent('Choose a valid role.'));
  try {
    const info = db.prepare(`INSERT INTO users (name, email, password_hash, role, team, phone) VALUES (?,?,?,?,?,?)`)
      .run(String(b.name).slice(0, 120), email, authLib.hashPassword(b.password), b.role,
        String(b.team || 'Shared').slice(0, 60), String(b.phone || '').slice(0, 40));
    audit(req.user, 'user.create', 'users', info.lastInsertRowid, { email, role: b.role }, req.ip);
  } catch (e) {
    return res.redirect('/admin/users?error=' + encodeURIComponent('That email address already has an account.'));
  }
  res.redirect('/admin/users?saved=1');
});
router.post('/users/:id/status', requirePermission('users.manage'), (req, res) => {
  const u = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(req.params.id));
  if (!u) return res.status(404).render('admin/error', { title: 'Not found', status: 404, message: 'User not found.' });
  if (u.id === req.user.id && req.body.status === 'disabled') {
    return res.status(422).render('admin/error', { title: 'Not permitted', status: 422, message: 'You cannot disable the account you are signed in with.' });
  }
  const status = req.body.status === 'disabled' ? 'disabled' : 'active';
  db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, u.id);
  if (status === 'disabled') {
    authLib.revokeAllForUser(u.id);                       // revoke live sessions on departure
    const openLeads = db.prepare("SELECT COUNT(*) AS n FROM leads WHERE owner_id = ? AND stage NOT IN ('enrolled','closed')").get(u.id).n;
    audit(req.user, 'user.disable', 'users', u.id, { open_leads: openLeads }, req.ip);
  } else {
    audit(req.user, 'user.enable', 'users', u.id, {}, req.ip);
  }
  res.redirect('/admin/users?saved=1');
});
router.post('/users/:id/password', requirePermission('users.manage'), (req, res) => {
  if (String(req.body.password || '').length < 10) return res.redirect('/admin/users?error=' + encodeURIComponent('Passwords must be at least 10 characters.'));
  db.prepare('UPDATE users SET password_hash = ?, failed_logins = 0, locked_until = NULL WHERE id = ?')
    .run(authLib.hashPassword(req.body.password), Number(req.params.id));
  authLib.revokeAllForUser(Number(req.params.id));
  audit(req.user, 'user.password_reset', 'users', Number(req.params.id), {}, req.ip);
  res.redirect('/admin/users?saved=password');
});
router.post('/users/:id/role', requirePermission('users.manage'), (req, res) => {
  if (!ROLES[req.body.role]) return res.redirect('/admin/users?error=' + encodeURIComponent('Invalid role.'));
  const before = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(req.params.id));
  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(req.body.role, before.id);
  audit(req.user, 'user.role_change', 'users', before.id, { from: before.role, to: req.body.role }, req.ip);
  res.redirect('/admin/users?saved=role');
});

/* ========================================================= SEO TOOLS ==== */
router.get('/seo', requirePermission('seo.manage'), async (req, res) => {
  const pages = db.prepare(`SELECT id, title, slug, seo_title, seo_description, noindex, status, updated_at FROM pages ORDER BY sort_order`).all();
  const posts = db.prepare(`SELECT id, title, slug, seo_title, seo_description, target_query, answer_summary, noindex, status FROM posts ORDER BY publish_at DESC`).all();
  const missing = [...pages.filter(p => !p.seo_title || !p.seo_description).map(p => ({ kind: 'page', ...p })),
                   ...posts.filter(p => !p.seo_title || !p.seo_description).map(p => ({ kind: 'post', ...p }))];
  const programMissing = db.prepare(`SELECT id, name, slug FROM programs WHERE seo_title IS NULL OR seo_description IS NULL`).all();
  const redirects = db.prepare('SELECT * FROM redirects ORDER BY hits DESC, id').all();
  const orphans = pages.filter(p => p.status === 'published' && !p.seo_description).length;

  let inspectResult = null;
  if (req.query.inspect_url) {
    try {
      inspectResult = await gsc.inspectUrl(req.query.inspect_url);
    } catch (e) {
      inspectResult = { ok: false, error: e.message };
    }
  }

  view(res, 'seo', { title: 'SEO & AI optimisation', pageTitle: 'SEO · AEO · GEO · AIO control centre',
    pages, posts, missing, programMissing, redirects, orphans,
    sitemapUrl: seo.siteBase(req) + '/sitemap.xml', llmsUrl: seo.siteBase(req) + '/llms.txt',
    feedUrl: seo.siteBase(req) + '/feed.xml',
    gscEmail: gsc.CLIENT_EMAIL,
    gscSite: gsc.SEARCH_CONSOLE_SITE,
    inspectResult,
    inspectUrlValue: req.query.inspect_url || (seo.siteBase(req) + '/'),
    gscMsg: req.query.gsc_msg || null,
    eventCounts: db.prepare('SELECT name, COUNT(*) AS n FROM analytics_events GROUP BY name ORDER BY n DESC LIMIT 12').all() });
});

router.post('/seo/gsc/inspect', requirePermission('seo.manage'), (req, res) => {
  const url = String(req.body.url || '').trim();
  res.redirect(`/admin/seo?inspect_url=${encodeURIComponent(url)}#gsc`);
});

router.post('/seo/gsc/sitemap', requirePermission('seo.manage'), async (req, res) => {
  const sitemapUrl = seo.siteBase(req) + '/sitemap.xml';
  const result = await gsc.submitSitemap(sitemapUrl);
  audit(req.user, 'seo.sitemap_submit', 'seo', null, { sitemapUrl, status: result.status }, req.ip);
  res.redirect(`/admin/seo?gsc_msg=${result.ok ? 'sitemap_ok' : 'sitemap_err'}#gsc`);
});

router.post('/seo/gsc/index-all', requirePermission('seo.manage'), async (req, res) => {
  const baseUrl = seo.siteBase(req);
  const result = await gsc.indexAllPublishedUrls(baseUrl);
  audit(req.user, 'seo.index_all', 'seo', null, { total: result.total, submitted: result.submitted }, req.ip);
  res.redirect(`/admin/seo?gsc_msg=${result.ok ? 'indexing_ok' : 'indexing_err'}#gsc`);
});
router.get('/redirects', requirePermission('seo.manage'), (req, res) => res.redirect('/admin/seo#redirects'));
router.post('/redirects', requirePermission('seo.manage'), (req, res) => {
  const b = req.body;
  if (b.id) {
    db.prepare('UPDATE redirects SET from_path=?, to_path=?, type=?, active=? WHERE id=?').run(
      String(b.from_path).slice(0, 200), String(b.to_path).slice(0, 200), Number(b.type || 301),
      H.bool(b.active) ? 1 : 0, Number(b.id));
  } else {
    try {
      db.prepare('INSERT INTO redirects (from_path, to_path, type, note) VALUES (?,?,?,?)').run(
        String(b.from_path).slice(0, 200), String(b.to_path).slice(0, 200), Number(b.type || 301), String(b.note || '').slice(0, 200));
    } catch { return res.redirect('/admin/seo?error=duplicate'); }
  }
  audit(req.user, 'redirect.save', 'redirects', b.id || null, { from: b.from_path, to: b.to_path }, req.ip);
  res.redirect('/admin/seo?saved=1#redirects');
});
router.post('/redirects/:id/delete', requirePermission('seo.manage'), (req, res) => {
  db.prepare('DELETE FROM redirects WHERE id = ?').run(Number(req.params.id));
  audit(req.user, 'redirect.delete', 'redirects', Number(req.params.id), {}, req.ip);
  res.redirect('/admin/seo#redirects');
});

/* =========================================================== FAQS ======= */
router.get('/faqs', requirePermission('content.view'), (req, res) => {
  const faqs = db.prepare(`SELECT f.*, c.name AS country_name FROM faqs f LEFT JOIN countries c ON c.id = f.country_id
    ORDER BY f.category, f.sort_order`).all();
  view(res, 'faqs', { title: 'FAQs', pageTitle: 'FAQs', faqs, countries: db.prepare('SELECT id, name FROM countries ORDER BY sort_order').all() });
});
router.post('/faqs/:id?', requirePermission('content.edit'), (req, res) => {
  const b = req.body;
  const data = [String(b.question).slice(0, 300), String(b.answer).slice(0, 3000),
    H.answerSummary(b.answer, 300), String(b.category || 'general').slice(0, 40),
    b.country_id ? Number(b.country_id) : null, Number(b.sort_order || 100), H.bool(b.published) ? 1 : 0];
  if (req.params.id) {
    db.prepare('UPDATE faqs SET question=?, answer=?, answer_summary=?, category=?, country_id=?, sort_order=?, published=? WHERE id=?')
      .run(...data, Number(req.params.id));
  } else {
    const info = db.prepare('INSERT INTO faqs (question, answer, answer_summary, category, country_id, sort_order, published) VALUES (?,?,?,?,?,?,?)').run(...data);
    searchReindex('faq', info.lastInsertRowid, data[0], data[1], '/faq');
  }
  audit(req.user, 'faq.save', 'faqs', req.params.id || null, {}, req.ip);
  res.redirect('/admin/faqs?saved=1');
});
router.post('/faqs/:id/delete', requirePermission('content.delete'), (req, res) => {
  db.prepare('DELETE FROM faqs WHERE id = ?').run(Number(req.params.id));
  searchRemove('faq', Number(req.params.id));
  audit(req.user, 'faq.delete', 'faqs', Number(req.params.id), {}, req.ip);
  res.redirect('/admin/faqs?deleted=1');
});

/* ==================================================== TESTIMONIALS ====== */
router.get('/testimonials', requirePermission('content.view'), (req, res) => {
  const testimonials = db.prepare(`SELECT t.*, p.name AS program_name, u.name AS approver_name FROM testimonials t
      LEFT JOIN programs p ON p.id = t.program_id LEFT JOIN users u ON u.id = t.approver_id ORDER BY t.status, t.id DESC`).all();
  view(res, 'testimonials', { title: 'Testimonials', pageTitle: 'Testimonials & consent', testimonials,
    programs: db.prepare('SELECT id, name FROM programs ORDER BY sort_order').all() });
});
router.post('/testimonials/:id?', requirePermission('content.review'), (req, res) => {
  const b = req.body;
  const data = [String(b.quote).slice(0, 800), String(b.author_display).slice(0, 120), String(b.context || '').slice(0, 300),
    b.program_id ? Number(b.program_id) : null, b.rating ? Number(b.rating) : null,
    String(b.consent_record || '').slice(0, 300), String(b.evidence_note || '').slice(0, 300),
    ['pending', 'approved', 'hidden', 'archived'].includes(b.status) ? b.status : 'pending',
    H.bool(b.featured) ? 1 : 0];
  if (req.params.id) {
    db.prepare(`UPDATE testimonials SET quote=?, author_display=?, context=?, program_id=?, rating=?, consent_record=?,
                evidence_note=?, status=?, featured=?, approver_id=? WHERE id=?`).run(...data, req.user.id, Number(req.params.id));
  } else {
    db.prepare(`INSERT INTO testimonials (quote, author_display, context, program_id, rating, consent_record, evidence_note,
                status, featured, approver_id) VALUES (?,?,?,?,?,?,?,?,?,?)`).run(...data, req.user.id);
  }
  audit(req.user, 'testimonial.save', 'testimonials', req.params.id || null, { status: b.status }, req.ip);
  res.redirect('/admin/testimonials?saved=1');
});

/* ======================================================== REPORTS ======= */
router.get('/reports', requirePermission('reports.view'), (req, res) => {
  const u = req.user;
  const scope = leadScope(u);
  const from = req.query.from || new Date(Date.now() - 30 * 86400e3).toISOString().slice(0, 10);
  const to = req.query.to || new Date().toISOString().slice(0, 10);
  const byDay = db.prepare(`SELECT date(created_at) AS day, COUNT(*) AS n FROM leads l
      WHERE ${scope.clause} AND date(l.created_at) BETWEEN date(?) AND date(?) GROUP BY day ORDER BY day`).all(...scope.params, from, to);
  const byInterest = db.prepare(`SELECT interest, COUNT(*) AS n FROM leads l WHERE ${scope.clause} AND date(l.created_at) BETWEEN date(?) AND date(?) GROUP BY interest`).all(...scope.params, from, to);
  const bySource = db.prepare(`SELECT source_type, COUNT(*) AS n FROM leads l WHERE ${scope.clause} AND date(l.created_at) BETWEEN date(?) AND date(?) GROUP BY source_type`).all(...scope.params, from, to);
  const byStage = db.prepare(`SELECT stage, COUNT(*) AS n FROM leads l WHERE ${scope.clause} GROUP BY stage`).all(...scope.params);
  const byOwner = db.prepare(`SELECT COALESCE(u.name,'Unassigned') AS owner, COUNT(*) AS n,
      SUM(CASE WHEN l.stage IN ('enrolled','closed') THEN 1 ELSE 0 END) AS closed,
      SUM(CASE WHEN l.first_response_at IS NULL THEN 1 ELSE 0 END) AS awaiting
      FROM leads l LEFT JOIN users u ON u.id = l.owner_id WHERE ${scope.clause} GROUP BY owner ORDER BY n DESC`).all(...scope.params);
  const byCountry = db.prepare(`SELECT COALESCE(c.name,'Not specified') AS country, COUNT(*) AS n FROM leads l
      LEFT JOIN countries c ON c.id = l.country_id WHERE ${scope.clause} GROUP BY country ORDER BY n DESC LIMIT 10`).all(...scope.params);
  const events = db.prepare(`SELECT name, COUNT(*) AS n FROM analytics_events WHERE date(created_at) BETWEEN date(?) AND date(?)
      GROUP BY name ORDER BY n DESC LIMIT 15`).all(from, to);
  const plannerCountries = db.prepare(`SELECT json_extract(props,'$.country') AS country, COUNT(*) AS n FROM analytics_events
      WHERE name = 'planner_estimate_generated' GROUP BY country ORDER BY n DESC LIMIT 10`).all();
  const maxDay = Math.max(1, ...byDay.map(d => d.n));
  const decisionLog = db.prepare(`SELECT a.*, u.name AS display FROM audit_log a LEFT JOIN users u ON u.id = a.actor_id
      WHERE a.action LIKE 'funds%' OR a.action LIKE 'settings%' OR a.action LIKE 'user%' ORDER BY a.created_at DESC LIMIT 12`).all();
  view(res, 'reports', { title: 'Reports', pageTitle: 'Operational reporting', from, to, byDay, byInterest, bySource,
    byStage, byOwner, byCountry, events, plannerCountries, maxDay, decisionLog,
    totals: {
      leads: db.prepare(`SELECT COUNT(*) AS n FROM leads l WHERE ${scope.clause} AND date(l.created_at) BETWEEN date(?) AND date(?)`).get(...scope.params, from, to).n,
      enrolled: db.prepare(`SELECT COUNT(*) AS n FROM leads l WHERE ${scope.clause} AND l.stage = 'enrolled'`).get(...scope.params).n,
      consultation: db.prepare(`SELECT COUNT(*) AS n FROM consultations c JOIN leads l ON l.id = c.lead_id WHERE ${scope.clause}`).get(...scope.params).n,
      spam: db.prepare(`SELECT COUNT(*) AS n FROM leads l WHERE ${scope.clause} AND l.spam_score > 0.5`).get(...scope.params).n,
    } });
});

/* ========================================================== AUDIT ======= */
router.get('/audit', requirePermission('audit.view'), (req, res) => {
  const q = String(req.query.q || '').trim();
  const where = [];
  const params = [];
  if (q) { where.push('(action LIKE ? OR entity LIKE ? OR actor LIKE ?)'); params.push(`%${q}%`, `%${q}%`, `%${q}%`); }
  const rows = db.prepare(`SELECT a.*, u.name AS display FROM audit_log a LEFT JOIN users u ON u.id = a.actor_id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY a.created_at DESC LIMIT 300`).all(...params);
  view(res, 'audit', { title: 'Audit trail', pageTitle: 'Audit trail', rows, q });
});

/* =========================================================== TOOLS ====== */
router.get('/tools', requirePermission('tools.run'), (req, res) => {
  const backups = fs.existsSync(path.join(__dirname, '..', '..', 'data', 'backups'))
    ? fs.readdirSync(path.join(__dirname, '..', '..', 'data', 'backups')).sort().reverse().slice(0, 10) : [];
  view(res, 'tools', { title: 'Tools', pageTitle: 'Tools, backup & maintenance', backups,
    dbSize: fs.existsSync(DB_PATH) ? fs.statSync(DB_PATH).size : 0,
    counts: {
      pages: db.prepare('SELECT COUNT(*) AS n FROM pages').get().n,
      posts: db.prepare('SELECT COUNT(*) AS n FROM posts').get().n,
      leads: db.prepare('SELECT COUNT(*) AS n FROM leads').get().n,
      media: db.prepare('SELECT COUNT(*) AS n FROM media').get().n,
      events: db.prepare('SELECT COUNT(*) AS n FROM analytics_events').get().n,
    },
    jobs: db.prepare('SELECT * FROM jobs ORDER BY id DESC LIMIT 20').all(),
    notifications: db.prepare(`SELECT n.*, l.reference FROM notifications n LEFT JOIN leads l ON l.id = n.lead_id ORDER BY n.id DESC LIMIT 20`).all() });
});
router.post('/tools/reindex', requirePermission('tools.run'), (req, res) => {
  const { reindex } = require('../seed');
  reindex();
  audit(req.user, 'tools.reindex', 'search_index', null, {}, req.ip);
  res.redirect('/admin/tools?saved=reindexed');
});
router.post('/tools/backup', requirePermission('tools.run'), (req, res) => {
  const dir = isServerless ? path.join('/tmp', 'backups') : path.join(__dirname, '..', '..', 'data', 'backups');
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const target = path.join(dir, `kishaa-${stamp}.db`);
    db.prepare('VACUUM INTO ?').run(target);
    audit(req.user, 'tools.backup', 'database', null, { file: path.basename(target) }, req.ip);
    res.redirect('/admin/tools?saved=backup');
  } catch (e) {
    res.redirect('/admin/tools?error=' + encodeURIComponent(e.message));
  }
});
router.post('/tools/retry-notifications', requirePermission('tools.run'), (req, res) => {
  mailer.retryAll();
  audit(req.user, 'tools.notification_retry', 'notifications', null, {}, req.ip);
  res.redirect('/admin/tools?saved=retry');
});
router.post('/tools/process-queue', requirePermission('tools.run'), async (req, res) => {
  const result = await mailer.processQueue(20);
  res.redirect('/admin/tools?saved=' + encodeURIComponent(`Processed ${result.processed} queued notification(s).`));
});
router.post('/tools/rollback/:file', requirePermission('tools.run'), (req, res) => {
  const dir = path.join(__dirname, '..', '..', 'data', 'backups');
  const file = path.basename(String(req.params.file));
  const src = path.join(dir, file);
  if (!fs.existsSync(src)) return res.redirect('/admin/tools?error=' + encodeURIComponent('Backup file not found.'));
  audit(req.user, 'tools.rollback', 'database', null, { file }, req.ip);
  // Copy over the live file and tell the operator to restart — restoring live SQLite pages in-process is unsafe.
  try {
    fs.copyFileSync(src, DB_PATH + '.restore-pending');
    res.redirect('/admin/tools?saved=' + encodeURIComponent(`Restore staged as ${path.basename(DB_PATH)}.restore-pending. Follow the restore runbook in docs/OPERATIONS.md and restart the service.`));
  } catch (e) { res.redirect('/admin/tools?error=' + encodeURIComponent(e.message)); }
});

/* ==================================================== PREVIEW ROUTE ==== */
router.get('/preview/posts/:id', requirePermission('content.view'), (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(Number(req.params.id));
  if (!post) return res.status(404).send('Not found');
  if (post.slug && !req.query.raw) {
    return res.redirect(`/resources/${post.slug}`);
  }
  res.set('X-Robots-Tag', 'noindex, nofollow');
  res.set('Cache-Control', 'private, no-store, max-age=0');
  res.render('site/post', {
    cfg: H.siteConfig(), post: { ...post, takeaways_list: H.parseJson(post.key_takeaways, []), tags_list: H.parseJson(post.tags, []) },
    related: db.prepare("SELECT id, title, slug, excerpt, read_minutes, updated_at FROM posts WHERE status='published' AND id != ? ORDER BY updated_at DESC LIMIT 4").all(post.id),
    category: post.category_id ? db.prepare('SELECT * FROM categories WHERE id = ?').get(post.category_id) : null,
    menus: { header: db.prepare("SELECT * FROM menus WHERE location='header' AND published=1 ORDER BY sort_order").all(),
      utility: db.prepare("SELECT * FROM menus WHERE location='utility' AND published=1 ORDER BY sort_order").all(),
      footer_service: db.prepare("SELECT * FROM menus WHERE location='footer_service' AND published=1 ORDER BY sort_order").all(),
      footer_destinations: db.prepare("SELECT * FROM menus WHERE location='footer_destinations' AND published=1 ORDER BY sort_order").all() },
    aggregates: integrations.reviewAggregates(), preview: true, path: '/preview', query: {},
    meta: { title: 'DRAFT PREVIEW — ' + post.title, description: post.seo_description || '', canonical: '#',
      robots: 'noindex, nofollow', noindex: true, base: '' },
    breadcrumb: [{ label: 'Preview', url: '#' }], jsonld: '{}', user: req.user,
  }, (err, html) => { if (err) return res.status(500).send(err.message); res.send(html); });
});

router.get('/preview/pages/:id', requirePermission('content.view'), (req, res) => {
  const page = db.prepare('SELECT * FROM pages WHERE id = ?').get(Number(req.params.id));
  if (!page) return res.status(404).send('Not found');
  res.set('X-Robots-Tag', 'noindex, nofollow');
  res.set('Cache-Control', 'private, no-store, max-age=0');
  res.render('site/page', {
    cfg: H.siteConfig(), page, blocks: blocksLib.enrich(H.parseJson(page.blocks, []), { cfg: H.siteConfig() }),
    menus: { header: db.prepare("SELECT * FROM menus WHERE location='header' AND published=1 ORDER BY sort_order").all(),
      utility: db.prepare("SELECT * FROM menus WHERE location='utility' AND published=1 ORDER BY sort_order").all(),
      footer_service: db.prepare("SELECT * FROM menus WHERE location='footer_service' AND published=1 ORDER BY sort_order").all(),
      footer_destinations: db.prepare("SELECT * FROM menus WHERE location='footer_destinations' AND published=1 ORDER BY sort_order").all() },
    aggregates: integrations.reviewAggregates(), preview: true, path: '/preview', query: {},
    meta: { title: 'DRAFT PREVIEW — ' + page.title, description: page.seo_description || '', canonical: '#',
      robots: 'noindex, nofollow', noindex: true, base: '' },
  }, (err, html) => { if (err) return res.status(500).send(err.message); res.send(html); });
});

/* ========================================================== AI AGENT HUB == */
router.get('/ai-agent', requirePermission('content.view'), (req, res) => {
  let recentLeads = [];
  try {
    recentLeads = db.prepare(`
      SELECT l.id, l.full_name AS name, l.interest, l.email, l.phone, l.message AS notes, l.created_at,
             COALESCE(c.name, 'General') AS country
      FROM leads l
      LEFT JOIN countries c ON c.id = l.country_id
      ORDER BY l.id DESC LIMIT 15
    `).all();
  } catch (e) {
    console.warn('[admin:ai-agent] leads query error:', e.message);
  }

  let destinations = [];
  try {
    destinations = db.prepare('SELECT id, name, slug FROM countries WHERE published = 1 ORDER BY name').all();
  } catch (e) {
    console.warn('[admin:ai-agent] destinations query error:', e.message);
  }

  let autobloggerStatus = null;
  try {
    autobloggerStatus = autoblogger.getAutobloggerStatus();
  } catch (e) {
    console.warn('[admin:ai-agent] autoblogger status error:', e.message);
  }

  view(res, 'ai-agent', {
    title: 'AI Agent Studio & Profile Examiner',
    pageTitle: 'AI Agent Studio · Case Examiner & Content Copilot',
    recentLeads,
    destinations,
    autoblogger: autobloggerStatus,
  });
});

router.get('/api/autoblogger/status', requirePermission('content.view'), async (req, res) => {
  try {
    const status = autoblogger.getAutobloggerStatus();
    res.json({ ok: true, ...status });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/api/autoblogger/run', express.json(), requirePermission('content.publish'), async (req, res) => {
  try {
    const result = await autoblogger.publishDailyPost({
      topic: req.body.topic ? String(req.body.topic).trim() : null,
    });
    res.json(result);
  } catch (err) {
    console.error('[admin:autoblogger:run]', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/api/ai/auto-generate-post', express.json(), requirePermission('content.edit'), async (req, res) => {
  try {
    const topic = String(req.body.topic || '').trim();
    if (!topic) return res.status(400).json({ ok: false, error: 'Topic or title is required' });

    console.log(`🤖 Auto-generating full article and cover image for: "${topic}"`);
    const postData = await autoblogger.generateArticleContent({ topic });

    let mediaRecord = null;
    const prompt = postData.image_prompt || `Editorial photorealistic wide angle shot of international students in university campus, soft cinematic lighting, 8k resolution`;
    try {
      mediaRecord = await qwenImage.generateAndSaveImage(prompt, {
        folder: 'guides',
        size: '1664*928',
        user: req.user,
      });
    } catch (imgErr) {
      console.warn('⚠️ Cover image generation warning in auto-generate-post:', imgErr.message);
    }

    res.json({
      ok: true,
      post: postData,
      media: mediaRecord ? {
        id: mediaRecord.mediaId,
        url: mediaRecord.publicUrl || mediaRecord.url,
        filename: mediaRecord.filename,
      } : null,
    });
  } catch (err) {
    console.error('[admin:auto-generate-post]', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/api/ai/examine-profile', express.json(), requirePermission('leads.view'), async (req, res) => {
  try {
    const analysis = await qwenSearch.examineCandidateProfile(req.body);
    res.json({ ok: true, analysis });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/api/ai/suggest-seo', express.json(), requirePermission('content.edit'), async (req, res) => {
  try {
    const suggestions = await qwenSearch.suggestSeoContent(req.body);
    res.json({ ok: true, suggestions });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/api/ai/generate-image', express.json(), requirePermission('media.manage'), async (req, res) => {
  try {
    const prompt = String(req.body.prompt || '').trim();
    if (!prompt) return res.status(400).json({ ok: false, error: 'Prompt is required' });
    const result = await qwenImage.generateAndSaveImage(prompt, {
      size: req.body.size || '1664*928',
      folder: req.body.folder || 'guides',
      user: req.user,
    });
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/api/ai/live-costs', express.json(), requirePermission('content.view'), async (req, res) => {
  try {
    const country = String(req.body.country || '').trim();
    const city = String(req.body.city || '').trim();
    if (!country) return res.status(400).json({ ok: false, error: 'Country name is required' });
    const data = await qwenSearch.getLiveDestinationCosts(country, city);
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;


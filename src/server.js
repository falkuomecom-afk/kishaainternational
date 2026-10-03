'use strict';
/** Kishaa International — application server. */
require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const { db, migrate, setting } = require('./lib/db');
const authLib = require('./lib/auth');
const { register } = require('./lib/viewhelpers');
const renderer = require('./render');
const mailer = require('./lib/mailer');

const ROOT = fs.existsSync(path.join(__dirname, '..', 'views'))
  ? path.join(__dirname, '..')
  : process.cwd();
const VIEWS = path.join(ROOT, 'views');
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';

migrate();
try {
  const userCount = db.prepare('SELECT COUNT(*) AS n FROM users').get()?.n || 0;
  if (userCount === 0) {
    const { seed } = require('./seed');
    seed();
  }
} catch (e) {
  console.warn('[server:init] seeder warning:', e.message);
}
const viewHelpers = register(renderer.registerHelpers);

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

/* ------------------------------------------------------------------ basics */
app.use(express.urlencoded({ extended: true, limit: '256kb' }));
app.use(express.json({ limit: '256kb' }));
const clientDistAssets = path.join(ROOT, 'client', 'dist', 'assets');
const publicDistAssets = path.join(ROOT, 'public', 'dist', 'assets');
const distAssets = fs.existsSync(clientDistAssets) ? clientDistAssets : publicDistAssets;
app.use('/assets', express.static(distAssets, { maxAge: '7d', etag: true }));
app.use(express.static(path.join(ROOT, 'public'), {
  index: false,
  maxAge: 0,
  etag: true,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
}));

/* cookies (dependency-free) */
const { parseCookie } = authLib;
app.use((req, res, next) => {
  req.cookies = parseCookie(req);
  res.cookie = (name, value, opts = {}) => {
    const parts = [`${name}=${encodeURIComponent(value)}`];
    parts.push(`Path=${opts.path || '/'}`);
    if (opts.maxAge) parts.push(`Max-Age=${Math.floor(opts.maxAge / 1000)}`);
    if (opts.httpOnly) parts.push('HttpOnly');
    if (opts.secure) parts.push('Secure');
    parts.push(`SameSite=${opts.sameSite ? opts.sameSite[0].toUpperCase() + opts.sameSite.slice(1) : 'Lax'}`);
    const prev = res.getHeader('Set-Cookie');
    res.setHeader('Set-Cookie', prev ? [].concat(prev, parts.join('; ')) : parts.join('; '));
  };
  res.clearCookie = (name, opts = {}) => res.cookie(name, '', { ...opts, maxAge: 0 });
  next();
});

/* ------------------------------------------------------------- rendering */
app.set('views', VIEWS);
app.set('view engine', 'html');
app.engine('html', (file, options, cb) => {
  try {
    const rel = path.relative(VIEWS, file).replace(/\\/g, '/').replace(/\.html$/, '');
    let layout = options.layout;
    if (layout === undefined) {
      layout = rel.startsWith('site/') ? 'site/layout' : (rel.startsWith('admin/') ? 'admin/layout' : false);
    }
    if (layout) {
      const body = renderer.renderNamed(rel, options, VIEWS);
      const shell = renderer.renderNamed(layout, { ...options, body }, VIEWS);
      return cb(null, renderer.tidy(shell));
    }
    cb(null, renderer.tidy(renderer.renderNamed(rel, options, VIEWS)));
  } catch (e) {
    cb(e);
  }
});
app.use((req, res, next) => {
  res.locals = res.locals || {};
  res.locals.setting = (k, d) => (setting(k) === null ? d : setting(k));
  next();
});

/* ------------------------------------------------------- auth & security */
app.use(authLib.middleware());
app.use(authLib.csrfMiddleware());
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  if (!req.path.startsWith('/admin')) {
    res.setHeader('Content-Security-Policy',
      "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self' 'unsafe-inline'; " +
      "font-src 'self' data: https://fonts.gstatic.com; connect-src 'self'; frame-src 'self' https://www.youtube.com https://www.instagram.com; " +
      "base-uri 'self'; form-action 'self'; object-src 'none'");
  }
  next();
});

/* ------------------------------------------------------------- healthchecks */
app.get('/healthz', (req, res) => res.json({ ok: true, uptime: process.uptime(), db: 'ok' }));

/* ------------------------------------------------------------- tRPC API */
const { fetchRequestHandler } = require('@trpc/server/adapters/fetch');
const { appRouter } = require('./lib/trpc-router');

async function handleTrpc(req, res) {
  try {
    const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
    const url = new URL(req.originalUrl || req.url, `${proto}://${host}`);

    const init = {
      method: req.method,
      headers: req.headers,
    };
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      init.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    const request = new Request(url.href, init);
    const response = await fetchRequestHandler({
      endpoint: req.originalUrl?.includes('/api/trpc') ? '/api/trpc' : '/trpc',
      req: request,
      router: appRouter,
      createContext: () => ({
        user: req.user || null,
        ip: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
        req,
        res,
      }),
    });

    res.status(response.status);
    for (const [key, value] of response.headers.entries()) {
      res.setHeader(key, value);
    }
    const text = await response.text();
    res.send(text);
  } catch (err) {
    console.error('[trpc handler error]', err);
    if (!res.headersSent) {
      res.status(500).json({ error: { message: err.message } });
    }
  }
}

app.all('/api/trpc*', handleTrpc);
app.all('/trpc*', handleTrpc);

/* ------------------------------------------------------------------ routes */
app.use('/admin', require('./routes/admin'));
app.use('/', require('./routes/site'));

/* ------------------------------------------------------------------- errors */
app.use((req, res) => {
  res.status(404).render('site/404', {
    cfg: viewHelpers ? require('./lib/helpers').siteConfig() : {},
    meta: { title: 'Page not found', description: '', canonical: '#', robots: 'noindex', noindex: true },
    menus: { header: [], utility: [], footer_service: [], footer_destinations: [] },
    aggregates: [], suggestions: [], destinations: [], breadcrumb: [], jsonld: '{}', path: req.path, query: {}, user: req.user,
  }, (err, html) => res.send(err ? '<h1>404</h1>' : html));
});

app.use((err, req, res, next) => {
  console.error('[error]', err.message);
  if (req.path.startsWith('/admin') || req.path.startsWith('/api')) {
    return res.status(500).json({ ok: false, error: 'server_error', message: err.message });
  }
  res.status(500).send(`<h1>Something went wrong</h1><p>${require('./lib/helpers').esc(err.message)}</p>`);
});

/* ------------------------------------------------------------ background */
function startScheduler() {
  // Notification delivery queue
  setInterval(async () => {
    try { await mailer.processQueue(10); } catch (e) { console.error('queue', e.message); }
  }, 60e3).unref();

  // Review / media feed poll — mirrors the Composio worker described in the brief.
  setInterval(() => {
    try {
      const due = db.prepare(`SELECT provider FROM integrations WHERE kind IN ('reviews','feeds')
                              AND (next_sync_at IS NULL OR next_sync_at <= datetime('now'))`).all();
      for (const row of due) {
        require('./lib/integrations').refreshProvider(row.provider);
      }
    } catch (e) { console.error('feed worker', e.message); }
  }, 15 * 60e3).unref();

  // Scheduled publishing — publishes pages and posts whose time has arrived.
  setInterval(() => {
    try {
      const pages = db.prepare(`SELECT id FROM pages WHERE status = 'draft' AND publish_at IS NOT NULL AND publish_at <= datetime('now')`).all();
      for (const p of pages) {
        db.prepare(`UPDATE pages SET status = 'published', updated_at = datetime('now') WHERE id = ?`).run(p.id);
        const { reindex } = require('./seed'); reindex();
        console.log(`[scheduler] published page #${p.id}`);
      }
      const posts = db.prepare(`SELECT id FROM posts WHERE status = 'draft' AND publish_at IS NOT NULL AND publish_at <= datetime('now')`).all();
      for (const p of posts) {
        db.prepare(`UPDATE posts SET status = 'published', updated_at = datetime('now') WHERE id = ?`).run(p.id);
        const { reindex } = require('./seed'); reindex();
        console.log(`[scheduler] published post #${p.id}`);
      }
    } catch (e) { console.error('scheduler', e.message); }
  }, 60e3).unref();

  // On startup, if COMPOSIO_API_KEY is present, refresh Composio feeds in background
  if (process.env.COMPOSIO_API_KEY) {
    setTimeout(() => {
      try {
        require('./lib/composio-sync').syncAll().catch(e => console.error('Startup composio sync:', e.message));
      } catch (e) {}
    }, 2000).unref();
  }
}

if (require.main === module) {
  app.listen(PORT, HOST, () => {
    console.log(`\n  Kishaa International platform running`);
    console.log(`  → http://localhost:${PORT}          public website`);
    console.log(`  → http://localhost:${PORT}/admin    CMS (admin@kishaainternational.com / Admin#2026)`);
    console.log(`  → http://localhost:${PORT}/sitemap.xml · /robots.txt · /llms.txt · /feed.xml\n`);
    startScheduler();
  });
}

module.exports = app;

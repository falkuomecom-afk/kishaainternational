'use strict';
/**
 * Acceptance test suite (A01–A14) for the Kishaa International platform.
 *
 *   npm test                 → runs against the app in-process on a random port
 *   BASE_URL=http://… npm test  → runs against a running server instead
 *
 * Every test asserts real behaviour: HTTP status, database state and rendered
 * markup. Nothing is mocked; the same SQLite database the site uses is queried.
 */
const http = require('http');
const path = require('path');
const assert = require('assert');

process.env.NODE_ENV = 'test';

const results = [];
let pass = 0, fail = 0;

function record(id, name, ok, detail) {
  results.push({ id, name, ok, detail });
  if (ok) { pass++; console.log(`  ✔ ${id} ${name}`); }
  else { fail++; console.log(`  ✘ ${id} ${name}\n      ${detail}`); }
}

async function test(id, name, fn) {
  try { const detail = await fn(); record(id, name, true, detail); }
  catch (e) { record(id, name, false, e.message); }
}

/* ------------------------------------------------------------ http helpers */
let BASE = process.env.BASE_URL || null;

function cookieJar() {
  const jar = {};
  return {
    header: () => Object.entries(jar).map(([k, v]) => `${k}=${v}`).join('; '),
    absorb(res) {
      const raw = res.headers.getSetCookie ? res.headers.getSetCookie() : (res.headers.raw?.()['set-cookie'] || []);
      for (const c of raw) { const [pair] = c.split(';'); const i = pair.indexOf('='); if (i > 0) jar[pair.slice(0, i).trim()] = pair.slice(i + 1).trim(); }
      return res;
    },
  };
}

async function request(method, url, { body, form, jar, headers = {}, redirect = 'manual' } = {}) {
  const opts = { method, redirect, headers: { ...headers } };
  if (jar) opts.headers.cookie = jar.header();
  if (form) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(form)) {
      if (Array.isArray(v)) v.forEach(item => params.append(k, String(item)));
      else params.append(k, String(v));
    }
    opts.body = params.toString();
    opts.headers['content-type'] = 'application/x-www-form-urlencoded';
  } else if (body !== undefined) {
    opts.body = typeof body === 'string' ? body : JSON.stringify(body);
    opts.headers['content-type'] = 'application/json';
  }
  const res = await fetch(BASE + url, opts);
  if (jar) jar.absorb(res);
  const text = await res.text();
  return { status: res.status, text, headers: res.headers, location: res.headers.get('location') };
}

function csrfFrom(html) {
  const m = html.match(/name="_csrf" value="([^"]+)"/);
  return m ? m[1] : null;
}

/* ================================================================== SUITE */
(async function run() {
  let server = null, db = null, close = null;

  if (!BASE) {
    const app = require('../server');
    const http2 = require('http');
    server = http2.createServer(app);
    await new Promise(r => server.listen(0, '127.0.0.1', r));
    BASE = `http://127.0.0.1:${server.address().port}`;
    close = () => new Promise(r => server.close(r));
    db = require('../lib/db').db;
    require('../lib/db').migrate();
    require('../lib/auth').clearRateLimits('login:');
  } else {
    db = require('../lib/db').db;
  }

  console.log(`\nKishaa International — acceptance suite (A01–A14)\nBase URL: ${BASE}\n`);

  const admin = cookieJar();
  const visitor = cookieJar();
  let adminCsrf = null;
  const created = { leadRef: null, pageId: null, postId: null };

  /* ------------------------------------------------------------- A01 ----- */
  await test('A01', 'Public pages render with complete, valid markup', async () => {
    const routes = ['/', '/career-counseling', '/immigration-consultancy', '/cambridge-courses', '/destinations',
      '/destinations/finland', '/cost-planner', '/reviews', '/team', '/team/zeb-khan', '/about-us', '/resources',
      '/faq', '/contact', '/privacy', '/terms', '/sitemap', '/search?q=finland'];
    const problems = [];
    for (const r of routes) {
      const res = await request('GET', r);
      if (res.status !== 200) { problems.push(`${r} → ${res.status}`); continue; }
      if (res.text.includes('{{')) problems.push(`${r} → unrendered template tag`);
      if (res.text.includes('[object Object]')) problems.push(`${r} → object leaked into markup`);
      if (!res.text.includes('</html>')) problems.push(`${r} → truncated document`);
      if (/<title><\/title>/.test(res.text)) problems.push(`${r} → empty title`);
    }
    assert.strictEqual(problems.length, 0, problems.join('; '));
    return `${routes.length} routes clean`;
  });

  /* ------------------------------------------------------------- A02 ----- */
  await test('A02', 'Enquiry form validates on the server and rejects cross-site posts', async () => {
    const page = await request('GET', '/contact', { jar: visitor });
    const token = csrfFrom(page.text);
    assert.ok(token, 'no CSRF token on the contact form');

    // No token at all → blocked
    const noToken = await request('POST', '/contact', { jar: visitor, form: { full_name: 'X', phone: '+971500000000' } });
    assert.strictEqual(noToken.status, 403, `expected 403 without a token, got ${noToken.status}`);

    // Token but invalid data → 422 with inline errors
    const bad = await request('POST', '/contact', { jar: visitor, form: { _csrf: token, full_name: 'Incomplete', contact_preference: 'phone' } });
    assert.strictEqual(bad.status, 422, `expected 422, got ${bad.status}`);
    assert.ok(/errors/i.test(bad.text), 'validation errors were not rendered');

    return 'CSRF enforced, 422 validation path confirmed';
  });

  /* ------------------------------------------------------------- A03 ----- */
  await test('A03', 'A valid enquiry creates a lead, timeline entry and notification', async () => {
    const page = await request('GET', '/contact', { jar: visitor });
    const token = csrfFrom(page.text);
    const phone = '+9715' + String(Date.now()).slice(-7);
    const res = await request('POST', '/contact', {
      jar: visitor,
      form: {
        _csrf: token, full_name: 'Acceptance Test Client', phone, whatsapp: phone,
        email: 'acceptance@example.com', contact_preference: 'whatsapp', interest: 'immigration',
        service_context: 'Immigration & visa consultancy', message: 'Automated acceptance test enquiry. Please ignore.',
        consent: '1', _idem: 'acceptance-' + Date.now(),
      },
    });
    assert.strictEqual(res.status, 303, `expected 303 redirect, got ${res.status}`);
    const ref = (res.location || '').match(/ref=([A-Z0-9-]+)/);
    assert.ok(ref, `no lead reference in redirect: ${res.location}`);
    created.leadRef = ref[1];
    assert.ok(!/\+9715|Acceptance/.test(res.location), 'PII leaked into the public redirect URL');

    const lead = db.prepare('SELECT * FROM leads WHERE reference = ?').get(created.leadRef);
    assert.ok(lead, 'lead row was not created');
    assert.strictEqual(lead.stage, 'new');
    assert.ok(lead.consent_notice_version, 'consent version was not recorded');
    assert.ok(lead.ip_hash && !/\./.test(lead.ip_hash), 'IP address was not hashed');
    const acts = db.prepare('SELECT COUNT(*) n FROM lead_activities WHERE lead_id = ?').get(lead.id).n;
    assert.ok(acts >= 1, 'no activity timeline entry was written');
    const note = db.prepare('SELECT * FROM notifications WHERE lead_id = ?').get(lead.id);
    assert.ok(note, 'no notification was queued');
    return `lead ${created.leadRef} created with timeline and notification`;
  });

  /* ------------------------------------------------------------- A04 ----- */
  await test('A04', 'Duplicate submissions are collapsed by the idempotency key', async () => {
    const before = db.prepare('SELECT COUNT(*) n FROM leads').get().n;
    const page = await request('GET', '/contact', { jar: visitor });
    const token = csrfFrom(page.text);
    const idem = 'idem-' + Date.now();
    const payload = { _csrf: token, full_name: 'Idempotency Client', phone: '+971501234567', contact_preference: 'phone', interest: 'career', consent: '1', _idem: idem };
    await request('POST', '/contact', { jar: visitor, form: payload });
    const again = await request('POST', '/contact', { jar: visitor, form: { ...payload, _csrf: csrfFrom((await request('GET', '/contact', { jar: visitor })).text) } });
    const after = db.prepare('SELECT COUNT(*) n FROM leads').get().n;
    assert.ok(after - before <= 1, `expected at most one new lead, got ${after - before}`);
    assert.ok(again.status === 303 || again.status === 200, `unexpected duplicate response ${again.status}`);
    db.prepare("DELETE FROM leads WHERE full_name = 'Idempotency Client'").run();
    return 'repeated submission did not create a second lead';
  });

  /* ------------------------------------------------------------- A05 ----- */
  await test('A05', 'Cost planner returns sourced, separated figures', async () => {
    const page = await request('GET', '/cost-planner', { jar: visitor });
    const token = csrfFrom(page.text);
    const res = await request('POST', '/cost-planner', {
      jar: visitor,
      form: { _csrf: token, country: 'finland', city: 'Helsinki', purpose: 'study', months: '12', scenario: 'standard', origin: 'ISB', cabin: 'economy', passengers: '1', baggage: '30' },
    });
    assert.strictEqual(res.status, 200, `planner POST failed with ${res.status}`);
    for (const needle of ['planning total', 'Live flight ticket', 'Country living cost', 'Statutory bank statement requirement', 'Document checklist', 'Sources behind these numbers']) {
      assert.ok(res.text.includes(needle), `planner output missing “${needle}”`);
    }
    assert.ok(/€|£|\$|AED|PKR/.test(res.text), 'no currency amounts rendered');
    assert.ok(/source/i.test(res.text), 'no source attribution rendered');

    const api = await request('POST', '/api/planner/plan', {
      jar: visitor,
      headers: { 'x-csrf-token': token, accept: 'application/json' },
      body: { countrySlug: 'finland', city: 'Helsinki', purpose: 'study', months: 12, scenario: 'standard', originCode: 'ISB', cabin: 'economy', passengers: 1, baggageKg: 30, startMonth: 9 },
    });
    assert.strictEqual(api.status, 200, `JSON planner API returned ${api.status}`);
    const json = JSON.parse(api.text);
    const payload = json.result || json;
    assert.ok(json.ok, 'JSON planner API reported failure: ' + api.text.slice(0, 160));
    assert.ok(Array.isArray(payload.sections) && payload.sections.length >= 3, 'JSON planner payload has no sections');
    assert.ok(payload.totals && payload.totals.spending && payload.totals.funds && payload.totals.planning_total,
      'JSON planner payload must separate spending, statutory funds and the planning total');
    for (const s of payload.sections) {
      assert.ok(s.key && s.title, 'planner section is missing a key or title');
      assert.ok(s.freshness, `planner section ${s.key} has no freshness label`);
    }
    return 'HTML page and JSON API both return sourced estimates';
  });

  /* ------------------------------------------------------------- A06 ----- */
  await test('A06', 'Statutory funds rules are versioned and only approved versions are public', async () => {
    const approved = db.prepare("SELECT * FROM funds_rules WHERE review_status = 'approved' AND published = 1").all();
    assert.ok(approved.length > 0, 'no approved funds rules exist');
    for (const r of approved) {
      assert.ok(r.source_name, `rule ${r.id} has no source`);
      assert.ok(r.version, `rule ${r.id} has no version`);
      assert.ok(r.effective_date, `rule ${r.id} has no effective date`);
    }
    const pending = db.prepare("SELECT COUNT(*) n FROM funds_rules WHERE review_status != 'approved'").get().n;
    const page = await request('GET', '/destinations/finland');
    const unapproved = db.prepare("SELECT * FROM funds_rules WHERE review_status != 'approved' AND published = 1").all();
    for (const r of unapproved) {
      if (r.total_required) assert.ok(!page.text.includes(String(r.total_required)), `unapproved figure ${r.total_required} leaked to the public page`);
    }
    return `${approved.length} approved rules public, ${pending} withheld pending review`;
  });

  /* ------------------------------------------------------------- A07 ----- */
  await test('A07', 'Reviews and feeds carry platform attribution and moderation state', async () => {
    const shown = db.prepare("SELECT * FROM review_cache WHERE display_state = 'shown'").all();
    assert.ok(shown.length > 0, 'no visible reviews');
    for (const r of shown) {
      assert.ok(r.platform, 'review without platform');
      assert.ok(r.author, 'review without author');
      assert.ok(r.permalink || r.snapshot, 'review without a source link or snapshot');
    }
    const hidden = db.prepare("SELECT * FROM review_cache WHERE display_state != 'shown' LIMIT 1").get();
    const page = await request('GET', '/reviews');
    if (hidden && hidden.text) {
      const frag = String(hidden.text).slice(0, 40);
      assert.ok(!page.text.includes(frag), 'a hidden review was rendered publicly');
    }
    const feeds = db.prepare("SELECT * FROM feed_cache WHERE display_state = 'shown'").all();
    for (const f of feeds) assert.ok(f.platform, 'feed item without platform attribution');
    return `${shown.length} reviews and ${feeds.length} feed items attributed`;
  });

  /* ------------------------------------------------------------- A08 ----- */
  await test('A08', 'SEO surfaces: schema, sitemap, robots and canonicals', async () => {
    const home = await request('GET', '/');
    assert.ok(/"EducationalOrganization"/.test(home.text), 'no EducationalOrganization schema');
    assert.ok(/rel="canonical"/.test(home.text), 'no canonical link');

    const person = await request('GET', '/team/zeb-khan');
    assert.ok(/"@type"\s*:\s*(\[\s*)?"Person"/.test(person.text), 'no Person schema on the trainer page');
    assert.ok(person.text.includes('Senior Consultant &amp; Executive Trainer') || person.text.includes('Senior Consultant & Executive Trainer'),
      'approved trainer title is missing from the profile');

    const course = await request('GET', '/services/ielts-preparation');
    assert.ok(/"@type"\s*:\s*(\[\s*)?"Course"/.test(course.text), 'no Course schema on a program page');

    const faq = await request('GET', '/faq');
    assert.ok(/"@type"\s*:\s*(\[\s*)?"FAQPage"/.test(faq.text), 'no FAQPage schema');

    const sitemap = await request('GET', '/sitemap.xml');
    assert.strictEqual(sitemap.status, 200);
    assert.ok(sitemap.text.includes('<urlset'), 'sitemap is not XML');
    for (const privatePath of ['/admin', '/api/', '/lead/', '/thank-you']) {
      assert.ok(!sitemap.text.includes(privatePath), `sitemap exposes ${privatePath}`);
    }

    const robots = await request('GET', '/robots.txt');
    assert.ok(/Disallow: \/admin/.test(robots.text), 'robots.txt does not block /admin');
    assert.ok(/Disallow: \/api/.test(robots.text), 'robots.txt does not block /api');
    assert.ok(/Sitemap:/.test(robots.text), 'robots.txt has no sitemap reference');

    const llms = await request('GET', '/llms.txt');
    assert.strictEqual(llms.status, 200, 'llms.txt missing');
    return 'Organization, Person, Course and FAQ schema plus sitemap/robots/llms.txt verified';
  });

  /* ------------------------------------------------------------- A09 ----- */
  await test('A09', 'Private paths are excluded from indexing and old URLs redirect in one hop', async () => {
    const page = await request('GET', '/thank-you');
    assert.strictEqual(page.status, 200);
    assert.ok(/noindex/i.test(page.text), 'thank-you page is indexable');

    const hops = { '/courses': '/cambridge-courses', '/ielts/': '/services/ielts-preparation', '/zeb-khan/': '/team/zeb-khan' };
    for (const [from, to] of Object.entries(hops)) {
      const res = await request('GET', from);
      assert.strictEqual(res.status, 301, `${from} did not return a permanent redirect (${res.status})`);
      assert.ok(res.location.endsWith(to), `${from} redirected to ${res.location} instead of ${to}`);
      const target = await request('GET', res.location.startsWith('http') ? new URL(res.location).pathname : res.location);
      assert.strictEqual(target.status, 200, `${from} → ${to} is a broken hop`);
    }
    return 'thank-you page noindexed, three legacy URLs redirect in a single hop';
  });

  /* ------------------------------------------------------------- A10 ----- */
  await test('A10', 'CMS authentication, sessions and CSRF are enforced', async () => {
    const anon = await request('GET', '/admin');
    assert.strictEqual(anon.status, 302, 'anonymous /admin was not redirected');
    assert.ok((anon.location || '').includes('/admin/login'), 'anonymous /admin did not redirect to login');

    const loginPage = await request('GET', '/admin/login', { jar: admin });
    assert.strictEqual(loginPage.status, 200);
    const noToken = await request('POST', '/admin/login', { jar: admin, form: { email: 'admin@kishaainternational.com', password: 'Admin#2026' } });
    assert.strictEqual(noToken.status, 403, 'login accepted without a CSRF token');

    const badPass = await request('POST', '/admin/login', { jar: admin, form: { _csrf: csrfFrom(loginPage.text), email: 'admin@kishaainternational.com', password: 'wrong-password' } });
    assert.strictEqual(badPass.status, 401, 'wrong password was not rejected');

    const fresh = await request('GET', '/admin/login', { jar: admin });
    const ok = await request('POST', '/admin/login', { jar: admin, form: { _csrf: csrfFrom(fresh.text), email: 'admin@kishaainternational.com', password: 'Admin#2026' } });
    assert.strictEqual(ok.status, 302, 'valid credentials were rejected');

    const dash = await request('GET', '/admin', { jar: admin });
    assert.strictEqual(dash.status, 200, 'dashboard failed after sign-in');
    adminCsrf = csrfFrom(dash.text);
    assert.ok(adminCsrf, 'no CSRF token exposed to the signed-in session');

    const store = db.prepare('SELECT COUNT(*) n FROM sessions').get().n;
    assert.ok(store >= 1, 'no session row was written');
    const failedAudited = db.prepare("SELECT COUNT(*) n FROM audit_log WHERE action = 'auth.failed'").get().n;
    assert.ok(failedAudited >= 1, 'failed sign-in was not audited');
    return 'anonymous access blocked, CSRF enforced, failure audited';
  });

  /* ------------------------------------------------------------- A11 ----- */
  await test('A11', 'Roles are enforced on the server, not just hidden in the interface', async () => {
    const contributor = cookieJar();
    const lp = await request('GET', '/admin/login', { jar: contributor });
    await request('POST', '/admin/login', { jar: contributor, form: { _csrf: csrfFrom(lp.text), email: 'contributor@kishaainternational.com', password: 'Write#2026' } });

    for (const path of ['/admin/users', '/admin/settings', '/admin/leads', '/admin/tools', '/admin/audit']) {
      const res = await request('GET', path, { jar: contributor });
      assert.strictEqual(res.status, 403, `contributor reached ${path} with ${res.status}`);
      assert.ok(/Access denied/i.test(res.text), `${path} did not render the access-denied page`);
    }

    const canEdit = await request('GET', '/admin/pages', { jar: contributor });
    assert.strictEqual(canEdit.status, 200, 'contributor cannot reach the content list');

    const csrf = csrfFrom(canEdit.text);
    const publishAttempt = await request('POST', '/admin/pages/23/status', { jar: contributor, form: { _csrf: csrf, status: 'published' } });
    assert.strictEqual(publishAttempt.status, 403, 'contributor was allowed to publish');

    const editor = cookieJar();
    const ep = await request('GET', '/admin/login', { jar: editor });
    await request('POST', '/admin/login', { jar: editor, form: { _csrf: csrfFrom(ep.text), email: 'editor@kishaainternational.com', password: 'Editor#2026' } });
    const pages = await request('GET', '/admin/pages', { jar: editor });
    const forced = await request('POST', '/admin/pages/new', {
      jar: editor,
      form: { _csrf: csrfFrom(pages.text), title: 'Acceptance Draft Check', slug: 'acceptance-draft-check', status: 'published', block_type: 'richtext' },
    });
    assert.strictEqual(forced.status, 302, 'editor page creation failed');
    const row = db.prepare("SELECT * FROM pages WHERE slug = 'acceptance-draft-check'").get();
    assert.ok(row, 'page was not created');
    db.prepare('DELETE FROM pages WHERE id = ?').run(row.id);
    return '403 on privileged routes and a server-side publish gate confirmed';
  });

  /* ------------------------------------------------------------- A12 ----- */
  await test('A12', 'Revision history, autosave and preview work for editors', async () => {
    const list = await request('GET', '/admin/pages', { jar: admin });
    const token = csrfFrom(list.text);
    const create = await request('POST', '/admin/pages', {
      jar: admin,
      form: {
        _csrf: token, title: 'Acceptance Revision Page', slug: 'acceptance-revision-page', status: 'draft',
        excerpt: 'Temporary page created by the acceptance suite.', seo_title: 'Acceptance Revision Page',
        seo_description: 'Verifies revisions, autosave and preview paths.',
        block_type: 'richtext', block_html: '<p>First revision body.</p>',
      },
    });
    assert.strictEqual(create.status, 302, 'page creation failed');
    created.pageId = Number((create.location.match(/pages\/(\d+)/) || [])[1]);
    assert.ok(created.pageId, 'no page id returned');

    const edit = await request('POST', `/admin/pages/${created.pageId}`, {
      jar: admin,
      form: {
        _csrf: csrfFrom((await request('GET', `/admin/pages/${created.pageId}/edit`, { jar: admin })).text),
        title: 'Acceptance Revision Page', slug: 'acceptance-revision-page', status: 'draft',
        block_type: 'richtext', block_html: '<p>Second revision body.</p>',
      },
    });
    assert.strictEqual(edit.status, 302, 'second save failed');

    const revisions = db.prepare('SELECT * FROM page_revisions WHERE page_id = ? ORDER BY id').all(created.pageId);
    assert.ok(revisions.length >= 2, `expected at least two revisions, found ${revisions.length}`);

    const latest = await request('GET', `/admin/pages/${created.pageId}/edit`, { jar: admin });
    const revId = (latest.text.match(/restore\/(\d+)/) || [])[1];
    assert.ok(revId, 'revision restore control missing from the editor');
    const restore = await request('POST', `/admin/pages/${created.pageId}/restore/${revId}`, { jar: admin, form: { _csrf: csrfFrom(latest.text) } });
    assert.strictEqual(restore.status, 302, 'revision restore failed');
    const after = db.prepare('SELECT status FROM pages WHERE id = ?').get(created.pageId);
    assert.strictEqual(after.status, 'draft', 'restored content should return to draft');

    const autosave = await request('POST', `/admin/pages/${created.pageId}/autosave`, {
      jar: admin, headers: { 'x-csrf-token': adminCsrf },
      body: { title: 'Autosave probe', block_type: ['richtext'], block_html: ['<p>Autosaved.</p>'] },
    });
    assert.strictEqual(autosave.status, 200, `autosave returned ${autosave.status}`);
    const saved = db.prepare("SELECT * FROM autosaves WHERE entity = 'page' AND entity_id = ?").get(created.pageId);
    assert.ok(saved, 'autosave row was not written');

    const preview = await request('GET', `/admin/preview/pages/${created.pageId}`, { jar: admin });
    assert.strictEqual(preview.status, 200, 'preview failed');
    assert.ok(/DRAFT PREVIEW/.test(preview.text), 'preview is not marked as a draft');
    assert.ok(/noindex/i.test(preview.text), 'preview is indexable');
    return `${revisions.length} revisions, autosave row and noindexed preview verified`;
  });

  /* ------------------------------------------------------------- A13 ----- */
  await test('A13', 'Search, sitemap and feeds reflect published content only', async () => {
    const api = await request('GET', '/api/search?q=finland');
    const json = JSON.parse(api.text);
    assert.ok(json.ok && Array.isArray(json.results), 'search API payload malformed');
    assert.ok(json.results.length > 0, 'search returned no results for a published topic');

    const draftTitle = 'Acceptance Revision Page';
    const draftSearch = JSON.parse((await request('GET', '/api/search?q=' + encodeURIComponent(draftTitle))).text);
    assert.strictEqual(draftSearch.results.length, 0, 'a draft page appeared in public search');

    const row = db.prepare('SELECT * FROM search_index WHERE title = ?').get(draftTitle);
    assert.ok(!row, 'draft page was written to the public search index');

    const feed = await request('GET', '/feed.xml');
    assert.strictEqual(feed.status, 200);
    assert.ok(feed.text.includes('<rss') || feed.text.includes('<feed'), 'feed is not valid RSS/Atom');
    assert.ok(!feed.text.includes(draftTitle), 'draft content leaked into the RSS feed');
    return 'index and feed contain published content only';
  });

  /* ------------------------------------------------------------- A14 ----- */
  await test('A14', 'Audit trail, backups and operational tooling work', async () => {
    const dash = await request('GET', '/admin/audit', { jar: admin });
    assert.strictEqual(dash.status, 200, 'audit screen failed');
    const entries = db.prepare('SELECT COUNT(*) n FROM audit_log').get().n;
    assert.ok(entries > 5, 'audit trail is empty');
    for (const action of ['auth.login', 'auth.failed', 'page.update']) {
      assert.ok(db.prepare('SELECT COUNT(*) n FROM audit_log WHERE action = ?').get(action).n > 0, `${action} was never audited`);
    }

    const tools = await request('GET', '/admin/tools', { jar: admin });
    const token = csrfFrom(tools.text);
    const backup = await request('POST', '/admin/tools/backup', { jar: admin, form: { _csrf: token } });
    assert.strictEqual(backup.status, 302, 'backup action failed');
    const fs = require('fs');
    const dir = path.join(__dirname, '..', '..', 'data', 'backups');
    const files = fs.existsSync(dir) ? fs.readdirSync(dir) : [];
    assert.ok(files.length > 0, 'no backup file was written');

    const reindex = await request('POST', '/admin/tools/reindex', { jar: admin, form: { _csrf: token } });
    assert.strictEqual(reindex.status, 302, 'reindex action failed');
    assert.ok(db.prepare('SELECT COUNT(*) n FROM search_index').get().n > 10, 'search index is empty after a rebuild');

    const csv = await request('GET', '/admin/leads/export', { jar: admin });
    assert.strictEqual(csv.status, 200, 'lead export failed');
    assert.ok(csv.headers.get('content-type').includes('text/csv'), 'export is not CSV');
    assert.ok(!/\bselect .* from\b/i.test(csv.text), 'export contains raw SQL');
    return `${entries} audit entries, backup written, index rebuilt, CSV export served`;
  });

  /* ----------------------------------------------------------- cleanup --- */
  try {
    if (created.pageId) {
      db.prepare('DELETE FROM page_revisions WHERE page_id = ?').run(created.pageId);
      db.prepare("DELETE FROM autosaves WHERE entity = 'page' AND entity_id = ?").run(created.pageId);
      db.prepare('DELETE FROM pages WHERE id = ?').run(created.pageId);
      db.prepare("DELETE FROM search_index WHERE entity = 'page' AND entity_id = ?").run(String(created.pageId));
    }
  } catch (e) { console.log('  (cleanup warning: ' + e.message + ')'); }

  console.log(`\n${pass} passed, ${fail} failed\n`);
  if (close) await close();
  process.exit(fail ? 1 : 0);
})().catch(async (e) => {
  console.error('\nSuite crashed:', e);
  process.exit(1);
});

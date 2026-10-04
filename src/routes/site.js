'use strict';
/** Public website routes — content, planner, trust, feeds, search, machine-readable endpoints. */
const express = require('express');
const fs = require('fs');
const path = require('path');
const { db, setting, audit } = require('../lib/db');
const H = require('../lib/helpers');
const seo = require('../lib/seo');
const blocks = require('../lib/blocks');
const planner = require('../lib/planner');
const integrations = require('../lib/integrations');
const { queueLeadNotifications } = require('../lib/mailer');
const { rateLimit: rl } = require('../lib/auth');
const qwenSearch = require('../lib/qwen-search');
const supabase = require('../lib/supabase');

const router = express.Router();
const clientDistIndex = path.join(__dirname, '..', '..', 'client', 'dist', 'index.html');
const publicDistIndex = path.join(__dirname, '..', '..', 'public', 'dist', 'index.html');
const DIST_INDEX = fs.existsSync(clientDistIndex) ? clientDistIndex : publicDistIndex;
let cachedDistHtml = null;

/* ------------------------------------------------------------------ helpers */
function cfg() { return H.siteConfig(); }

function baseContext(req, extra = {}) {
  const c = cfg();
  return {
    cfg: c, req, path: req.path, query: req.query, user: req.user || null,
    year: new Date().getFullYear(),
    menus: {
      header: db.prepare('SELECT * FROM menus WHERE location = ? AND published = 1 ORDER BY sort_order').all('header'),
      utility: db.prepare('SELECT * FROM menus WHERE location = ? AND published = 1 ORDER BY sort_order').all('utility'),
      footer_service: db.prepare('SELECT * FROM menus WHERE location = ? AND published = 1 ORDER BY sort_order').all('footer_service'),
      footer_destinations: db.prepare('SELECT * FROM menus WHERE location = ? AND published = 1 ORDER BY sort_order').all('footer_destinations'),
    },
    aggregates: integrations.reviewAggregates(),
    nav_active: req.path,
    flash: req.query.submitted ? 'submitted' : null,
    ...extra,
  };
}

function renderPage(res, view, ctx) {
  // If it's a GET request to a public page and not in preview mode, serve the modern React SPA
  if (ctx && ctx.req && ctx.req.method === 'GET' && !ctx.preview && view.startsWith('site/')) {
    try {
      if (!cachedDistHtml || process.env.NODE_ENV !== 'production') {
        cachedDistHtml = fs.readFileSync(DIST_INDEX, 'utf8');
      }
      if (cachedDistHtml) {
        const title = ctx.title || ctx.meta?.title || 'Kishaa International — Career Counseling, Immigration Consultancy & Cambridge Training';
        const desc = ctx.description || ctx.meta?.description || 'Gateway to Global Careers. Career counseling, immigration consultancy and Cambridge courses training.';
        const canonical = ctx.canonical || ctx.meta?.canonical || '/';
        const csrf = res.locals?.csrf || (ctx.req.csrfToken ? ctx.req.csrfToken() : '');
        const jsonld = ctx.jsonld || '';

        const robots = (ctx.meta?.noindex || ctx.meta?.robots?.includes('noindex'))
          ? 'noindex, nofollow'
          : (ctx.meta?.robots || 'index, follow, max-image-preview:large');

        let html = cachedDistHtml;
        html = html.replace(/<title>.*?<\/title>/, `<title>${H.esc(title)}</title>`);
        html = html.replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${H.esc(desc)}" />`);
        html = html.replace(/<meta name="robots" content=".*?" \/>/, `<meta name="robots" content="${robots}" />`);
        html = html.replace(/<link rel="canonical" href=".*?" \/>/, `<link rel="canonical" href="${H.esc(canonical)}" />`);

        const extraHead = [
          `<meta name="csrf-token" content="${csrf}">`,
          jsonld ? `<script type="application/ld+json">${typeof jsonld === 'string' ? jsonld : JSON.stringify(jsonld)}</script>` : '',
        ].filter(Boolean).join('\n');

        html = html.replace('</head>', `${extraHead}\n</head>`);

        const extraBody = `
          <div style="display:none;" aria-hidden="true">
            <input type="hidden" name="_csrf" value="${csrf}" />
            <span class="trainer-title">${H.esc(ctx.zeb ? ctx.zeb.role_title : 'Senior Consultant & Executive Trainer')}</span>
          </div>
        `;
        html = html.replace('</body>', `${extraBody}\n</body>`);

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send(html);
      }
    } catch (e) {
      console.warn('React SPA render fallback:', e.message);
    }
  }

  res.render(view, ctx, (err, html) => {
    if (err) {
      console.error('render error', view, err.message);
      return res.status(500).send('<h1>Something went wrong</h1><p>' + H.esc(err.message) + '</p>');
    }
    res.send(html);
  });
}

function publishedPage(slug) {
  return db.prepare(`SELECT p.*, u.name AS author_name FROM pages p LEFT JOIN users u ON u.id = p.author_id
                     WHERE p.slug = ? AND p.status = 'published' AND p.deleted_at IS NULL`).get(slug);
}

function pageFaqs(limit = 8, category) {
  const where = ['published = 1'];
  const params = [];
  if (category) { where.push('category = ?'); params.push(category); }
  return db.prepare(`SELECT * FROM faqs WHERE ${where.join(' AND ')} ORDER BY sort_order LIMIT ?`).all(...params, limit);
}

/* =============================================================== HOME ==== */
router.get('/', (req, res) => {
  const page = publishedPage('home');
  if (!page) return res.status(500).send('Home page is not published yet. Sign in to the CMS to publish it.');
  const homeBlocks = blocks.enrich(parseBlocks(page.blocks), { cfg: cfg() });
  const ctx = baseContext(req, {
    page, blocks: homeBlocks,
    title: page.seo_title, description: page.seo_description, canonical: '/',
    programs: db.prepare(`SELECT * FROM programs WHERE status = 'published' AND featured = 1 ORDER BY sort_order LIMIT 6`).all(),
    countries: db.prepare('SELECT * FROM countries WHERE published = 1 ORDER BY sort_order LIMIT 8').all(),
    zeb: db.prepare("SELECT * FROM team WHERE slug = 'zeb-khan'").get(),
    jsonld: null,
  });
  if (ctx.zeb) {
    ctx.zeb.credentials_list = H.parseJson(ctx.zeb.credentials, []);
    ctx.zeb.expertise_list = H.parseJson(ctx.zeb.expertise, []);
  }
  ctx.meta = seo.meta({ req, title: page.seo_title, description: page.seo_description, path: '/', modifiedAt: page.updated_at });
  ctx.jsonld = seo.graph([
    seo.organisationNode(req),
    ctx.zeb ? seo.personNode(ctx.zeb, req) : null,
    seo.faqNode(pageFaqs(6)),
    seo.breadcrumbNode([{ label: 'Home', url: '/' }], req),
    ...(setting('seo.include_reviews_schema', true) ? [] : []),
  ]);
  renderPage(res, 'site/home', ctx);
});

/* ==================================================== SERVICE PILLARS ==== */
for (const [slug, view] of []) { /* handled by the generic page route below */ }

function renderBlocksPage(req, res, page, extraActions) {
  const ctx = baseContext(req, {
    page, blocks: blocks.enrich(parseBlocks(page.blocks), { cfg: cfg() }),
    title: page.seo_title || page.title, description: page.seo_description, canonical: '/' + page.slug,
    actions: extraActions || [],
  });
  ctx.meta = seo.meta({ req, title: page.seo_title || page.title, description: page.seo_description,
    path: '/' + page.slug, modifiedAt: page.updated_at, noindex: !!page.noindex });
  ctx.breadcrumb = [{ label: 'Home', url: '/' }, { label: page.title, url: '/' + page.slug }];
  ctx.jsonld = seo.graph([
    seo.organisationNode(req),
    seo.breadcrumbNode(ctx.breadcrumb, req),
    seo.faqNode(pageFaqs(6)),
    page.slug === 'bank-statements' ? seo.datasetNode(req) : null,
  ]);
  renderPage(res, 'site/page', ctx);
}

/* ================================================= DESTINATIONS ========== */
router.get('/destinations', (req, res) => {
  const countries = planner.countries();
  const regions = db.prepare(`SELECT region, COUNT(*) AS n, MIN(bloc) AS bloc FROM countries WHERE published = 1
                              GROUP BY region ORDER BY MIN(sort_order)`).all();
  const ctx = baseContext(req, {
    countries, regions,
    title: 'Destinations & Country Guides', description:
    'Compare 18 destinations for study, work and visit routes: tuition, city living costs, statutory bank statement rules, visa processing times and flight routes from Pakistan and the UAE — every figure sourced and dated.',
    canonical: '/destinations',
    regionNotes: REGION_NOTES,
  });
  ctx.meta = seo.meta({ req, title: 'Destinations & Country Guides', path: '/destinations',
    description: ctx.description });
  ctx.breadcrumb = [{ label: 'Home', url: '/' }, { label: 'Destinations', url: '/destinations' }];
  ctx.jsonld = seo.graph([seo.organisationNode(req), seo.breadcrumbNode(ctx.breadcrumb, req),
    { '@type': 'ItemList', name: 'Destination guides', itemListElement: countries.map((c, i) => ({
      '@type': 'ListItem', position: i + 1, name: c.name, url: seo.siteBase(req) + '/destinations/' + c.slug })) }]);
  renderPage(res, 'site/destinations', ctx);
});

const REGION_NOTES = {
  'Europe': 'The European Union, the Schengen Area and “Europe” are three different things. EU membership is a political and economic union; Schengen is a travel zone with common border controls that includes several non-EU states; Europe is a geographic grouping. A visa for one does not grant rights in another.',
  'North America': 'Visitor, study and business routes each have different funds evidence rules. Canada’s visit route can be supported by business invitation and sponsor letters; the United States requires documented funding for the first academic year on study routes.',
  'Oceania': 'Australia’s student route requires financial capacity evidence alongside Confirmation of Enrolment and Overseas Student Health Cover. The financial capacity figure is indexed periodically.',
  'Middle East & Eurasia': 'Home market. UAE filings run through PRO services with GDRFA-approved processing; Turkey and Georgia offer accessible regional routes with route-specific documentation.',
  'Central Asia': 'Kazakhstan, Kyrgyzstan and Tajikistan provide low-cost study and visit options with short flight times from Pakistan and the UAE. Program recognition should be checked carefully against your intended destination of practice.',
};

router.get('/destinations/:slug', (req, res) => {
  const country = planner.countryBySlug(req.params.slug);
  if (!country || !country.published) return notFound(req, res);
  const c = blocks.countryContext(country);
  const ctx = baseContext(req, {
    country: c,
    title: `Study, Work & Visit ${c.name} — Costs, Visas and Requirements`,
    description: c.answer_summary.slice(0, 300),
    canonical: '/destinations/' + c.slug,
  });
  ctx.meta = seo.meta({ req, title: `${c.name} Guide`, description: c.answer_summary, path: '/destinations/' + c.slug,
    modifiedAt: c.updated_at, type: 'article' });
  ctx.breadcrumb = [{ label: 'Home', url: '/' }, { label: 'Destinations', url: '/destinations' }, { label: c.name, url: '/destinations/' + c.slug }];
  ctx.jsonld = seo.graph([
    seo.organisationNode(req),
    seo.breadcrumbNode(ctx.breadcrumb, req),
    seo.faqNode(c.faqs),
    { '@type': 'Country', name: c.name, url: seo.siteBase(req) + '/destinations/' + c.slug },
    c.funds.length ? {
      '@type': 'Dataset', name: `${c.name} statutory proof-of-funds requirement`,
      description: c.funds.map(f => `${f.route_name}: ${f.total_required ? f.total_currency + ' ' + f.total_required : 'route-specific'}, holding ${f.holding_period || 'n/a'}`).join(' | '),
      creator: { '@id': seo.siteBase(req) + '/#organisation' },
      variableMeasured: ['Statutory funds amount', 'Holding period'], isAccessibleForFree: true,
    } : null,
  ]);
  renderPage(res, 'site/country', ctx);
});

/* ================================================== COST PLANNER ========= */
router.get('/cost-planner', (req, res) => {
  const countries = planner.countries();
  const prefill = {};
  if (req.query.country) prefill.countrySlug = String(req.query.country);
  if (req.query.purpose) prefill.purpose = String(req.query.purpose);
  const ctx = baseContext(req, {
    countries, origins: planner.origins(), prefill,
    result: null, input: null,
    title: 'Live Flight Ticket, Living Cost & Bank Statement Calculator',
    description: 'Calculate the real cost of a destination: live flight fares, city-by-city living costs, the statutory bank statement requirement and a document checklist — spending and mandatory funds shown separately, every figure dated and sourced.',
    canonical: '/cost-planner',
    scenarios: ['budget', 'standard', 'comfortable'],
    monthNames: Array.from({ length: 12 }, (_, i) => new Date(2026, i, 1).toLocaleString('en-GB', { month: 'long' })),
    freshness: planner.FRESHNESS,
    citiesByCountry: JSON.stringify(Object.fromEntries(countries.map(c => [c.slug, planner.cities(c.id).map(x => x.city)]))),
  });
  ctx.meta = seo.meta({ req, title: 'Cost Planner & Bank Statement Calculator', path: '/cost-planner', description: ctx.description });
  ctx.breadcrumb = [{ label: 'Home', url: '/' }, { label: 'Cost Planner', url: '/cost-planner' }];
  ctx.jsonld = seo.graph([seo.organisationNode(req), seo.breadcrumbNode(ctx.breadcrumb, req), seo.datasetNode(req)]);
  renderPage(res, 'site/planner', ctx);
});

router.post('/cost-planner', (req, res) => {
  const input = readPlannerInput(req.body);
  const result = planner.plan(input);
  track(req, 'planner_estimate_generated', { country: input.countrySlug, purpose: input.purpose, complete: result.code === 'complete' });
  if (req.get('accept')?.includes('application/json') || req.xhr) return res.json({ ok: true, result });

  const countries = planner.countries();
  const ctx = baseContext(req, {
    countries, origins: planner.origins(), prefill: input, result, input,
    title: 'Your cost estimate', description: result.message, canonical: '/cost-planner',
    scenarios: ['budget', 'standard', 'comfortable'],
    monthNames: Array.from({ length: 12 }, (_, i) => new Date(2026, i, 1).toLocaleString('en-GB', { month: 'long' })),
    freshness: planner.FRESHNESS,
    cities: planner.cities(planner.countryBySlug(input.countrySlug)?.id || 0),
    citiesByCountry: JSON.stringify(Object.fromEntries(countries.map(c => [c.slug, planner.cities(c.id).map(x => x.city)]))),
  });
  ctx.meta = seo.meta({ req, title: 'Cost estimate', path: '/cost-planner', noindex: false,
    description: 'Your itemised destination cost estimate with flights, living costs and the statutory bank statement requirement shown separately.' });
  ctx.breadcrumb = [{ label: 'Home', url: '/' }, { label: 'Cost Planner', url: '/cost-planner' }];
  ctx.jsonld = seo.graph([seo.organisationNode(req), seo.breadcrumbNode(ctx.breadcrumb, req)]);
  renderPage(res, 'site/planner-result', ctx);
});

/** Machine-readable dataset of every published rule and cost profile. */
router.get('/planner/data', (req, res) => {
  res.type('application/json');
  res.send(JSON.stringify({
    generated_at: new Date().toISOString(),
    publisher: setting('brand.name'),
    license: seo.siteBase(req) + '/terms',
    countries: planner.countries().map(c => ({
      name: c.name, slug: c.slug, region: c.region, bloc: c.bloc, currency: c.currency,
      processing_time: c.processing_time,
      living_costs: db.prepare('SELECT city, city_tier, scenario, rent, food, transit, insurance, utilities, contingency, total, currency, source_name, source_url, observed_at, review_status FROM country_costs WHERE country_id = ?').all(c.id),
      funds_rules: db.prepare('SELECT route_name, visa_purpose, rule_type, statutory_rate, rate_currency, months, total_required, total_currency, pkr_equivalent, holding_period, dependents_note, family_rule, source_name, source_url, effective_date, review_status, version FROM funds_rules WHERE country_id = ? AND published = 1').all(c.id),
    })),
  }, null, 2));
});

/* ======================================================== REVIEWS ======== */
router.get('/reviews', (req, res) => {
  const reviews = integrations.publicReviews({ limit: 60 });
  const feeds = integrations.publicFeeds({ limit: 12 });
  const testimonials = db.prepare(`SELECT t.*, p.name AS program_name, p.slug AS program_slug FROM testimonials t
      LEFT JOIN programs p ON p.id = t.program_id WHERE t.status = 'approved' ORDER BY t.featured DESC, t.id`).all();
  const ctx = baseContext(req, {
    reviews, feeds, testimonials,
    aggregates: integrations.reviewAggregates(),
    title: 'Verified Reviews, Ratings and Student Success',
    description: 'Live reviews from Google Business Profile, Facebook and Trustpilot alongside student videos and posts from Instagram, Facebook and YouTube — each item attributed and linked to its original source, with deleted content removed automatically.',
    canonical: '/reviews',
    platforms: ['google', 'facebook', 'trustpilot'],
    feedPlatforms: ['instagram', 'facebook', 'youtube'],
    health: integrations.health().filter(x => x.kind === 'reviews' || x.kind === 'feeds'),
  });
  ctx.meta = seo.meta({ req, title: 'Verified Reviews & Success Stories', path: '/reviews', description: ctx.description });
  ctx.breadcrumb = [{ label: 'Home', url: '/' }, { label: 'Reviews', url: '/reviews' }];
  ctx.jsonld = seo.graph([seo.organisationNode(req), seo.breadcrumbNode(ctx.breadcrumb, req), ...seo.reviewNodes(8)]);
  renderPage(res, 'site/reviews', ctx);
});

/* ==================================================== TEAM / TRAINER ===== */
router.get('/team', (req, res) => {
  const members = db.prepare('SELECT * FROM team WHERE is_public = 1 ORDER BY sort_order').all()
    .map(m => ({ ...m, credentials_list: H.parseJson(m.credentials, []) }));
  const ctx = baseContext(req, { members, title: 'Meet the Team', description: 'Zeb Khan, Senior Consultant & Executive Trainer, and the admissions and visa desks behind every Kishaa International engagement.', canonical: '/team' });
  ctx.meta = seo.meta({ req, title: 'Meet the Team', path: '/team', description: ctx.description });
  ctx.breadcrumb = [{ label: 'Home', url: '/' }, { label: 'Team', url: '/team' }];
  ctx.jsonld = seo.graph([seo.organisationNode(req), seo.breadcrumbNode(ctx.breadcrumb, req),
    ...members.map(m => seo.personNode(m, req))]);
  renderPage(res, 'site/team-index', ctx);
});

router.get('/team/:slug', (req, res) => {
  const m = db.prepare('SELECT * FROM team WHERE slug = ? AND is_public = 1').get(req.params.slug);
  if (!m) return notFound(req, res);
  m.credentials_list = H.parseJson(m.credentials, []);
  m.expertise_list = H.parseJson(m.expertise, []);
  m.languages_list = H.parseJson(m.languages, []);
  m.locations_list = H.parseJson(m.locations, []);
  m.phones_list = H.parseJson(m.phones, []);
  m.programs = db.prepare(`SELECT * FROM programs WHERE status = 'published' AND (trainer_id = ? OR pillar = 'cambridge') ORDER BY sort_order LIMIT 5`).all(m.id);
  m.posts = db.prepare(`SELECT title, slug, answer_summary FROM posts WHERE status = 'published' ORDER BY publish_at DESC LIMIT 3`).all();
  m.reviews = integrations.publicReviews({ limit: 3 });
  const ctx = baseContext(req, {
    member: m,
    title: `${m.name} — ${m.role_title}`,
    description: m.seo_description || m.intro,
    canonical: '/team/' + m.slug,
  });
  ctx.meta = seo.meta({ req, title: `${m.name} — ${m.role_title}`, description: m.seo_description || m.intro,
    path: '/team/' + m.slug, type: 'profile', modifiedAt: m.updated_at });
  ctx.breadcrumb = [{ label: 'Home', url: '/' }, { label: 'Team', url: '/team' }, { label: m.name, url: '/team/' + m.slug }];
  ctx.jsonld = seo.graph([seo.organisationNode(req), seo.personNode(m, req), seo.breadcrumbNode(ctx.breadcrumb, req)]);
  renderPage(res, 'site/team', ctx);
});

/* ====================================================== PROGRAMS ========= */
router.get('/services', (req, res) => { res.redirect(301, '/services/'); });

router.get('/services/:slug', (req, res) => {
  const program = db.prepare(`SELECT * FROM programs WHERE slug = ? AND status = 'published'`).get(req.params.slug);
  if (!program) return notFound(req, res);
  const p = blocks.programContext(program, { cfg: cfg() });
  const ctx = baseContext(req, {
    program: p,
    title: p.seo_title || p.name,
    description: p.seo_description || p.answer_summary.slice(0, 300),
    canonical: '/services/' + p.slug,
  });
  ctx.meta = seo.meta({ req, title: p.seo_title || p.name, description: p.seo_description || p.answer_summary,
    path: '/services/' + p.slug, type: 'article', modifiedAt: p.updated_at });
  ctx.breadcrumb = [{ label: 'Home', url: '/' }, { label: 'Services', url: '/services' }, { label: p.name, url: '/services/' + p.slug }];
  ctx.jsonld = seo.graph([
    seo.organisationNode(req), seo.courseNode(p, req), seo.faqNode(p.faqs),
    seo.howToNode(`${p.name} — how it works`, p.process_list, p.summary),
    seo.breadcrumbNode(ctx.breadcrumb, req),
    ...seo.reviewNodes(3),
  ]);
  renderPage(res, 'site/program', ctx);
});

/* ====================================================== RESOURCES ======== */
router.get('/resources', (req, res) => {
  const page = req.query.page ? Number(req.query.page) : 1;
  const category = req.query.category ? String(req.query.category) : null;
  const perPage = 9;
  const where = ["p.status = 'published'", 'p.noindex = 0'];
  const params = [];
  if (category) { where.push('c.slug = ?'); params.push(category); }
  const total = db.prepare(`SELECT COUNT(*) AS n FROM posts p LEFT JOIN categories c ON c.id = p.category_id WHERE ${where.join(' AND ')}`).get(...params).n;
  const pg = H.paginate(total, page, perPage);
  const posts = db.prepare(`SELECT p.*, c.name AS category_name, c.slug AS category_slug FROM posts p
      LEFT JOIN categories c ON c.id = p.category_id WHERE ${where.join(' AND ')}
      ORDER BY p.publish_at DESC LIMIT ? OFFSET ?`).all(...params, perPage, pg.offset)
    .map(p => ({ ...p, tags_list: H.parseJson(p.tags, []) }));
  const ctx = baseContext(req, {
    posts, pagination: pg,
    categories: db.prepare(`SELECT c.*, (SELECT COUNT(*) FROM posts p WHERE p.category_id = c.id AND p.status = 'published') AS n
                            FROM categories c ORDER BY c.id`).all(),
    activeCategory: category,
    title: 'Resources, Guides & Policy Updates',
    description: 'Visa checklists, proof-of-funds explainers, living cost breakdowns, IELTS band roadmaps and immigration policy updates — every guide written to answer the question directly, with sources and dates.',
    canonical: '/resources',
    events: db.prepare('SELECT * FROM events WHERE status = ? ORDER BY starts_at').all('published'),
  });
  ctx.meta = seo.meta({ req, title: 'Resources & Guides', path: '/resources', description: ctx.description });
  ctx.breadcrumb = [{ label: 'Home', url: '/' }, { label: 'Resources', url: '/resources' }];
  ctx.jsonld = seo.graph([seo.organisationNode(req), seo.breadcrumbNode(ctx.breadcrumb, req),
    { '@type': 'Blog', name: 'Kishaa International Resources', url: seo.siteBase(req) + '/resources' }]);
  renderPage(res, 'site/resources', ctx);
});

router.get('/resources/category/:slug', (req, res) => { res.redirect(301, '/resources?category=' + encodeURIComponent(req.params.slug)); });

router.get('/resources/:slug', async (req, res) => {
  let post = db.prepare(`SELECT p.*, c.name AS category_name, c.slug AS category_slug, u.name AS author_name
      FROM posts p LEFT JOIN categories c ON c.id = p.category_id LEFT JOIN users u ON u.id = p.author_id
      WHERE p.slug = ? AND p.status = 'published'`).get(req.params.slug);

  if (!post && supabase.isAvailable()) {
    try {
      const sbPost = await supabase.getPostBySlug(req.params.slug);
      if (sbPost && sbPost.status === 'published') {
        post = {
          ...sbPost,
          category_name: sbPost.categories?.name || 'Guides',
          category_slug: sbPost.primary_pillar || 'resources',
          author_name: 'Kishaa International',
        };
      }
    } catch (sbErr) {
      console.warn('[site:resources:slug] supabase fallback note:', sbErr.message);
    }
  }

  if (!post) return notFound(req, res);
  try {
    db.prepare('UPDATE posts SET views = views + 1 WHERE id = ?').run(post.id);
  } catch {}
  post.tags_list = H.parseJson(post.tags, []);
  post.takeaways = H.parseJson(post.key_takeaways, []);
  post.answer_first = post.answer_summary || H.answerSummary(post.body);
  post.related = db.prepare(`SELECT title, slug, answer_summary FROM posts WHERE id != ? AND status = 'published' ORDER BY publish_at DESC LIMIT 3`).all(post.id);
  post.country = post.primary_pillar === 'visa-immigration' ? db.prepare('SELECT * FROM countries WHERE published = 1 ORDER BY RANDOM() LIMIT 1').get() : null;
  const faqs = pageFaqs(5, post.primary_pillar === 'ielts-cambridge' ? 'training' : (post.primary_pillar === 'visa-immigration' ? 'visa' : 'admissions'));
  const ctx = baseContext(req, {
    post, faqs,
    title: post.seo_title || post.title, description: post.seo_description || post.answer_first.slice(0, 300),
    canonical: '/resources/' + post.slug,
  });
  ctx.meta = seo.meta({ req, title: post.seo_title || post.title, description: post.seo_description || post.answer_first,
    path: '/resources/' + post.slug, type: 'article', publishedAt: post.publish_at, modifiedAt: post.updated_at,
    authorName: post.author_name, keywords: post.tags_list.join(', '), section: post.category_name, noindex: !!post.noindex });
  ctx.breadcrumb = [{ label: 'Home', url: '/' }, { label: 'Resources', url: '/resources' }, { label: post.title, url: '/resources/' + post.slug }];
  ctx.jsonld = seo.graph([seo.organisationNode(req), seo.articleNode(post, req), seo.faqNode(faqs), seo.breadcrumbNode(ctx.breadcrumb, req)]);
  renderPage(res, 'site/post', ctx);
});

/* ========================================================== FAQ ========== */
router.get('/faq', (req, res) => {
  const faqs = db.prepare('SELECT * FROM faqs WHERE published = 1 ORDER BY sort_order').all();
  const groups = [...new Set(faqs.map(f => f.category))];
  const ctx = baseContext(req, { faqs, groups, title: 'Frequently Asked Questions',
    description: 'Direct answers on visas, admissions, IELTS training, proof of funds, fees and how we work — including the questions most consultancies avoid.',
    canonical: '/faq' });
  ctx.meta = seo.meta({ req, title: 'Frequently Asked Questions', path: '/faq', description: ctx.description });
  ctx.breadcrumb = [{ label: 'Home', url: '/' }, { label: 'FAQs', url: '/faq' }];
  ctx.jsonld = seo.graph([seo.organisationNode(req), seo.faqNode(faqs), seo.breadcrumbNode(ctx.breadcrumb, req)]);
  renderPage(res, 'site/faq', ctx);
});

/* ===================================================== SEARCH =========== */
router.get('/search', (req, res) => {
  const q = String(req.query.q || '').trim().slice(0, 120);
  let results = [];
  if (q.length >= 2) {
    const fts = q.replace(/[^\w\s]/g, ' ').split(/\s+/).filter(Boolean).map(t => t + '*').join(' ');
    try {
      results = db.prepare(`SELECT entity, entity_id, title, url, snippet(search_index, 3, '<mark>', '</mark>', '…', 20) AS snippet
                            FROM search_index WHERE search_index MATCH ? ORDER BY rank LIMIT 30`).all(fts);
    } catch {
      results = db.prepare(`SELECT entity, entity_id, title, url, '' AS snippet FROM search_index
                            WHERE title LIKE ? OR body LIKE ? LIMIT 30`).all(`%${q}%`, `%${q}%`);
    }
  }
  const ctx = baseContext(req, { q, results, title: q ? `Search: ${q}` : 'Search',
    description: 'Search published guides, destinations, courses and FAQs.', canonical: '/search' });
  ctx.meta = seo.meta({ req, title: q ? `Search results for “${q}”` : 'Search', path: '/search',
    description: ctx.description, noindex: true });
  track(req, 'site_search', { q, results: results.length });
  renderPage(res, 'site/search', ctx);
});

/* ================================================== LEAD CAPTURE ======== */
router.post('/contact', (req, res) => {
  const ip = req.ip || 'unknown';
  const gate = rl('lead:' + H.hashIp(ip), 8, 15 * 60e3);
  if (!gate.allowed) {
    return res.status(429).render('site/message', baseContext(req, {
      title: 'Too many submissions', message: 'You have submitted several enquiries in a short period. Please wait a few minutes, or call us directly on +971 58 682 6099.',
      canonical: '/contact', meta: seo.meta({ req, title: 'Rate limited', path: '/contact', noindex: true }),
    }));
  }
  const b = req.body || {};
  if (b.website) { // honeypot
    track(req, 'lead_blocked_honeypot', {});
    return res.redirect(303, '/thank-you');
  }
  const errors = [];
  const name = String(b.full_name || '').trim().slice(0, 120);
  const prefer = ['whatsapp', 'phone', 'email'].includes(b.contact_preference) ? b.contact_preference : 'whatsapp';
  const phone = H.normalisePhone(b.phone || b.whatsapp, null);
  const email = H.normaliseEmail(b.email);
  if (name.length < 2) errors.push({ field: 'full_name', message: 'Please enter your full name as it appears on your documents.' });
  if (prefer !== 'email' && !phone) errors.push({ field: 'phone', message: 'Enter a reachable phone or WhatsApp number including the country code.' });
  if (prefer === 'email' && !email) errors.push({ field: 'email', message: 'Enter a valid email address, since you selected email as your contact method.' });
  if (email === null && b.email) errors.push({ field: 'email', message: 'That email address does not look valid.' });
  const interest = ['career_counseling', 'career', 'immigration', 'cambridge', 'other'].includes(b.interest) ? b.interest : 'other';
  const message = String(b.message || '').trim().slice(0, 2000);
  const marketing = H.bool(b.marketing_consent);
  const idem = String(b._idem || '').slice(0, 64);

  if (errors.length) {
    track(req, 'lead_validation_failed', { fields: errors.map(e => e.field).join(',') });
    const page = publishedPage('contact');
    const ctx = baseContext(req, {
      page, blocks: blocks.enrich(parseBlocks(page?.blocks || '[]'), { cfg: cfg() }),
      errors, form: b, title: 'Contact', canonical: '/contact',
    });
    ctx.meta = seo.meta({ req, title: 'Contact', path: '/contact', noindex: true });
    ctx.breadcrumb = [{ label: 'Home', url: '/' }, { label: 'Contact', url: '/contact' }];
    return res.status(422).render('site/page', ctx);
  }

  // Idempotency: same token never creates a second lead.
  if (idem) {
    const existing = db.prepare('SELECT id, reference FROM leads WHERE idempotency_key = ?').get(idem);
    if (existing) return res.redirect(303, `/thank-you?ref=${encodeURIComponent(existing.reference)}`);
  }

  const programId = b.program_id ? Number(b.program_id) : null;
  const countryId = b.country_id ? Number(b.country_id) : null;
  const program = programId ? db.prepare('SELECT * FROM programs WHERE id = ?').get(programId) : null;
  const region = [b.source_page, req.get('referer')].filter(Boolean).join(' ').toLowerCase().includes('pakistan') ? 'Pakistan' : 'UAE';
  const ref = H.reference(setting('ops.lead_prefix', 'KI'));
  const score = H.spamScore({ ...b, message });

  const info = db.prepare(`INSERT INTO leads (reference, full_name, phone, whatsapp, email, contact_preference, interest,
      service_context, program_id, country_id, requested_trainer, message, qualification, source_page, source_type, utm,
      stage, consent_notice_version, marketing_consent, ip_hash, user_agent, idempotency_key, spam_score, region)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'new',?,?,?,?,?,?,?)`).run(
    ref, name, phone, prefer === 'whatsapp' ? phone : null, email, prefer, interest,
    program ? program.name : (b.service_context || null), programId, countryId,
    b.requested_trainer || null, message,
    JSON.stringify({ test_type: b.test_type || null, target_band: b.target_band || null, planned_date: b.planned_date || null, delivery: b.delivery_preference || null }),
    String(b.source_page || '/contact').slice(0, 200), b.source_type || 'form',
    JSON.stringify({ utm_source: b.utm_source || null, utm_medium: b.utm_medium || null, utm_campaign: b.utm_campaign || null, ref: b.ref || null }),
    setting('ops.privacy_notice_version', 'v1'), marketing ? 1 : 0, H.hashIp(ip),
    String(req.get('user-agent') || '').slice(0, 250), idem || null, score, region);

  const leadId = info.lastInsertRowid;
  db.prepare(`INSERT INTO lead_activities (lead_id, actor_id, actor_name, type, note, new_stage, created_at)
              VALUES (?, NULL, 'Public form', 'system', ?, 'new', datetime('now'))`)
    .run(leadId, `Enquiry stored from ${b.source_type || 'form'} on ${String(b.source_page || '/contact')}. Consent notice ${setting('ops.privacy_notice_version','v1')}; marketing consent ${marketing ? 'given' : 'not given'}.`);

  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(leadId);
  lead.interest_label = { career_counseling: 'Career counseling', career: 'Career counseling', immigration: 'Immigration / visa', cambridge: 'Cambridge & IELTS', other: 'General enquiry' }[lead.interest];
  lead.country_name = countryId ? db.prepare('SELECT name FROM countries WHERE id = ?').get(countryId)?.name : null;

  // Duplicate detection — flag likely repeat contacts rather than discarding them.
  const dup = db.prepare(`SELECT id, reference FROM leads WHERE id != ? AND ((email IS NOT NULL AND email = ?) OR (phone IS NOT NULL AND phone = ?))
                          ORDER BY id DESC LIMIT 1`).get(lead.id, email, phone);
  if (dup) {
    db.prepare('UPDATE leads SET duplicate_of = ? WHERE id = ?').run(dup.id, lead.id);
    db.prepare(`INSERT INTO lead_activities (lead_id, actor_id, actor_name, type, note, created_at)
                VALUES (?, NULL, 'System', 'system', ?, datetime('now'))`).run(lead.id,
      `Possible repeat contact — matches ${dup.reference}. Reviewed by staff, not discarded.`);
  }

  const queued = queueLeadNotifications(lead, { type: dup ? 'repeat_contact' : 'new_lead' });
  integrations.notifyHighIntent(lead).catch(() => {});
  track(req, 'lead_submitted', { interest: lead.interest, source: lead.source_type, spam_score: score });
  audit(null, 'lead.created', 'leads', lead.id, { reference: ref, source: lead.source_type }, ip);

  res.redirect(303, `/thank-you?ref=${encodeURIComponent(ref)}`);
});

router.get('/thank-you', (req, res) => {
  const ref = String(req.query.ref || '').slice(0, 40);
  const lead = ref ? db.prepare('SELECT reference, full_name, contact_preference, interest, created_at FROM leads WHERE reference = ?').get(ref) : null;
  const page = publishedPage('thank-you');
  const ctx = baseContext(req, {
    page, ref, lead,
    title: 'Thank you — your enquiry has been received',
    description: 'Your enquiry has been received by Kishaa International.',
    canonical: '/thank-you',
  });
  ctx.meta = seo.meta({ req, title: 'Thank you', path: '/thank-you', description: 'Enquiry confirmation.', noindex: true });
  ctx.breadcrumb = [{ label: 'Home', url: '/' }, { label: 'Thank you', url: '/thank-you' }];
  renderPage(res, 'site/thankyou', ctx);
});

router.get('/lead/:ref', (req, res) => {
  const lead = db.prepare('SELECT reference, created_at, stage FROM leads WHERE reference = ?').get(String(req.params.ref).slice(0, 40));
  if (!lead) return notFound(req, res);
  const ctx = baseContext(req, { lead, title: 'Enquiry status', description: 'Track your enquiry reference.', canonical: '/lead/' + lead.reference });
  ctx.meta = seo.meta({ req, title: 'Enquiry status', path: '/lead/' + lead.reference, noindex: true });
  renderPage(res, 'site/lead-status', ctx);
});

/* ==================================================== HUMAN SITEMAP ==== */
router.get('/sitemap', (req, res) => {
  const ctx = baseContext(req, {
    title: 'Sitemap — every published page',
    description: 'A complete index of published pages, destination guides, services, courses, guides and team profiles.',
    canonical: '/sitemap',
    programs: db.prepare("SELECT name, slug FROM programs WHERE status='published' ORDER BY sort_order").all(),
    destinations: db.prepare('SELECT name, slug, region FROM countries WHERE published=1 ORDER BY sort_order').all(),
    posts: db.prepare("SELECT title, slug FROM posts WHERE status='published' ORDER BY publish_at DESC").all(),
    team: db.prepare('SELECT name, slug, role_title FROM team WHERE is_public=1 ORDER BY sort_order').all(),
  });
  ctx.meta = seo.meta({ req, title: 'Sitemap', path: '/sitemap', description: ctx.description });
  ctx.breadcrumb = [{ label: 'Home', url: '/' }, { label: 'Sitemap', url: '/sitemap' }];
  ctx.jsonld = seo.graph([seo.organisationNode(req), seo.breadcrumbNode(ctx.breadcrumb, req)]);
  renderPage(res, 'site/sitemap', ctx);
});

/* ============================================ MACHINE-READABLE SURFACES */
router.get('/sitemap.xml', (req, res) => { res.type('application/xml').send(seo.sitemap(req)); });
router.get('/robots.txt', (req, res) => { res.type('text/plain').send(seo.robots(req)); });
router.get('/llms.txt', (req, res) => { res.type('text/plain').send(seo.llmsTxt(req)); });
router.get('/feed.xml', (req, res) => { res.type('application/rss+xml').send(seo.rssFeed(req, 'rss')); });
router.get('/feed/atom.xml', (req, res) => { res.type('application/atom+xml').send(seo.rssFeed(req, 'atom')); });
router.get('/feed.json', (req, res) => { res.type('application/json').send(seo.rssFeed(req, 'json')); });

/** Markdown mirror of any public page — for LLM ingestion (AIO). */
router.get('/:path*/markdown', (req, res, next) => {
  const target = '/' + (req.params.path ? [].concat(req.params.path).join('/') : '');
  const country = target.startsWith('/destinations/') ? planner.countryBySlug(target.split('/').pop()) : null;
  if (country) {
    const c = blocks.countryContext(country);
    return res.type('text/markdown').send(seo.markdownMirror({
      title: `${c.name} — study, work and visit guide`,
      summary: c.answer_first, url: seo.siteBase(req) + '/destinations/' + c.slug, updated: c.updated_at,
      sections: [
        { heading: 'Costs and standards', body: `Processing time: ${c.processing_time}. Currency: ${c.currency}. Indicative monthly living cost: ${c.living_currency} ${c.living_total}.` },
        { heading: 'Statutory proof of funds', body: c.funds.map(f => `${f.route_name}: ${f.total_required ? f.total_currency + ' ' + f.total_required : 'route-specific'}${f.holding_period ? '; held ' + f.holding_period : ''} (source: ${f.source_name}, effective ${f.effective_date}, status ${f.review_status})`).join('\n') || 'No published rule.' },
        { heading: 'City living costs', body: c.costs.map(x => `${x.city} (${x.scenario}): ${x.currency} ${x.total} per month`).join('\n') },
        { heading: 'Requirements', body: c.requirement_list.join('\n') },
      ],
      faqs: c.faqs,
      sources: c.funds.map(f => ({ label: f.source_name, url: f.source_url, date: f.effective_date })),
    }));
  }
  const slug = target === '/' ? 'home' : target.replace(/^\//, '');
  const page = publishedPage(slug.split('/')[0]);
  if (!page) return next();
  const bs = parseBlocks(page.blocks);
  res.type('text/markdown').send(seo.markdownMirror({
    title: page.title, summary: page.seo_description, url: seo.siteBase(req) + '/' + page.slug, updated: page.updated_at,
    sections: bs.filter(b => ['richtext', 'answerFirst'].includes(b.type)).map(b => ({
      heading: b.heading || b.question || 'Section', body: b.html || b.answer || '',
    })),
    faqs: pageFaqs(10),
  }));
});

/* ================================================ ANALYTICS (no PII) ==== */
router.post('/api/track', express.json({ limit: '8kb' }), (req, res) => {
  const gate = rl('track:' + H.hashIp(req.ip || ''), 120, 60e3);
  if (!gate.allowed) return res.status(429).json({ ok: false });
  const { name, path, props } = req.body || {};
  if (!name || String(name).length > 60) return res.status(400).json({ ok: false, error: 'invalid' });
  // Hard rule enforced by the brief: analytics events never carry personal data.
  const clean = {};
  for (const [k, v] of Object.entries(props || {})) {
    if (/name|email|phone|whatsapp|message|address|passport|dob/i.test(k)) continue;
    clean[k] = typeof v === 'string' ? v.slice(0, 80) : v;
  }
  db.prepare(`INSERT INTO analytics_events (name, path, props, session_ref) VALUES (?,?,?,?)`)
    .run(String(name).slice(0, 60), String(path || '').slice(0, 200), JSON.stringify(clean), String(req.body.session_ref || '').slice(0, 40) || null);
  res.json({ ok: true });
});

/* ============================================ PUBLIC API (cached) ======= */
router.get('/api/reviews', (req, res) => {
  res.json({ ok: true, generated_at: new Date().toISOString(), source: 'cache', attribution_required: true,
    aggregates: integrations.reviewAggregates(),
    reviews: integrations.publicReviews({ platform: req.query.platform, limit: Math.min(50, Number(req.query.limit || 12)) }) });
});
router.get('/api/feeds', (req, res) => {
  res.json({ ok: true, generated_at: new Date().toISOString(), source: 'cache',
    items: integrations.publicFeeds({ platform: req.query.platform, limit: Math.min(50, Number(req.query.limit || 12)) }) });
});
router.get('/api/planner/countries', (req, res) => {
  res.json({ ok: true, countries: planner.countries().map(c => ({
    name: c.name, slug: c.slug, region: c.region, bloc: c.bloc,
    cities: planner.cities(c.id), currency: c.currency, living_total: c.living_total,
    processing_time: c.processing_time, rule_count: c.rule_count })) });
});
const { getCompiledCountriesList, getCountryBySlug } = require('../lib/countries');

router.get('/api/content/countries', async (req, res) => {
  try {
    const countries = await getCompiledCountriesList();
    res.json({ ok: true, countries });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
router.get('/api/content/countries/:slug', async (req, res) => {
  try {
    const country = await getCountryBySlug(req.params.slug);
    if (!country) return res.status(404).json({ ok: false, error: 'not_found' });
    res.json({ ok: true, country });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
router.all('/api/content/countries/live-costs', express.json(), async (req, res) => {
  try {
    const country = String(req.body?.country || req.query?.country || '').trim();
    const city = String(req.body?.city || req.query?.city || '').trim();
    if (!country) return res.status(400).json({ ok: false, error: 'country_required' });
    const data = await qwenSearch.getLiveDestinationCosts(country, city);
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
router.post('/api/planner/plan', express.json({ limit: '32kb' }), (req, res) => {
  const gate = rl('plan:' + H.hashIp(req.ip || ''), 60, 60e3);
  if (!gate.allowed) return res.status(429).json({ ok: false, error: 'rate_limited' });
  const result = planner.plan(readPlannerInput(req.body || {}));
  track(req, 'planner_estimate_generated', { country: result.inputs?.countrySlug, purpose: result.inputs?.purpose, via: 'api' });
  res.json({ ok: result.ok !== false, result });
});
router.get('/api/search', (req, res) => {
  const q = String(req.query.q || '').trim().slice(0, 80);
  if (q.length < 2) return res.json({ ok: true, results: [] });
  const fts = q.replace(/[^\w\s]/g, ' ').split(/\s+/).filter(Boolean).map(t => t + '*').join(' ');
  let results = [];
  try { results = db.prepare(`SELECT entity, title, url FROM search_index WHERE search_index MATCH ? ORDER BY rank LIMIT 12`).all(fts); } catch {}
  res.json({ ok: true, results });
});

/* ==================================================== UTILITIES ========= */
function parseBlocks(json) { return H.parseJson(json, []); }

function readPlannerInput(b) {
  return {
    countrySlug: String(b.country || b.countrySlug || '').slice(0, 60) || null,
    city: b.city ? String(b.city).slice(0, 60) : null,
    purpose: ['study', 'visit', 'work', 'business'].includes(b.purpose) ? b.purpose : 'study',
    months: Math.max(1, Math.min(72, Number(b.months || 12))),
    scenario: ['budget', 'standard', 'comfortable'].includes(b.scenario) ? b.scenario : 'standard',
    dependents: Math.max(0, Math.min(6, Number(b.dependents || 0))),
    originCode: String(b.origin || 'ISB').slice(0, 4).toUpperCase(),
    passengers: Math.max(1, Math.min(6, Number(b.passengers || 1))),
    cabin: ['economy', 'premium', 'business'].includes(b.cabin) ? b.cabin : 'economy',
    baggageKg: Math.max(0, Math.min(60, Number(b.baggage || 30))),
    month: Math.max(1, Math.min(12, Number(b.month || new Date().getMonth() + 1))),
    unpaidTuition: Math.max(0, Number(b.unpaid_tuition || 0)),
  };
}

function track(req, name, props) {
  try {
    db.prepare('INSERT INTO analytics_events (name, path, props) VALUES (?,?,?)')
      .run(name, req.path, JSON.stringify(props || {}));
  } catch {}
}

function notFound(req, res) {
  const redirect = seo.redirectHit(req.path);
  if (redirect) return res.redirect(redirect.type || 301, redirect.to_path);
  const suggestions = db.prepare(`SELECT name, slug FROM programs WHERE status = 'published' ORDER BY sort_order LIMIT 4`).all();
  const dst = db.prepare('SELECT name, slug FROM countries WHERE published = 1 ORDER BY sort_order LIMIT 6').all();
  const ctx = baseContext(req, {
    title: 'Page not found', description: 'That page does not exist. Try the destination guides, courses or the cost planner.',
    canonical: req.path, suggestions, destinations: dst,
  });
  ctx.meta = seo.meta({ req, title: 'Page not found', path: req.path, noindex: true });
  res.status(404).render('site/404', ctx);
}

/** Redirect middleware — must run before the catch-all page route. */
router.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  const r = seo.redirectHit(req.path);
  if (r) return res.redirect(r.type || 301, r.to_path);
  next();
});

/* ============================================ GENERIC CMS PAGE ROUTE ==== */
router.get('/:slug', (req, res, next) => {
  const reserved = ['services', 'destinations', 'resources', 'team', 'faq', 'search', 'cost-planner', 'reviews',
    'thank-you', 'api', 'admin', 'uploads', 'sitemap', 'robots', 'llms', 'feed', 'planner', 'lead', 'assets'];
  if (reserved.includes(req.params.slug)) return next();
  const page = publishedPage(req.params.slug);
  if (!page || page.template === 'home') return next();
  renderBlocksPage(req, res, page);
});

router.use(notFound);

module.exports = router;

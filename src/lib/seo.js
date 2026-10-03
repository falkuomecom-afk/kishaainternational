'use strict';
/**
 * ============================================================================
 * SEO · AEO · GEO · AIO ENGINE
 * ============================================================================
 * SEO  (Search Engine Optimisation)      → metadata, canonicals, sitemaps, redirects, schema
 * AEO  (Answer Engine Optimisation)      → answer-first blocks, FAQPage schema, speakable, Q&A
 * GEO  (Generative Engine Optimisation)  → entity/authority signals, citation-ready facts,
 *                                          source-dated data, llms.txt, AI crawler policy
 * AIO  (AI Optimisation / AI Overviews)  → topic clusters, key-takeaway lists, structured
 *                                          comparison tables, markdown mirrors, RSS/Atom/JSON feeds
 * ============================================================================
 */
const { db, setting } = require('./db');
const { esc, stripTags, slugify } = require('./helpers');

function siteBase(req) {
  const configured = setting('seo.base_url');
  if (configured) return String(configured).replace(/\/$/, '');
  if (req) return `${req.protocol}://${req.get('host')}`;
  return 'http://localhost:3000';
}

/* --------------------------------------------------------------- meta builder */
function meta({ req, title, description, path = '/', type = 'website', image, noindex, publishedAt, modifiedAt, authorName, keywords, section }) {
  const base = siteBase(req);
  const suffix = setting('seo.title_suffix', 'Kishaa International');
  const fullTitle = title ? `${title} | ${suffix}` : setting('seo.default_title', 'Kishaa International');
  const desc = (description || setting('seo.default_description', '')).slice(0, 320);
  const canonical = setting('seo.canonical_base')
    ? String(setting('seo.canonical_base')).replace(/\/$/, '') + path
    : base + path;
  const og = image || setting('seo.og_image') || '/img/og-default.svg';
  return {
    title: fullTitle, description: desc, canonical, type, image: og.startsWith('http') ? og : base + og,
    noindex: !!noindex, publishedAt, modifiedAt, authorName, keywords, section, base,
    robots: noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  };
}

/* ------------------------------------------------------------- JSON-LD graphs */
function organisationNode(req) {
  const base = siteBase(req);
  const cfg = {
    name: setting('brand.name', 'Kishaa International'),
    email: setting('brand.email', 'kishaainternational@gmail.com'),
    uae: setting('brand.phone_uae', '+971 58 682 6099'),
    pk: setting('brand.phone_pk', '+92 312 552 6099'),
    addressUae: setting('brand.address_uae', 'Dubai, United Arab Emirates'),
    addressPk: setting('brand.address_pk', 'Rawalpindi, Punjab, Pakistan'),
  };
  return {
    '@type': ['EducationalOrganization', 'ProfessionalService'],
    '@id': base + '/#organisation',
    name: cfg.name,
    legalName: setting('brand.legal_name', cfg.name),
    slogan: setting('brand.slogan', 'Gateway to Global Careers'),
    alternateName: setting('brand.slogan_alt', 'One Company, Global Solutions'),
    url: base + '/',
    logo: { '@type': 'ImageObject', url: base + '/img/logo.svg', width: 512, height: 512 },
    image: base + (setting('seo.og_image') || '/img/og-default.svg'),
    email: cfg.email,
    description: setting('seo.default_description', ''),
    telephone: cfg.uae,
    areaServed: ['AE', 'PK', 'GB', 'IT', 'FI', 'GE', 'CA', 'US', 'AU', 'DE', 'FR', 'PT', 'TR', 'RS', 'RO', 'KZ', 'TJ', 'KG', 'RU'],
    knowsLanguage: ['en', 'ur'],
    address: [
      { '@type': 'PostalAddress', addressLocality: 'Dubai', addressCountry: 'AE', streetAddress: cfg.addressUae },
      { '@type': 'PostalAddress', addressLocality: 'Rawalpindi', addressRegion: 'Punjab', addressCountry: 'PK', streetAddress: cfg.addressPk },
    ],
    contactPoint: [
      { '@type': 'ContactPoint', telephone: cfg.uae, contactType: 'customer service', areaServed: 'AE', availableLanguage: ['English', 'Urdu'] },
      { '@type': 'ContactPoint', telephone: cfg.pk, contactType: 'customer service', areaServed: 'PK', availableLanguage: ['English', 'Urdu'] },
    ],
    sameAs: [setting('brand.facebook_page_url'), setting('brand.instagram'), setting('brand.youtube'),
             setting('brand.trustpilot_url'), setting('brand.linkedin')].filter(Boolean),
    aggregateRating: aggregateRatingNode(),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Career Counseling, Immigration Consultancy & Cambridge Training',
      itemListElement: db.prepare(`SELECT name, slug, summary, fee_from, currency FROM programs
                                  WHERE status = 'published' AND featured = 1 ORDER BY sort_order LIMIT 12`).all()
        .map(p => ({
          '@type': 'Offer',
          itemOffered: { '@type': 'Service', name: p.name, url: base + '/services/' + p.slug, description: stripTags(p.summary || '').slice(0, 200) },
          ...(p.fee_from ? { priceSpecification: { '@type': 'PriceSpecification', price: p.fee_from, priceCurrency: p.currency || 'GBP', valueAddedTaxIncluded: false } } : {}),
        })),
    },
  };
}

function aggregateRatingNode() {
  const rows = db.prepare(`SELECT platform, score, review_count, profile_url, retrieved_at
                           FROM review_aggregates WHERE review_count > 0 ORDER BY review_count DESC`).all();
  if (!rows.length) return undefined;
  const total = rows.reduce((s, r) => s + (r.review_count || 0), 0);
  const weighted = rows.reduce((s, r) => s + (r.score || 0) * (r.review_count || 0), 0);
  if (!total) return undefined;
  return {
    '@type': 'AggregateRating',
    ratingValue: Math.round((weighted / total) * 10) / 10,
    reviewCount: total,
    bestRating: 5,
    worstRating: 1,
  };
}

function personNode(member, req) {
  const base = siteBase(req);
  return {
    '@type': 'Person',
    '@id': `${base}/team/${member.slug}/#person`,
    name: member.name,
    jobTitle: member.role_title,
    description: stripTags(member.intro || member.bio || '').slice(0, 400),
    hasCredential: JSON.parse(member.credentials || '[]').map(c => ({ '@type': 'EducationalOccupationalCredential', name: c })),
    knowsAbout: JSON.parse(member.expertise || '[]'),
    knowsLanguage: JSON.parse(member.languages || '["English","Urdu"]'),
    worksFor: { '@id': base + '/#organisation' },
    url: `${base}/team/${member.slug}`,
    image: member.portrait_id ? `${base}/uploads/${member.portrait_filename || ''}` : undefined,
    telephone: (JSON.parse(member.phones || '[]')[0]) || setting('brand.phone_uae'),
  };
}

function courseNode(program, req) {
  const base = siteBase(req);
  const node = {
    '@type': 'Course',
    '@id': `${base}/services/${program.slug}/#course`,
    name: program.name,
    description: stripTags(program.summary || program.answer_summary || '').slice(0, 500),
    url: `${base}/services/${program.slug}`,
    provider: { '@id': base + '/#organisation' },
    educationalCredentialAwarded: program.pillar === 'cambridge' ? 'Cambridge / IELTS preparation' : undefined,
    teaches: JSON.parse(program.highlights || '[]').slice(0, 8),
    timeRequired: program.duration ? `P${program.duration.replace(/[^0-9]/g, '') || 1}W` : undefined,
    availableLanguage: ['English'],
  };
  if (program.fee_from) {
    node.offers = [{
      '@type': 'Offer', category: 'Paid', price: program.fee_from, priceCurrency: program.currency || 'GBP',
      url: `${base}/services/${program.slug}`,
      availability: program.availability === 'Open' ? 'https://schema.org/InStock' : 'https://schema.org/LimitedAvailability',
    }];
  }
  return node;
}

function faqNode(faqs) {
  if (!faqs || !faqs.length) return null;
  return {
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: stripTags(f.answer).slice(0, 1200) },
    })),
  };
}

function breadcrumbNode(trail, req) {
  const base = siteBase(req);
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((t, i) => ({
      '@type': 'ListItem', position: i + 1, name: t.label,
      item: t.url ? base + t.url : undefined,
    })),
  };
}

function reviewNodes(limit = 6) {
  const rows = db.prepare(`SELECT author, rating, text, permalink, published_at, platform
                           FROM review_cache WHERE display_state = 'shown' AND rating >= 4
                           ORDER BY published_at DESC LIMIT ?`).all(limit);
  return rows.map(r => ({
    '@type': 'Review',
    author: { '@type': 'Person', name: r.author || 'Verified client' },
    reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5, worstRating: 1 },
    reviewBody: stripTags(r.text || '').slice(0, 900),
    datePublished: r.published_at,
    publisher: { '@type': 'Organization', name: r.platform === 'google' ? 'Google Business Profile' : r.platform === 'facebook' ? 'Facebook' : 'Trustpilot' },
    url: r.permalink,
  }));
}

function articleNode(post, req) {
  const base = siteBase(req);
  return {
    '@type': ['Article', 'BlogPosting'],
    '@id': `${base}/resources/${post.slug}/#article`,
    headline: post.title,
    description: stripTags(post.excerpt || post.answer_summary || '').slice(0, 300),
    datePublished: post.publish_at || post.created_at,
    dateModified: post.updated_at,
    author: { '@type': 'Organization', name: setting('brand.name', 'Kishaa International') },
    publisher: { '@id': base + '/#organisation' },
    mainEntityOfPage: `${base}/resources/${post.slug}`,
    articleSection: post.category_name || post.primary_pillar || 'Resources',
    keywords: JSON.parse(post.tags || '[]').join(', '),
    about: post.country_name ? { '@type': 'Country', name: post.country_name } : undefined,
    wordCount: stripTags(post.body || '').split(/\s+/).length,
    speakable: { '@type': 'SpeakableSpecification', cssSelector: ['.answer-first', '.key-takeaways'] },
  };
}

function howToNode(name, steps, description) {
  if (!steps?.length) return null;
  return {
    '@type': 'HowTo', name, description,
    step: steps.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, name: s.title || s.step || `Step ${i + 1}`, text: stripTags(s.detail || '') })),
  };
}

function datasetNode(req) {
  return {
    '@type': 'Dataset',
    name: 'Kishaa International — Country visa, living-cost and proof-of-funds dataset',
    description: 'Versioned statutory maintenance-funds rules, city living-cost profiles and visa processing times maintained by Kishaa International with source URLs and effective dates.',
    url: siteBase(req) + '/planner/data',
    creator: { '@id': siteBase(req) + '/#organisation' },
    license: siteBase(req) + '/terms',
    temporalCoverage: '2025/2027',
    isAccessibleForFree: true,
    variableMeasured: ['Statutory monthly maintenance rate', 'Mandated holding period', 'Monthly living cost by city tier', 'Visa processing time'],
  };
}

function graph(nodes) {
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': nodes.filter(Boolean) }, null, 0);
}

/* --------------------------------------------------------------------- files */
function sitemap(req) {
  const base = siteBase(req);
  const urls = [];
  const add = (loc, lastmod, changefreq, priority) => urls.push({ loc: base + loc, lastmod, changefreq, priority });

  add('/', null, 'weekly', '1.0');
  for (const p of db.prepare("SELECT slug, updated_at FROM pages WHERE status='published' AND noindex=0").all())
    add('/' + p.slug, p.updated_at, 'monthly', '0.9');
  for (const p of db.prepare("SELECT slug, updated_at FROM programs WHERE status='published'").all())
    add('/services/' + p.slug, p.updated_at, 'monthly', '0.9');
  for (const c of db.prepare("SELECT slug, updated_at FROM countries WHERE published=1").all())
    add('/destinations/' + c.slug, c.updated_at, 'weekly', '0.8');
  for (const m of db.prepare("SELECT slug, updated_at FROM team WHERE is_public=1").all())
    add('/team/' + m.slug, m.updated_at, 'monthly', '0.7');
  for (const p of db.prepare("SELECT slug, publish_at, updated_at FROM posts WHERE status='published' AND noindex=0").all())
    add('/resources/' + p.slug, p.updated_at || p.publish_at, 'monthly', '0.6');
  for (const c of db.prepare("SELECT slug, (SELECT MAX(updated_at) FROM posts WHERE category_id = categories.id) AS u FROM categories").all())
    add('/resources/category/' + c.slug, c.u, 'weekly', '0.5');
  for (const c of db.prepare('SELECT iso2, summary FROM countries WHERE published=1').all()) {
    const r = db.prepare("SELECT effective_date FROM funds_rules WHERE (country_id=(SELECT id FROM countries WHERE iso2=?)) AND published=1 ORDER BY effective_date DESC LIMIT 1").get(c.iso2);
    if (r) add('/bank-statements/' + (c.iso2 || '').toLowerCase(), r.effective_date, 'monthly', '0.7');
  }
  add('/cost-planner', null, 'weekly', '0.9');
  add('/destinations', null, 'weekly', '0.8');
  add('/career-counseling', null, 'monthly', '0.9');
  add('/immigration-consultancy', null, 'monthly', '0.9');
  add('/cambridge-courses', null, 'monthly', '0.9');
  add('/reviews', null, 'daily', '0.8');
  add('/about-us', null, 'monthly', '0.6');
  add('/contact', null, 'monthly', '0.7');
  add('/faq', null, 'monthly', '0.6');
  add('/sitemap', null, 'weekly', '0.3');

  const body = urls.map(u =>
    `  <url>\n    <loc>${esc(u.loc)}</loc>\n` +
    (u.lastmod ? `    <lastmod>${esc(String(u.lastmod).slice(0, 10))}</lastmod>\n` : '') +
    `    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemap.org/schemas/sitemap/0.9"\n        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${body}\n</urlset>`
    .replace('www.sitemap.org', 'www.sitemaps.org');
}

function robots(req) {
  const base = siteBase(req);
  const aiAgents = ['GPTBot','OAI-SearchBot','ChatGPT-User','ClaudeBot','Claude-Web','anthropic-ai','PerplexityBot',
    'Google-Extended','Applebot-Extended','CCBot','Bytespider','Amazonbot','Bingbot','DuckDuckBot','YouBot','cohere-ai','meta-externalagent'];
  return [
    '# Kishaa International — robots.txt',
    '# Private operational areas are never crawlable or indexable.',
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /admin/',
    'Disallow: /api/leads',
    'Disallow: /api/admin',
    'Disallow: /uploads/private',
    'Disallow: /preview',
    'Disallow: /thank-you',
    'Disallow: /*?utm_',
    'Disallow: /*?ref=',
    '',
    '# Answer / generative engines are explicitly welcomed on public, sourced content.',
    ...aiAgents.flatMap(a => [`User-agent: ${a}`, 'Allow: /', 'Disallow: /admin', 'Disallow: /api/leads', 'Disallow: /uploads/private', '']),
    'Sitemap: ' + base + '/sitemap.xml',
    'Host: ' + base.replace(/^https?:\/\//, ''),
  ].join('\n');
}

/** llms.txt — curated machine-readable map of authoritative content (GEO/AIO). */
function llmsTxt(req) {
  const base = siteBase(req);
  const programs = db.prepare("SELECT name, slug, summary, answer_summary FROM programs WHERE status='published' ORDER BY sort_order").all();
  const countries = db.prepare('SELECT name, slug, summary, answer_summary FROM countries WHERE published=1 ORDER BY sort_order').all();
  const posts = db.prepare("SELECT title, slug, answer_summary, target_query FROM posts WHERE status='published' ORDER BY publish_at DESC LIMIT 30").all();
  const funds = db.prepare(`SELECT c.name AS country, f.route_name, f.total_required, f.total_currency, f.holding_period,
                                   f.effective_date, f.source_url, f.review_status
                            FROM funds_rules f JOIN countries c ON c.id = f.country_id
                            WHERE f.published = 1 ORDER BY c.name`).all();
  const L = [];
  L.push(`# ${setting('brand.name', 'Kishaa International')}`);
  L.push('');
  L.push(`> ${setting('seo.default_description', '')}`);
  L.push('');
  L.push('Consultancy operating from Dubai, UAE (HQ) and Pakistan. Core triad: Career Counseling, Immigration Consultancy, Cambridge Courses Training.');
  L.push(`Contact: ${setting('brand.phone_uae','')} (UAE) · ${setting('brand.phone_pk','')} (PK) · ${setting('brand.email','')}`);
  L.push('');
  L.push('## How to cite this site');
  L.push('- Living cost figures are indicative maintained averages with observation dates; label them as estimates.');
  L.push('- Statutory proof-of-funds figures are official embassy rules — cite the country authority listed beside each rule.');
  L.push('- Flight fares are supplier quotes valid for the shown booking window only.');
  L.push(`- Canonical base: ${base}`);
  L.push('');
  L.push('## Services & programs');
  for (const p of programs) L.push(`- [${p.name}](${base}/services/${p.slug}): ${(p.answer_summary || p.summary || '').replace(/\s+/g, ' ').slice(0, 220)}`);
  L.push('');
  L.push('## Destinations');
  for (const c of countries) L.push(`- [${c.name}](${base}/destinations/${c.slug}): ${(c.answer_summary || c.summary || '').replace(/\s+/g, ' ').slice(0, 200)}`);
  L.push('');
  L.push('## Official proof-of-funds dataset (versioned, sourced)');
  for (const f of funds) L.push(`- ${f.country} · ${f.route_name}: ${f.total_required ? f.total_currency + ' ' + f.total_required : 'see page'}; holding: ${f.holding_period || 'n/a'}; effective ${f.effective_date || 'n/a'}; status ${f.review_status}; source ${f.source_url || 'internal'}`);
  L.push('');
  L.push('## Optional: guides and answer summaries');
  for (const p of posts) L.push(`- [${p.title}](${base}/resources/${p.slug})${p.target_query ? ` — targets: ${p.target_query}` : ''}`);
  L.push('');
  L.push('## Machine-readable endpoints');
  L.push(`- Full sitemap: ${base}/sitemap.xml`);
  L.push(`- RSS: ${base}/feed.xml · Atom: ${base}/feed/atom.xml · JSON Feed: ${base}/feed.json`);
  L.push(`- Planner dataset JSON: ${base}/planner/data`);
  L.push(`- Reviews feed (cached, attributed): ${base}/api/reviews`);
  return L.join('\n');
}

function rssFeed(req, format = 'rss') {
  const base = siteBase(req);
  const posts = db.prepare(`SELECT title, slug, excerpt, answer_summary, body, publish_at, updated_at, author_id, category_name
                            FROM (SELECT p.*, c.name AS category_name FROM posts p LEFT JOIN categories c ON c.id = p.category_id) x
                            WHERE status='published' ORDER BY publish_at DESC LIMIT 40`).all();
  const site = setting('brand.name', 'Kishaa International');
  const desc = setting('seo.default_description', '');
  const items = posts.map(p => ({
    title: p.title, link: `${base}/resources/${p.slug}`,
    date: new Date((p.publish_at || p.updated_at || '').replace(' ', 'T') + 'Z').toUTCString(),
    summary: p.answer_summary || p.excerpt || stripTags(p.body || '').slice(0, 400),
    category: p.category_name || 'Resources',
  }));
  if (format === 'json') {
    return JSON.stringify({
      version: 'https://jsonfeed.org/version/1.1', title: site, home_page_url: base + '/',
      feed_url: base + '/feed.json', description: desc,
      authors: [{ name: site, url: base }],
      items: items.map(i => ({ id: i.link, url: i.link, title: i.title, date_published: new Date(i.date).toISOString(),
        summary: i.summary, tags: [i.category] })),
    }, null, 2);
  }
  if (format === 'atom') {
    return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${esc(site)}</title>
  <link href="${base}/feed/atom.xml" rel="self"/>
  <link href="${base}/"/>
  <updated>${new Date().toISOString()}</updated>
  <id>${base}/</id>
  <subtitle>${esc(desc)}</subtitle>
${items.map(i => `  <entry>
    <title>${esc(i.title)}</title>
    <link href="${esc(i.link)}"/>
    <id>${esc(i.link)}</id>
    <updated>${new Date(i.date).toISOString()}</updated>
    <category term="${esc(i.category)}"/>
    <summary>${esc(i.summary)}</summary>
  </entry>`).join('\n')}
</feed>`;
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${esc(site)}</title>
  <link>${base}/</link>
  <description>${esc(desc)}</description>
  <language>en</language>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
  <atom:link href="${base}/feed.xml" rel="self" type="application/rss+xml"/>
${items.map(i => `  <item>
    <title>${esc(i.title)}</title>
    <link>${esc(i.link)}</link>
    <guid>${esc(i.link)}</guid>
    <pubDate>${i.date}</pubDate>
    <category>${esc(i.category)}</category>
    <description>${esc(i.summary)}</description>
  </item>`).join('\n')}
</channel>
</rss>`;
}

/** Markdown mirror for LLM ingestion of a single page (AIO). */
function markdownMirror({ title, summary, sections = [], faqs = [], sources = [], url, updated }) {
  const L = [`# ${title}`, '', summary ? `> ${summary}` : '', ''];
  if (updated) L.push(`_Last updated: ${String(updated).slice(0, 10)}_`, '');
  for (const s of sections) {
    L.push(`## ${s.heading}`);
    L.push(stripTags(s.body || ''));
    L.push('');
  }
  if (faqs.length) {
    L.push('## Frequently asked questions');
    for (const f of faqs) { L.push(`### ${f.question}`, stripTags(f.answer), ''); }
  }
  if (sources.length) {
    L.push('## Sources');
    for (const s of sources) L.push(`- ${s.label || s.name}${s.url ? ` — ${s.url}` : ''}${s.date ? ` (observed ${s.date})` : ''}`);
    L.push('');
  }
  if (url) L.push(`Canonical: ${url}`);
  return L.join('\n');
}

function redirectHit(fromPath) {
  const row = db.prepare('SELECT * FROM redirects WHERE from_path = ? AND active = 1').get(fromPath);
  if (row) {
    db.prepare('UPDATE redirects SET hits = hits + 1 WHERE id = ?').run(row.id);
    return row;
  }
  return null;
}

module.exports = { siteBase, meta, organisationNode, personNode, courseNode, faqNode, breadcrumbNode,
  reviewNodes, articleNode, howToNode, datasetNode, graph, sitemap, robots, llmsTxt, rssFeed,
  markdownMirror, redirectHit, aggregateRatingNode };

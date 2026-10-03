'use strict';
/** Resolve a page's block list into render-ready data (page builder runtime). */
const { db } = require('./db');
const integrations = require('./integrations');
const { answerSummary, parseJson, stripTags } = require('./helpers');

const BLOCK_TYPES = [
  { type: 'hero', label: 'Hero', icon: 'star', help: 'Opening headline, supporting copy, buttons and stat strip.' },
  { type: 'answerFirst', label: 'Answer-first Q&A', icon: 'quote', help: 'A direct question and a 40–60 word answer. Primary AEO building block.' },
  { type: 'pillars', label: 'Three pillars / cards', icon: 'grid', help: 'Icon cards with heading, text, link and CTA.' },
  { type: 'programCards', label: 'Program cards', icon: 'cards', help: 'Pull published programs, optionally filtered by pillar.' },
  { type: 'destinations', label: 'Destination grid', icon: 'globe', help: 'Country cards with living cost and processing time.' },
  { type: 'plannerTeaser', label: 'Cost planner teaser', icon: 'calc', help: 'Interactive mini planner pulling live country data.' },
  { type: 'trainer', label: 'Trainer profile', icon: 'user', help: 'Feature a team member by slug.' },
  { type: 'process', label: 'Process steps', icon: 'steps', help: 'Numbered stages with titles and detail.' },
  { type: 'richtext', label: 'Rich text', icon: 'text', help: 'Sanitised HTML body content.' },
  { type: 'imageText', label: 'Image + text', icon: 'image', help: 'Two-column media and copy with bullets.' },
  { type: 'stats', label: 'Stat strip', icon: 'chart', help: 'Four headline figures.' },
  { type: 'reviews', label: 'Verified reviews', icon: 'star', help: 'Cached, attributed review cards.' },
  { type: 'feeds', label: 'Social & media feed', icon: 'share', help: 'Cached posts and videos from connected channels.' },
  { type: 'table', label: 'Table', icon: 'table', help: 'Comparison or pricing table with an optional note.' },
  { type: 'fundsTable', label: 'Statutory funds table', icon: 'bank', help: 'Every published proof-of-funds rule with source and status.' },
  { type: 'checklist', label: 'Checklist', icon: 'check', help: 'Document or preparation checklist.' },
  { type: 'comparison', label: 'Comparison table', icon: 'compare', help: 'Column comparison of routes or courses.' },
  { type: 'notice', label: 'Notice callout', icon: 'alert', help: 'Info or warning callout.' },
  { type: 'faq', label: 'FAQ', icon: 'question', help: 'FAQ accordion, optionally by category.' },
  { type: 'enquiryForm', label: 'Enquiry form', icon: 'mail', help: 'Validated lead capture with routing and consent.' },
  { type: 'contactCards', label: 'Contact cards', icon: 'phone', help: 'Office, phone, WhatsApp and hours cards.' },
  { type: 'cta', label: 'Closing CTA', icon: 'arrow', help: 'Final call to action band.' },
  { type: 'sources', label: 'Sources & citations', icon: 'link', help: 'Source list with dates — a GEO citation block.' },
  { type: 'thankYou', label: 'Thank-you body', icon: 'check', help: 'Post-submission confirmation content.' },
];

function enrich(blocks, opts = {}) {
  return (blocks || []).map(b => {
    const block = { ...b };
    switch (b.type) {
      case 'programCards': {
        const where = ["status = 'published'"];
        const params = [];
        if (b.pillar && b.pillar !== 'all') { where.push('pillar = ?'); params.push(b.pillar); }
        if (b.filter === 'featured') where.push('featured = 1');
        const limit = Number(b.limit || 24);
        block.items = db.prepare(`SELECT * FROM programs WHERE ${where.join(' AND ')} ORDER BY sort_order, id LIMIT ?`).all(...params, limit)
          .map(p => ({ ...p, highlights_list: parseJson(p.highlights, []).slice(0, 3) }));
        break;
      }
      case 'destinations': {
        const limit = Number(b.limit || 8);
        block.items = db.prepare(`SELECT * FROM countries WHERE published = 1 ORDER BY sort_order LIMIT ?`).all(limit);
        block.regions = db.prepare('SELECT region, COUNT(*) AS n FROM countries WHERE published = 1 GROUP BY region ORDER BY MIN(sort_order)').all();
        break;
      }
      case 'plannerTeaser': {
        block.items = db.prepare(`SELECT * FROM countries WHERE published = 1 AND slug IN (${(b.countries || ['uk','canada']).map(() => '?').join(',')})`)
          .all(...(b.countries || ['uk','canada']));
        block.origins = db.prepare('SELECT DISTINCT origin_code, origin_city FROM flight_routes ORDER BY origin_city').all();
        break;
      }
      case 'trainer': {
        block.member = db.prepare(`SELECT * FROM team WHERE slug = ? AND is_public = 1`).get(b.teamSlug || 'zeb-khan');
        if (block.member) {
          block.member.credentials_list = parseJson(block.member.credentials, []);
          block.member.expertise_list = parseJson(block.member.expertise, []);
          block.member.phones_list = parseJson(block.member.phones, []);
          block.member.languages_list = parseJson(block.member.languages, []);
          block.member.programs = db.prepare(`SELECT name, slug, pillar FROM programs WHERE trainer_id = ? AND status = 'published' LIMIT 4`).all(block.member.id);
        }
        break;
      }
      case 'reviews': {
        block.items = integrations.publicReviews({ limit: Number(b.limit || 6) });
        block.aggregates = integrations.reviewAggregates();
        break;
      }
      case 'feeds': {
        block.items = integrations.publicFeeds({ limit: Number(b.limit || 6) });
        break;
      }
      case 'faq': {
        const where = ['published = 1'];
        const params = [];
        if (b.category) { where.push('category = ?'); params.push(b.category); }
        block.items = db.prepare(`SELECT * FROM faqs WHERE ${where.join(' AND ')} ORDER BY sort_order LIMIT ?`).all(...params, Number(b.limit || 20));
        break;
      }
      case 'fundsTable': {
        block.rows = db.prepare(`SELECT f.*, c.name AS country_name, c.slug AS country_slug, c.iso2
                                 FROM funds_rules f JOIN countries c ON c.id = f.country_id
                                 WHERE f.published = 1 ORDER BY c.sort_order, f.id`).all();
        break;
      }
      case 'contactCards': {
        block.offices = [
          { name: 'Dubai — Headquarters', address: opts.cfg?.['brand.address_uae'], phone: opts.cfg?.['brand.phone_uae'],
            whatsapp: opts.cfg?.['brand.whatsapp'], email: opts.cfg?.['brand.email'], hours: opts.cfg?.['brand.hours'],
            flag: '🇦🇪', timezone: 'GST (UTC+4)' },
          { name: 'Pakistan — Rawalpindi', address: opts.cfg?.['brand.address_pk'], phone: opts.cfg?.['brand.phone_pk'],
            whatsapp: opts.cfg?.['brand.whatsapp_pk'], email: opts.cfg?.['brand.email'], hours: opts.cfg?.['brand.hours'],
            flag: '🇵🇰', timezone: 'PKT (UTC+5)' },
        ];
        break;
      }
      case 'comparison': {
        // rows already supplied by the editor
        break;
      }
      default: break;
    }
    return block;
  });
}

/** Build the enriched context for a single program page. */
function programContext(program, { cfg }) {
  const p = { ...program };
  p.highlights_list = parseJson(program.highlights, []);
  p.included_list = parseJson(program.included, []);
  p.process_list = parseJson(program.process, []);
  p.answer_first = program.answer_summary || answerSummary(program.summary || '');
  p.fees = db.prepare('SELECT * FROM fee_versions WHERE program_id = ? AND published = 1 ORDER BY id').all(program.id)
    .map(f => ({ ...f, schedule_list: parseJson(f.schedule, []) }));
  p.trainer = program.trainer_id ? db.prepare('SELECT * FROM team WHERE id = ?').get(program.trainer_id) : null;
  if (p.trainer) p.trainer.credentials_list = parseJson(p.trainer.credentials, []);
  p.country = program.country_id ? db.prepare('SELECT * FROM countries WHERE id = ?').get(program.country_id) : null;
  p.faqs = db.prepare('SELECT * FROM faqs WHERE published = 1 AND (category = ? OR category = ?) ORDER BY sort_order LIMIT 6')
    .all(program.pillar === 'cambridge' ? 'training' : (program.pillar === 'immigration' ? 'visa' : 'admissions'), 'general');
  p.related = db.prepare(`SELECT name, slug, summary, pillar, fee_from, currency FROM programs
                          WHERE pillar = ? AND id != ? AND status = 'published' ORDER BY sort_order LIMIT 4`).all(program.pillar, program.id);
  p.reviews = integrations.publicReviews({ limit: 3 });
  return p;
}

/** Build the enriched context for a destination page. */
function countryContext(country) {
  const c = { ...country };
  c.answer_first = country.answer_summary || answerSummary(country.summary || '');
  c.purposes = parseJson(country.visa_purposes, ['study']);
  c.requirement_list = parseJson(country.requirements, []);
  c.highlight_list = parseJson(country.highlights, []);
  c.costs = db.prepare('SELECT * FROM country_costs WHERE country_id = ? ORDER BY scenario, city_tier, total').all(country.id);
  c.cities = [...new Set(c.costs.map(x => x.city))];
  c.scenarios = [...new Set(c.costs.map(x => x.scenario))];
  c.funds = db.prepare('SELECT * FROM funds_rules WHERE country_id = ? AND published = 1 ORDER BY id').all(country.id);
  c.programs = db.prepare(`SELECT * FROM programs WHERE status = 'published' AND (country_id = ? OR country_id IS NULL)
                           ORDER BY (country_id = ?) DESC, sort_order LIMIT 6`).all(country.id, country.id);
  c.routes = db.prepare(`SELECT * FROM flight_routes WHERE dest_country_id = ? ORDER BY base_fare LIMIT 6`).all(country.id);
  c.faqs = db.prepare('SELECT * FROM faqs WHERE published = 1 AND (country_id = ? OR category = ?) ORDER BY sort_order LIMIT 5').all(country.id, 'general');
  c.posts = db.prepare(`SELECT id, title, slug, answer_summary, read_minutes, publish_at FROM posts
                        WHERE status = 'published' ORDER BY publish_at DESC LIMIT 4`).all();
  c.reviews = integrations.publicReviews({ limit: 3 });
  return c;
}

module.exports = { enrich, BLOCK_TYPES, programContext, countryContext };

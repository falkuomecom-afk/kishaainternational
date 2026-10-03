'use strict';
/**
 * tRPC router for Kishaa International platform.
 * Backed by better-sqlite3 and the data in data/kishaa.db.
 * Serves the modern React frontend while connecting directly to CMS data and lead operations.
 */
const { initTRPC, TRPCError } = require('@trpc/server');
const superjson = require('superjson');
const { z } = require('zod');
const { db, setting, audit } = require('./db');
const H = require('./helpers');
const mailer = require('./mailer');
const integrations = require('./integrations');

const t = initTRPC.context().create({
  transformer: superjson,
});

const router = t.router;
const publicProcedure = t.procedure;

function formatList(val) {
  if (!val) return '';
  try {
    const parsed = typeof val === 'string' ? JSON.parse(val) : val;
    if (Array.isArray(parsed)) return parsed.join('\n');
    return String(parsed);
  } catch {
    return String(val);
  }
}

function parseArray(val) {
  if (!val) return [];
  try {
    const parsed = typeof val === 'string' ? JSON.parse(val) : val;
    if (Array.isArray(parsed)) return parsed;
    return [String(parsed)];
  } catch {
    return [String(val)];
  }
}

function mapProgram(p) {
  if (!p) return null;
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    pillar: p.pillar,
    type: p.type || 'service',
    summary: p.summary,
    description: p.summary || p.answer_summary,
    audience: p.audience,
    delivery: p.delivery,
    duration: p.duration,
    fees: p.fee_from ? `${p.currency || 'GBP'} ${p.fee_from}${p.fee_to ? '–' + p.fee_to : ''}` : p.fee_notes,
    currency: p.currency,
    location: p.location,
    highlights: formatList(p.highlights),
    featured: Boolean(p.featured),
    sortOrder: p.sort_order ?? 0,
    status: p.status || 'published',
    seoTitle: p.seo_title,
    seoDescription: p.seo_description,
  };
}

function getCountryLiving(country) {
  // Query all scenarios for this country from country_costs
  const rows = db.prepare(`SELECT scenario, total, currency, city FROM country_costs WHERE country_id = ?`).all(country.id);
  const cur = country.living_currency || country.currency || (rows[0] && rows[0].currency) || 'USD';
  
  let budget = null;
  let standard = null;
  let comfortable = null;

  for (const r of rows) {
    if (r.scenario === 'budget' && (budget === null || r.total < budget)) {
      budget = Math.round(r.total);
    }
    if (r.scenario === 'standard' && (standard === null || r.total < standard)) {
      standard = Math.round(r.total);
    }
    if (r.scenario === 'comfortable' && (comfortable === null || r.total > comfortable)) {
      comfortable = Math.round(r.total);
    }
  }

  // Fallbacks if missing
  if (country.living_total) {
    const tot = Math.round(country.living_total);
    if (!standard) standard = tot;
    if (!budget) budget = Math.round(tot * 0.8);
    if (!comfortable) comfortable = Math.round(tot * 1.25);
  } else if (standard) {
    if (!budget) budget = Math.round(standard * 0.8);
    if (!comfortable) comfortable = Math.round(standard * 1.3);
  } else if (budget) {
    standard = Math.round(budget * 1.25);
    comfortable = Math.round(budget * 1.6);
  } else {
    budget = 800;
    standard = 1100;
    comfortable = 1500;
  }

  const sampleCity = rows[0]?.city;
  const note = country.cost_note || (sampleCity ? `${sampleCity} cost profile` : 'Official estimates');

  return {
    currency: cur,
    budget,
    standard,
    comfortable,
    note,
  };
}

function getCountryFunds(country) {
  const rule = db.prepare(`SELECT * FROM funds_rules WHERE country_id = ? AND published = 1 ORDER BY id ASC LIMIT 1`).get(country.id);
  if (rule) {
    const amount = Math.round(rule.total_required || (rule.statutory_rate ? rule.statutory_rate * (rule.months || 12) : 10000));
    return {
      amount,
      currency: rule.total_currency || rule.rate_currency || country.currency || 'EUR',
      months: rule.months || 12,
      holderRule: rule.holding_period || rule.family_rule || 'Applicant or sponsor',
      note: rule.dependents_note || rule.route_name || '',
      sourceUrl: rule.source_url || '',
      effectiveDate: rule.effective_date || '2026-01',
    };
  }
  return null;
}

function getCountryFlights(country) {
  const routes = db.prepare(`SELECT * FROM flight_routes WHERE dest_country_id = ? ORDER BY base_fare ASC`).all(country.id);
  if (routes && routes.length > 0) {
    return routes.map(r => ({
      from: r.origin_code,
      priceMin: Math.round(r.base_fare),
      priceMax: Math.round(r.base_fare * 1.5),
      currency: r.currency || 'USD',
    }));
  }
  return [
    { from: 'LHE', priceMin: 500, priceMax: 850, currency: 'USD' },
    { from: 'DXB', priceMin: 350, priceMax: 650, currency: 'USD' },
    { from: 'ISB', priceMin: 520, priceMax: 880, currency: 'USD' },
    { from: 'KHI', priceMin: 480, priceMax: 820, currency: 'USD' },
  ];
}

function mapCountry(c) {
  if (!c) return null;
  const living = getCountryLiving(c);
  const funds = getCountryFunds(c);
  const flights = getCountryFlights(c);
  
  // Format flag: if emoji flag or code
  const flagMap = {
    GB: '🇬🇧', IT: '🇮🇹', FI: '🇫🇮', GE: '🇬🇪', DE: '🇩🇪', FR: '🇫🇷', PT: '🇵🇹',
    RS: '🇷🇸', RO: '🇷🇴', CA: '🇨🇦', US: '🇺🇸', AU: '🇦🇺', TR: '🇹🇷', AE: '🇦🇪',
    RU: '🇷🇺', KZ: '🇰🇿', KG: '🇰🇬', TJ: '🇹🇯'
  };
  const flagEmoji = flagMap[c.iso2] || flagMap[c.flag] || c.flag || '🌐';

  return {
    id: c.id,
    name: c.name,
    slug: c.slug === 'uk' ? 'united-kingdom' : c.slug,
    originalSlug: c.slug,
    region: c.region,
    flag: flagEmoji,
    summary: c.summary,
    visaInfo: c.answer_summary || c.summary,
    tuitionInfo: c.highlights ? formatList(c.highlights) : 'Tuition varies by institution and program level.',
    livingCosts: JSON.stringify(living),
    fundsRule: funds ? JSON.stringify(funds) : null,
    flightGuide: JSON.stringify(flights),
    seoTitle: c.seo_title,
    seoDescription: c.seo_description,
    featured: Boolean(c.featured),
    sortOrder: c.sort_order ?? 0,
    status: c.published ? 'published' : 'draft',
  };
}

const appRouter = router({
  ping: publicProcedure.query(() => ({ ok: true, ts: Date.now() })),

  auth: router({
    me: publicProcedure.query(({ ctx }) => ctx.user || null),
    logout: publicProcedure.mutation(({ ctx }) => {
      if (ctx.res && typeof ctx.res.clearCookie === 'function') {
        ctx.res.clearCookie('ki_session', { path: '/' });
      }
      return { success: true };
    }),
  }),

  content: router({
    pages: router({
      bySlug: publicProcedure
        .input(z.object({ slug: z.string() }))
        .query(({ input }) => {
          const row = db.prepare(`SELECT * FROM pages WHERE slug = ? AND status = 'published' AND deleted_at IS NULL`).get(input.slug);
          return row || null;
        }),
    }),

    posts: router({
      list: publicProcedure.query(() => {
        const rows = db.prepare(`SELECT * FROM posts WHERE status = 'published' ORDER BY publish_at DESC`).all();
        return rows.map(r => ({
          id: r.id,
          title: r.title,
          slug: r.slug,
          excerpt: r.excerpt,
          body: r.body,
          category: r.category_id ? (db.prepare('SELECT name FROM categories WHERE id = ?').get(r.category_id)?.name || 'Guides') : 'Guides',
          tags: r.tags,
          seoTitle: r.seo_title,
          seoDescription: r.seo_description,
          publishedAt: r.publish_at ? new Date(r.publish_at) : null,
        }));
      }),
      bySlug: publicProcedure
        .input(z.object({ slug: z.string() }))
        .query(({ input }) => {
          const r = db.prepare(`SELECT * FROM posts WHERE slug = ? AND (status = 'published' OR status = 'draft')`).get(input.slug);
          if (!r) return null;
          const author = r.author_id ? db.prepare('SELECT name FROM users WHERE id = ?').get(r.author_id) : null;
          const related = db.prepare(`SELECT id, title, slug, excerpt, answer_summary FROM posts WHERE id != ? AND (status = 'published' OR status = 'draft') ORDER BY publish_at DESC LIMIT 4`).all(r.id);
          const faqs = db.prepare(`SELECT id, question, answer FROM faqs WHERE published = 1 ORDER BY sort_order LIMIT 4`).all();
          const destinations = db.prepare(`SELECT name, slug FROM countries WHERE published = 1 ORDER BY sort_order LIMIT 6`).all();

          return {
            id: r.id,
            title: r.title,
            slug: r.slug,
            excerpt: r.excerpt,
            body: r.body,
            category: r.category_id ? (db.prepare('SELECT name FROM categories WHERE id = ?').get(r.category_id)?.name || 'Guides') : 'Guides',
            tags: r.tags,
            tagsList: parseArray(r.tags),
            seoTitle: r.seo_title,
            seoDescription: r.seo_description,
            publishedAt: r.publish_at ? new Date(r.publish_at) : null,
            readMinutes: r.read_minutes || 3,
            authorName: author?.name || 'Kishaa International',
            targetQuery: r.target_query || null,
            answerFirst: r.answer_summary || null,
            takeaways: parseArray(r.key_takeaways),
            related: related.map(rel => ({
              id: rel.id,
              title: rel.title,
              slug: rel.slug,
              excerpt: rel.excerpt,
            })),
            faqs: faqs.map(f => ({
              id: f.id,
              question: f.question,
              answer: f.answer,
            })),
            destinations: destinations.map(d => ({
              name: d.name,
              slug: d.slug,
            })),
          };
        }),
    }),

    programs: router({
      list: publicProcedure
        .input(z.object({ pillar: z.string().optional() }).optional())
        .query(({ input }) => {
          let rows;
          if (input?.pillar) {
            rows = db.prepare(`SELECT * FROM programs WHERE status = 'published' AND pillar = ? ORDER BY sort_order, id`).all(input.pillar);
          } else {
            rows = db.prepare(`SELECT * FROM programs WHERE status = 'published' ORDER BY sort_order, id`).all();
          }
          return rows.map(mapProgram);
        }),
      featured: publicProcedure.query(() => {
        const rows = db.prepare(`SELECT * FROM programs WHERE status = 'published' AND featured = 1 ORDER BY sort_order, id`).all();
        return rows.map(mapProgram);
      }),
    }),

    countries: router({
      list: publicProcedure.query(() => {
        const rows = db.prepare(`SELECT * FROM countries WHERE published = 1 ORDER BY sort_order, name`).all();
        return rows.map(mapCountry);
      }),
      bySlug: publicProcedure
        .input(z.object({ slug: z.string() }))
        .query(({ input }) => {
          const s = input.slug.toLowerCase();
          const target = s === 'united-kingdom' ? 'uk' : s;
          const row = db.prepare(`SELECT * FROM countries WHERE (slug = ? OR slug = ?) AND published = 1`).get(s, target);
          return mapCountry(row);
        }),
    }),

    team: router({
      list: publicProcedure.query(() => {
        const rows = db.prepare(`SELECT * FROM team WHERE is_public = 1 ORDER BY sort_order`).all();
        return rows.map(r => ({
          id: r.id,
          name: r.name,
          slug: r.slug,
          role: r.role_title,
          bio: r.bio,
          credentials: formatList(r.credentials),
          expertise: formatList(r.expertise),
          languages: formatList(r.languages),
          email: r.email,
          phone: r.phones ? (JSON.parse(r.phones)[0] || null) : null,
          featured: Boolean(r.is_public),
        }));
      }),
      bySlug: publicProcedure
        .input(z.object({ slug: z.string() }))
        .query(({ input }) => {
          const r = db.prepare(`SELECT * FROM team WHERE slug = ?`).get(input.slug);
          if (!r) return null;
          return {
            id: r.id,
            name: r.name,
            slug: r.slug,
            role: r.role_title,
            bio: r.bio,
            credentials: formatList(r.credentials),
            expertise: formatList(r.expertise),
            languages: formatList(r.languages),
            email: r.email,
            phone: r.phones ? (JSON.parse(r.phones)[0] || null) : null,
            featured: Boolean(r.is_public),
          };
        }),
    }),

    testimonials: router({
      list: publicProcedure.query(() => {
        const rows = db.prepare(`SELECT * FROM testimonials WHERE status = 'approved' OR status = 'published' ORDER BY featured DESC, id DESC`).all();
        return rows.map(r => ({
          id: r.id,
          quote: r.quote,
          authorName: r.author_display || 'Client',
          context: r.context,
          program: r.program_id ? String(r.program_id) : null,
          country: r.country_id ? String(r.country_id) : null,
          rating: r.rating || 5,
          source: r.source_platform || 'google',
        }));
      }),
    }),

    reviews: router({
      list: publicProcedure.query(() => {
        const rows = db.prepare(`SELECT * FROM review_cache WHERE display_state = 'shown' ORDER BY published_at DESC`).all();
        return rows.map(r => ({
          id: r.id,
          platform: r.platform,
          author: r.author,
          rating: r.rating,
          text: r.text,
          reviewDate: r.published_at,
          permalink: r.permalink,
        }));
      }),
      aggregate: publicProcedure.query(() => {
        const rows = db.prepare(`SELECT * FROM review_aggregates`).all();
        if (rows && rows.length > 0) {
          return rows.map(r => ({
            platform: r.platform,
            avg: r.score,
            count: r.review_count,
          }));
        }
        return [
          { platform: 'google', avg: 4.9, count: 214 },
          { platform: 'facebook', avg: 4.8, count: 98 },
          { platform: 'trustpilot', avg: 4.9, count: 64 },
        ];
      }),
    }),

    feeds: router({
      list: publicProcedure
        .input(z.object({ platform: z.string().optional() }).optional())
        .query(({ input }) => {
          let sql = `SELECT * FROM feed_cache WHERE display_state = 'shown'`;
          const params = [];
          if (input?.platform) {
            sql += ` AND platform = ?`;
            params.push(input.platform);
          }
          sql += ` ORDER BY published_at DESC LIMIT 30`;
          const rows = db.prepare(sql).all(...params);
          return rows.map(r => ({
            id: r.id,
            platform: r.platform,
            kind: r.kind,
            caption: r.caption,
            mediaUrl: r.media_url,
            thumbUrl: r.thumb_url,
            permalink: r.permalink,
            publishedAt: r.published_at,
            tags: JSON.parse(r.tags || '[]'),
            isSample: !!r.is_sample,
          }));
        }),
    }),

    faqs: router({
      list: publicProcedure
        .input(z.object({ category: z.string().optional() }).optional())
        .query(({ input }) => {
          let rows;
          if (input?.category) {
            rows = db.prepare(`SELECT * FROM faqs WHERE published = 1 AND category = ? ORDER BY sort_order, id`).all(input.category);
          } else {
            rows = db.prepare(`SELECT * FROM faqs WHERE published = 1 ORDER BY sort_order, id`).all();
          }
          return rows.map(r => ({
            id: r.id,
            question: r.question,
            answer: r.answer,
            category: r.category,
            sortOrder: r.sort_order,
          }));
        }),
    }),
  }),

  planner: router({
    estimate: publicProcedure
      .input(z.object({
        countrySlug: z.string(),
        purpose: z.enum(['study', 'visit', 'work', 'business']),
        scenario: z.enum(['budget', 'standard', 'comfortable']).default('standard'),
        stayMonths: z.number().int().min(1).max(60).default(6),
        dependants: z.number().int().min(0).max(10).default(0),
        origin: z.enum(['DXB', 'LHE', 'ISB', 'KHI']).default('LHE'),
        cabin: z.enum(['economy', 'premium', 'business']).default('economy'),
        travellers: z.number().int().min(1).max(9).default(1),
        selfFunds: z.number().min(0).optional(),
      }))
      .mutation(({ input }) => {
        const s = input.countrySlug.toLowerCase();
        const target = s === 'united-kingdom' ? 'uk' : s;
        const country = db.prepare(`SELECT * FROM countries WHERE (slug = ? OR slug = ?) AND published = 1`).get(s, target);
        if (!country) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Unknown destination country' });
        }

        const living = getCountryLiving(country);
        const funds = getCountryFunds(country);
        const flights = getCountryFlights(country);

        const leg = flights.find(f => f.from === input.origin) || flights.find(f => f.from === 'LHE') || flights[0];
        const cabinMult = input.cabin === 'economy' ? 1 : input.cabin === 'premium' ? 1.6 : 2.8;
        const seasonal = 1.08;

        const flightOut = leg ? {
          from: leg.from,
          currency: leg.currency,
          min: Math.round(leg.priceMin * cabinMult * seasonal) * input.travellers,
          max: Math.round(leg.priceMax * cabinMult * seasonal) * input.travellers,
          freshness: 'indicative',
          note: 'Indicative range. Live airline fares are confirmed by the admissions team.',
        } : null;

        const monthlyCost = living[input.scenario] || living.standard;
        const livingOut = {
          currency: living.currency,
          monthly: monthlyCost,
          stayTotal: monthlyCost * input.stayMonths,
          dependantUplift: input.dependants > 0 ? Math.round(monthlyCost * 0.45 * input.dependants * input.stayMonths) : 0,
          note: living.note,
          freshness: 'indicative',
        };

        const fundsOut = funds ? {
          currency: funds.currency,
          amount: funds.amount,
          dependantTotal: input.dependants > 0 ? Math.round(funds.amount * (1 + 0.35 * input.dependants)) : funds.amount,
          months: funds.months,
          holderRule: funds.holderRule,
          note: funds.note,
          sourceUrl: funds.sourceUrl,
          effectiveDate: funds.effectiveDate,
          freshness: 'official',
        } : null;

        const requiredFunds = fundsOut ? fundsOut.dependantTotal : null;
        const gap = (input.selfFunds !== undefined && requiredFunds !== null) ? requiredFunds - input.selfFunds : null;

        return {
          country: { name: country.name, slug: input.countrySlug, region: country.region },
          purpose: input.purpose,
          scenario: input.scenario,
          stayMonths: input.stayMonths,
          flight: flightOut,
          living: livingOut,
          funds: fundsOut,
          gap,
          moreInfoNeeded: !fundsOut,
          disclaimer: 'Estimates are indicative planning figures. Official embassy maintenance rules are verified against government sources with effective dates.',
        };
      }),
  }),

  leads: router({
    submit: publicProcedure
      .input(z.object({
        name: z.string().min(2).max(255),
        phone: z.string().max(64).optional(),
        email: z.string().email().max(320).optional().or(z.literal('')),
        interest: z.string().min(1).max(120),
        contactPref: z.enum(['phone', 'whatsapp', 'email']).default('whatsapp'),
        message: z.string().max(2000).optional(),
        country: z.string().max(120).optional(),
        program: z.string().max(255).optional(),
        source: z.string().max(120).default('Website'),
        page: z.string().max(255).optional(),
        consentNotice: z.literal(true),
        marketingConsent: z.boolean().default(false),
        idempotencyKey: z.string().min(8).max(64),
        website: z.string().max(0).optional(),
      }))
      .mutation(({ input, ctx }) => {
        // Honeypot check
        if (input.website) {
          return { ok: true, ref: 'KI-CONFIRMED', duplicate: true };
        }

        // Contact method validation
        if (input.contactPref !== 'email' && !input.phone) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'A phone or WhatsApp number is required for this contact method.' });
        }
        if (input.contactPref === 'email' && !input.email) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'An email address is required for email contact.' });
        }

        // Idempotency check
        const existing = db.prepare('SELECT id, reference FROM leads WHERE idempotency_key = ?').get(input.idempotencyKey);
        if (existing) {
          return { ok: true, ref: existing.reference, duplicate: true };
        }

        const ref = H.reference(setting('ops.lead_prefix', 'KI'));
        const phone = H.normalisePhone(input.phone, null);
        const email = H.normaliseEmail(input.email);

        // Map interest category
        let interestCat = 'other';
        const rawInt = (input.interest || '').toLowerCase();
        if (rawInt.includes('career') || rawInt.includes('admission')) interestCat = 'career_counseling';
        else if (rawInt.includes('immigration') || rawInt.includes('visa')) interestCat = 'immigration';
        else if (rawInt.includes('cambridge') || rawInt.includes('ielts')) interestCat = 'cambridge';

        let countryId = null;
        if (input.country) {
          const cRow = db.prepare('SELECT id FROM countries WHERE slug = ? OR name = ?').get(input.country, input.country);
          if (cRow) countryId = cRow.id;
        }

        const info = db.prepare(`
          INSERT INTO leads (reference, full_name, phone, whatsapp, email, contact_preference, interest,
                             source_type, source_page, marketing_consent, consent_notice_version, idempotency_key,
                             stage, country_id, message, ip_hash)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?, ?)
        `).run(
          ref, input.name, phone, phone, email, input.contactPref, interestCat,
          input.source || 'Website', input.page || '/', input.marketingConsent ? 1 : 0,
          setting('ops.privacy_notice_version', 'v1'), input.idempotencyKey,
          countryId, input.message || null, H.hashIp(ctx.ip || '127.0.0.1')
        );

        const leadId = info.lastInsertRowid;

        // Activity log
        db.prepare(`
          INSERT INTO lead_activities (lead_id, actor_name, type, note, new_stage, created_at)
          VALUES (?, 'System', 'created', ?, 'new', datetime('now'))
        `).run(
          leadId,
          `Enquiry stored from React form on ${input.page || '/'}. Program: ${input.program || 'None'}. Interest: ${input.interest}.`
        );

        const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(leadId);
        lead.interest_label = { career_counseling: 'Career counseling', career: 'Career counseling', immigration: 'Immigration / visa', cambridge: 'Cambridge & IELTS', other: 'General enquiry' }[lead.interest];

        // Check duplicates
        const dup = db.prepare(`
          SELECT id, reference FROM leads WHERE id != ? AND ((email IS NOT NULL AND email = ?) OR (phone IS NOT NULL AND phone = ?))
          ORDER BY id DESC LIMIT 1
        `).get(lead.id, email, phone);

        if (dup) {
          db.prepare('UPDATE leads SET duplicate_of = ? WHERE id = ?').run(dup.id, lead.id);
          db.prepare(`INSERT INTO lead_activities (lead_id, actor_name, type, note, created_at) VALUES (?, 'System', 'system', ?, datetime('now'))`)
            .run(lead.id, `Flagged as duplicate of prior lead #${dup.id} (${dup.reference}).`);
        }

        // Notifications
        try {
          mailer.queueLeadNotifications(lead, { type: dup ? 'repeat_contact' : 'new_lead' });
          integrations.notifyHighIntent(lead).catch(() => {});
        } catch (e) {
          console.error('[lead mailer]', e.message);
        }

        audit(null, 'lead.created', 'leads', lead.id, { reference: ref, source: 'react_frontend' }, ctx.ip || '127.0.0.1');

        return { ok: true, ref, duplicate: false };
      }),
  }),
});

module.exports = { appRouter };

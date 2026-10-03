'use strict';
/**
 * Countries Data & Cost Intelligence Module
 * Provides unified access to published countries, living costs, proof-of-funds rules,
 * and flight route estimations with Supabase (cloud) and SQLite (local) support.
 */
const { db } = require('./db');
const supabase = require('./supabase');

const SLUG_ALIASES = {
  'united-states': 'usa',
  'us': 'usa',
  'america': 'usa',
  'usa': 'usa',
  'united-kingdom': 'uk',
  'great-britain': 'uk',
  'britain': 'uk',
  'uk': 'uk',
  'united-arab-emirates': 'uae',
  'emirates': 'uae',
  'dubai': 'uae',
  'uae': 'uae',
  'turkey': 'turkey',
  'turkiye': 'turkey',
};

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

function computeLiving(country, rows) {
  const cur = country.living_currency || country.currency || (rows[0] && rows[0].currency) || 'USD';
  let budget = null;
  let standard = null;
  let comfortable = null;

  for (const r of (rows || [])) {
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

  const sampleCity = rows?.[0]?.city;
  const note = country.cost_note || (sampleCity ? `${sampleCity} cost profile` : 'Official estimates');

  return {
    currency: cur,
    budget,
    standard,
    comfortable,
    note,
  };
}

function computeFunds(country, rule) {
  if (!rule) return null;
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

function computeFlights(routes) {
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

function mapCountryWithPreloaded(c, preloaded = {}) {
  if (!c) return null;
  const living = computeLiving(c, preloaded.costs || []);
  const funds = computeFunds(c, preloaded.fundRule || null);
  const flights = computeFlights(preloaded.flights || []);

  const flagMap = {
    GB: '🇬🇧', IT: '🇮🇹', FI: '🇫🇮', GE: '🇬🇪', DE: '🇩🇪', FR: '🇫🇷', PT: '🇵🇹',
    RS: '🇷🇸', RO: '🇷🇴', CA: '🇨🇦', US: '🇺🇸', AU: '🇦🇺', TR: '🇹🇷', AE: '🇦🇪',
    RU: '🇷🇺', KZ: '🇰🇿', KG: '🇰🇬', TJ: '🇹🇯'
  };
  const flagEmoji = flagMap[c.iso2] || flagMap[c.flag] || c.flag || '🌐';
  const normalizedSlug = c.slug === 'uk' ? 'united-kingdom' : (c.slug === 'usa' ? 'united-states' : c.slug);

  return {
    id: c.id,
    name: c.name,
    slug: normalizedSlug,
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

let cachedCountriesList = {
  data: null,
  expiresAt: 0,
};

async function getCompiledCountriesList() {
  const now = Date.now();
  if (cachedCountriesList.data && now < cachedCountriesList.expiresAt) {
    return cachedCountriesList.data;
  }

  // 1. Supabase bulk query
  if (supabase.isAvailable()) {
    try {
      const sb = supabase.getClient();
      const [countriesRes, costsRes, fundsRes, flightsRes] = await Promise.all([
        sb.from('countries').select('*').eq('published', 1).order('sort_order', { ascending: true }).order('name', { ascending: true }),
        sb.from('country_costs').select('*'),
        sb.from('funds_rules').select('*').eq('published', 1).order('id', { ascending: true }),
        sb.from('flight_routes').select('*').order('base_fare', { ascending: true })
      ]);

      if (countriesRes.data && countriesRes.data.length > 0) {
        const costsByCountry = {};
        for (const row of (costsRes.data || [])) {
          if (!costsByCountry[row.country_id]) costsByCountry[row.country_id] = [];
          costsByCountry[row.country_id].push(row);
        }

        const fundsByCountry = {};
        for (const row of (fundsRes.data || [])) {
          if (!fundsByCountry[row.country_id]) fundsByCountry[row.country_id] = row;
        }

        const flightsByCountry = {};
        for (const row of (flightsRes.data || [])) {
          if (!flightsByCountry[row.dest_country_id]) flightsByCountry[row.dest_country_id] = [];
          flightsByCountry[row.dest_country_id].push(row);
        }

        const list = countriesRes.data.map(c => mapCountryWithPreloaded(c, {
          costs: costsByCountry[c.id] || [],
          fundRule: fundsByCountry[c.id] || null,
          flights: flightsByCountry[c.id] || []
        }));

        cachedCountriesList = {
          data: list,
          expiresAt: now + 5 * 60 * 1000 // 5 minute TTL
        };
        return list;
      }
    } catch (sbErr) {
      console.error('[countries:getCompiledCountriesList] Supabase batch failed:', sbErr.message);
    }
  }

  // 2. SQLite bulk query fallback
  try {
    const countries = db.prepare(`SELECT * FROM countries WHERE published = 1 ORDER BY sort_order, name`).all();
    const costs = db.prepare(`SELECT * FROM country_costs`).all();
    const funds = db.prepare(`SELECT * FROM funds_rules WHERE published = 1 ORDER BY id ASC`).all();
    const flights = db.prepare(`SELECT * FROM flight_routes ORDER BY base_fare ASC`).all();

    const costsByCountry = {};
    for (const row of costs) {
      if (!costsByCountry[row.country_id]) costsByCountry[row.country_id] = [];
      costsByCountry[row.country_id].push(row);
    }

    const fundsByCountry = {};
    for (const row of funds) {
      if (!fundsByCountry[row.country_id]) fundsByCountry[row.country_id] = row;
    }

    const flightsByCountry = {};
    for (const row of flights) {
      if (!flightsByCountry[row.dest_country_id]) flightsByCountry[row.dest_country_id] = [];
      flightsByCountry[row.dest_country_id].push(row);
    }

    const list = countries.map(c => mapCountryWithPreloaded(c, {
      costs: costsByCountry[c.id] || [],
      fundRule: fundsByCountry[c.id] || null,
      flights: flightsByCountry[c.id] || []
    }));

    cachedCountriesList = {
      data: list,
      expiresAt: now + 5 * 60 * 1000
    };
    return list;
  } catch (dbErr) {
    console.error('[countries:getCompiledCountriesList] SQLite failed:', dbErr.message);
    return [];
  }
}

async function mapCountryAsync(c) {
  if (!c) return null;
  const list = await getCompiledCountriesList();
  const found = list.find(x => x.id === c.id || x.originalSlug === c.slug);
  if (found) return found;
  return mapCountryWithPreloaded(c, {});
}

async function getCountryBySlug(rawSlug) {
  const s = (rawSlug || '').toLowerCase().trim();
  const target = SLUG_ALIASES[s] || s;
  const list = await getCompiledCountriesList();

  const match = list.find(c => {
    const cSlug = (c.slug || '').toLowerCase();
    const origSlug = (c.originalSlug || '').toLowerCase();
    return (
      cSlug === s ||
      origSlug === s ||
      cSlug === target ||
      origSlug === target ||
      SLUG_ALIASES[cSlug] === target ||
      SLUG_ALIASES[origSlug] === target ||
      SLUG_ALIASES[cSlug] === s ||
      SLUG_ALIASES[origSlug] === s
    );
  });

  if (match) return match;

  // Fallback to single lookup if not found in list
  if (supabase.isAvailable()) {
    const row = await supabase.getCountryBySlug(rawSlug);
    if (row) return await mapCountryAsync(row);
  }
  try {
    const row = db.prepare(`SELECT * FROM countries WHERE (slug = ? OR slug = ?) AND published = 1`).get(s, target);
    return await mapCountryAsync(row);
  } catch {
    return null;
  }
}

module.exports = {
  SLUG_ALIASES,
  computeLiving,
  computeFunds,
  computeFlights,
  mapCountryWithPreloaded,
  getCompiledCountriesList,
  getCountryBySlug,
  mapCountryAsync
};

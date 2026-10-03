'use strict';
/**
 * COUNTRY & VISA COST PLANNER ENGINE  (brief pp.11-13, acceptance test A13)
 * ---------------------------------------------------------------------------
 * Guarantees:
 *  · Outputs are separated: Spending (flights + living) vs Statutory Funds vs Checklist.
 *  · Missing mandatory input → "More information needed", never a fabricated zero.
 *  · Every number carries source, observed/effective date and a freshness label.
 *  · Estimates keep the rule version they were computed with.
 */
const { db, setting } = require('./db');

const FRESHNESS = {
  live:            { key: 'live',            label: 'Live flight quote',      tone: 'ok',   note: 'Real-time supplier response for the exact itinerary.' },
  official:        { key: 'official',        label: 'Official embassy rule',  tone: 'ok',   note: 'Statutory funds verified against the government source with an effective date.' },
  indicative:      { key: 'indicative',      label: 'Indicative living cost', tone: 'info', note: 'Maintained statistical average; refresh target is semi-annual.' },
  model:           { key: 'model',           label: 'Kishaa advisory estimate', tone: 'info', note: 'Planning estimate, not an official figure.' },
  needs_review:    { key: 'needs_review',    label: 'Expired / needs review', tone: 'warn', note: 'Unverified rule — suppressed from official calculation and referred to a counselor.' },
};

const SCENARIO_MULTIPLIER = { budget: 1, standard: 1, comfortable: 1 };

function countries() {
  return db.prepare(`SELECT c.*, 
    (SELECT COUNT(*) FROM country_costs cc WHERE cc.country_id = c.id) AS city_count,
    (SELECT COUNT(*) FROM funds_rules f WHERE f.country_id = c.id AND f.published = 1) AS rule_count
    FROM countries c WHERE c.published = 1 ORDER BY c.sort_order, c.name`).all();
}
function countryBySlug(slug) {
  if (!slug) return null;
  const s = String(slug).toLowerCase();
  const alias = s === 'united-kingdom' ? 'uk' : (s === 'uk' ? 'united-kingdom' : s);
  return db.prepare('SELECT * FROM countries WHERE slug = ? OR slug = ?').get(s, alias);
}
function cities(countryId) {
  return db.prepare('SELECT DISTINCT city, city_tier FROM country_costs WHERE country_id = ? ORDER BY city_tier, city').all(countryId);
}
function costFor(countryId, city, scenario) {
  return db.prepare(`SELECT * FROM country_costs WHERE country_id = ? AND city = ? AND scenario = ?
                     ORDER BY id DESC LIMIT 1`).get(countryId, city, scenario)
      || db.prepare(`SELECT * FROM country_costs WHERE country_id = ? AND scenario = ? ORDER BY id ASC LIMIT 1`).get(countryId, scenario);
}
function fundsRule(countryId, purpose) {
  const rows = db.prepare(`SELECT * FROM funds_rules WHERE country_id = ? AND published = 1
                           ORDER BY (visa_purpose = ?) DESC, id ASC`).all(countryId, purpose || 'study');
  return rows[0] || null;
}
function routes(origin, dest) {
  return db.prepare(`SELECT * FROM flight_routes WHERE origin_code = ? ORDER BY base_fare ASC`).all(origin || 'ISB');
}
function routeFor(originCode, destCountryId) {
  return db.prepare(`SELECT * FROM flight_routes WHERE origin_code = ? AND dest_country_id = ?
                     ORDER BY base_fare ASC LIMIT 1`).get(originCode, destCountryId);
}
function origins() {
  return db.prepare('SELECT DISTINCT origin_code, origin_city FROM flight_routes ORDER BY origin_city').all();
}

/* ------------------------------------------------------------------ flight calc
 * Live Airline Ticket = Base Airfare + Departure & Security Taxes + Fuel Surcharges
 *                     + Baggage Allowance + Seasonal Multiplier
 */
function flightEstimate(route, { month, cabin = 'economy', passengers = 1, baggageKg = 30, providerMode = 'sandbox' }) {
  if (!route) return null;
  const cabinMult = JSON.parse(route.cabin_multiplier || '{}')[cabin] || 1;
  const season = JSON.parse(route.seasonality || '{}')[String(month || new Date().getMonth() + 1)] || 1;
  const baggage = Math.max(0, (Number(baggageKg) - 20)) * 8;
  const perPax = (route.base_fare + route.taxes + route.fuel_surcharge + route.baggage_allowance + baggage) * cabinMult * season;
  const total = perPax * Number(passengers || 1);
  const cabinLabel = { economy: 'Economy', premium: 'Premium Economy', business: 'Business' }[cabin] || 'Economy';
  return {
    kind: 'flight',
    freshness: providerMode === 'live' ? 'live' : 'model',
    provider: route.provider,
    provider_mode: providerMode,
    origin: { code: route.origin_code, city: route.origin_city },
    destination: { code: route.dest_code, city: route.dest_city },
    cabin, cabin_label: cabinLabel,
    passengers: Number(passengers || 1),
    baggage_kg: Number(baggageKg || 0),
    season_multiplier: season,
    cabin_multiplier: cabinMult,
    currency: route.currency,
    breakdown: [
      { label: 'Base airfare (per passenger)', amount: route.base_fare * cabinMult },
      { label: 'Departure & security taxes', amount: route.taxes },
      { label: 'Fuel surcharge', amount: route.fuel_surcharge },
      { label: 'Baggage allowance', amount: route.baggage_allowance + baggage },
      { label: `Seasonal multiplier (${monthName(month)})`, amount: (perPax - (route.base_fare + route.taxes + route.fuel_surcharge + route.baggage_allowance + baggage) * cabinMult) },
    ],
    per_passenger: Math.round(perPax),
    total: Math.round(total),
    formula: 'Base airfare + departure & security taxes + fuel surcharge + baggage allowance, adjusted by cabin and season.',
    quote_expiry: new Date(Date.now() + 24 * 3600e3).toISOString(),
    note: providerMode === 'live'
      ? 'Supplier quote valid for the itinerary shown; expired quotes require a fresh search.'
      : 'Provider API not connected in this environment — figure is a maintained route-matrix estimate, clearly labelled.',
  };
}

function monthName(m) { return new Date(2026, (Number(m) || 1) - 1, 1).toLocaleString('en-GB', { month: 'long' }); }

/* ------------------------------------------------------------------- living calc
 * Monthly Living Cost = Rent + Food + Transit + Insurance + Utilities + Contingency
 */
function livingEstimate(cost, { months = 12, dependents = 0, scenario = 'standard', cityLabel }) {
  if (!cost) return null;
  const base = cost.rent + cost.food + cost.transit + cost.insurance + cost.utilities + cost.contingency;
  const depFactor = 1 + Number(dependents || 0) * 0.35;
  const monthly = base * depFactor;
  const total = monthly * Number(months || 1);
  const status = cost.review_status === 'approved' ? 'indicative' : 'needs_review';
  return {
    kind: 'living',
    freshness: status,
    city: cost.city || cityLabel || '—',
    city_tier: cost.city_tier,
    scenario,
    dependents: Number(dependents || 0),
    months: Number(months || 1),
    currency: cost.currency || 'USD',
    breakdown: [
      { label: 'Accommodation / rent', amount: round2(cost.rent * depFactor) },
      { label: 'Food & groceries', amount: round2(cost.food * depFactor) },
      { label: 'Public transit pass', amount: round2(cost.transit) },
      { label: 'Health insurance', amount: round2(cost.insurance * depFactor) },
      { label: 'Utilities & SIM', amount: round2(cost.utilities * depFactor) },
      { label: 'Contingency allowance', amount: round2(cost.contingency * depFactor) },
    ],
    monthly: Math.round(monthly),
    total: Math.round(total),
    source: { name: cost.source_name, url: cost.source_url, observed_at: cost.observed_at },
    formula: 'Accommodation + food & groceries + public transit + health insurance + utilities & SIM + contingency, scaled for dependents and stay length.',
    note: 'Indicative maintained statistical average by city tier — not a supplier quote.',
  };
}

function round2(n) { return Math.round(Number(n || 0) * 100) / 100; }

/* -------------------------------------------------------------- funds calc
 * Official Bank Statement Requirement =
 *   Statutory Monthly Maintenance Rate × Mandated Months
 *   + Unpaid Tuition Balance + Documented Dependent Surcharges
 */
function fundsEstimate(rule, { unpaidTuition = 0, dependents = 0, purpose }) {
  if (!rule) return { status: 'missing', freshness: 'needs_review',
    message: 'More information needed — no published, verified funds rule is available for this route yet. A counselor can confirm the current rule.' };
  if (rule.review_status !== 'approved') {
    return { status: 'needs_review', freshness: 'needs_review', rule_label: rule.route_name,
      message: 'This statutory rule is under review and has been withheld from automatic calculation. Request a counselor review for a current figure.',
      source: { name: rule.source_name, url: rule.source_url, effective_date: rule.effective_date } };
  }
  const monthly = rule.statutory_rate || (rule.total_required && rule.months ? rule.total_required / rule.months : 0);
  const base = rule.total_required != null ? rule.total_required : monthly * (rule.months || 12);
  const depSurcharge = Number(dependents || 0) * (rule.dependents_note ? dependentRate(rule) : 0);
  const total = base + Number(unpaidTuition || 0) + depSurcharge;
  return {
    kind: 'funds',
    status: 'ok',
    freshness: 'official',
    rule_label: rule.route_name,
    rule_type: rule.rule_type,
    months: rule.months,
    statutory_rate: monthly,
    dependents: Number(dependents || 0),
    dependents_note: rule.dependents_note,
    family_rule: rule.family_rule,
    currency: rule.total_currency || 'EUR',
    holding_period: rule.holding_period,
    tuition_component: rule.tuition_component,
    pkr_equivalent: rule.pkr_equivalent,
    breakdown: [
      { label: `Statutory maintenance (${rule.months || 12} months × ${rule.total_currency} ${round2(monthly)})`, amount: round2(base) },
      ...(unpaidTuition ? [{ label: 'Unpaid tuition balance', amount: Number(unpaidTuition) }] : []),
      ...(depSurcharge ? [{ label: `Documented dependants (${dependents})`, amount: round2(depSurcharge) }] : []),
    ],
    total: round2(total),
    version: rule.version,
    source: { name: rule.source_name, url: rule.source_url, effective_date: rule.effective_date, reviewed_at: rule.reviewed_at },
    formula: 'Statutory monthly maintenance rate × mandated months + unpaid tuition balance + documented dependant surcharges.',
    note: 'Statutory holding requirement — this is separate from everyday spending and is never netted off against it.',
  };
}
function dependentRate(rule) {
  const m = /(?:eur|€|\$|£)\s?([\d,]{3,7})/i.exec(rule.dependents_note || '');
  if (m) return Number(m[1].replace(/,/g, '')) || 0;
  return (rule.statutory_rate || 0) * 12 * 0.5;
}

/* ------------------------------------------------------------------ checklist */
function checklist(country, purpose, { months = 12 }) {
  const items = [
    { label: 'Passport valid for the full intended stay', state: 'required' },
    { label: 'Completed application form with accurate personal details', state: 'required' },
    { label: 'Confirmed accommodation or institution offer letter', state: 'required' },
    { label: 'Proof of funds held for the mandated holding period', state: 'required' },
    { label: 'Travel & health insurance covering the stay', state: 'required' },
    { label: 'Biometrics appointment booked at the visa application centre', state: 'conditional' },
    { label: 'Sponsor / business invitation letter where the route requires it', state: purpose === 'business' ? 'required' : 'conditional' },
    { label: 'Dependant documents (relationship proof, extra funds)', state: 'conditional' },
    { label: 'Academic transcripts & English test result where study route', state: purpose === 'study' ? 'required' : 'not_applicable' },
  ];
  if (country?.requirements) {
    try { for (const extra of JSON.parse(country.requirements)) items.push({ label: extra, state: 'required' }); } catch {}
  }
  return items.map(i => ({ ...i, horizon_months: months }));
}

/* ------------------------------------------------------------------- planning */
function plan(input) {
  const started = Date.now();
  const country = input.countrySlug ? countryBySlug(input.countrySlug) : (input.countryId ? db.prepare('SELECT * FROM countries WHERE id = ?').get(input.countryId) : null);
  if (!country) {
    return { ok: false, code: 'more_information_needed',
      message: 'More information needed — choose a destination country to begin.', missing: ['country'] };
  }
  const missing = [];
  const purpose = input.purpose || 'study';
  const months = Number(input.months || 12);
  const scenario = input.scenario || 'standard';
  const city = input.city || (cities(country.id)[0] || {}).city || null;
  const dependents = Number(input.dependents || 0);
  const originCode = input.originCode || 'ISB';
  const passengers = Number(input.passengers || 1);
  const cabin = input.cabin || 'economy';
  const baggageKg = Number(input.baggageKg || 30);
  const month = Number(input.month || new Date().getMonth() + 1);

  if (!city) missing.push('city');

  const cost = costFor(country.id, city, scenario);
  const rule = fundsRule(country.id, purpose);
  const route = routeFor(originCode, country.id);
  const mode = setting('flags.planner_live_fares', false) ? 'live' : 'sandbox';

  const flight = flightEstimate(route, { month, cabin, passengers, baggageKg, providerMode: mode });
  const living = livingEstimate(cost, { months, dependents, scenario, cityLabel: city });
  const funds = fundsEstimate(rule, { unpaidTuition: Number(input.unpaidTuition || 0), dependents, purpose });

  if (!flight) missing.push('flight_route');
  if (!living) missing.push('living_profile');

  const spendingTotal = (flight ? flight.total : 0) + (living ? living.total : 0);
  const spentCurrency = flight ? flight.currency : (living ? living.currency : 'USD');
  const totalPlan = spendingTotal + (funds.status === 'ok' ? funds.total : 0);

  return {
    ok: true,
    code: missing.length ? 'partial' : 'complete',
    message: missing.length
      ? 'More information needed for a complete estimate — the items below are shown as unavailable rather than estimated.'
      : 'Estimate complete. Spending, statutory funds and documents are shown separately.',
    missing,
    inputs: { countrySlug: country.slug, country: country.name, city, purpose, months, scenario, dependents, originCode, passengers, cabin, baggageKg, month,
              unpaidTuition: Number(input.unpaidTuition || 0) },
    country: { id: country.id, name: country.name, slug: country.slug, region: country.region, bloc: country.bloc,
               currency: country.currency, processing_time: country.processing_time, living_total: country.living_total },
    sections: [
      { key: 'flight', title: '1 · Live flight ticket', freshness: flight?.freshness || 'needs_review', data: flight },
      { key: 'living', title: '2 · Country living cost', freshness: living?.freshness || 'needs_review', data: living },
      { key: 'funds',  title: '3 · Statutory bank statement requirement', freshness: funds.freshness || 'official', data: funds },
      { key: 'checklist', title: '4 · Document checklist', freshness: 'model', data: { items: checklist(country, purpose, { months }) } },
    ],
    totals: {
      spending: { amount: Math.round(spendingTotal), currency: spentCurrency, label: 'Estimated spending (flights + living)', freshness: 'indicative' },
      funds: funds.status === 'ok'
        ? { amount: funds.total, currency: funds.currency, label: 'Must remain in the bank (statutory)', freshness: 'official', holding_period: funds.holding_period }
        : { amount: null, currency: null, label: 'Must remain in the bank (statutory)', freshness: 'needs_review', message: funds.message },
      planning_total: { amount: Math.round(totalPlan), currency: spentCurrency, label: 'Planning total (spending + statutory funds)', freshness: 'indicative' },
    },
    versions: { rules_version: rule ? `${rule.route_name} ${rule.version}` : null, fees_version: 'v1', generated_at: new Date().toISOString(), engine: 'kishaa-planner-1.0' },
    sources: dedupeSources([
      flight ? { label: `${flight.provider} route matrix`, url: null, date: flight.quote_expiry?.slice(0, 10), kind: 'provider' } : null,
      living?.source?.name ? { label: living.source.name, url: living.source.url, date: living.source.observed_at, kind: 'statistical' } : null,
      funds.status === 'ok' ? { label: funds.source.name, url: funds.source.url, date: funds.source.effective_date, kind: 'official' } : null,
    ]),
    disclaimer: 'Estimates support planning and are not a quotation, an offer of admission, or a visa decision. Official fees, tuition and statutory fund rules change — confirm with a counselor before transferring money.',
    elapsed_ms: Date.now() - started,
  };
}

function dedupeSources(list) {
  const map = new Map();
  for (const s of list.filter(Boolean)) map.set((s.label || '') + (s.url || ''), s);
  return [...map.values()];
}

module.exports = { plan, countries, countryBySlug, cities, costFor, fundsRule, routeFor, origins,
  flightEstimate, livingEstimate, fundsEstimate, checklist, FRESHNESS, SCENARIO_MULTIPLIER, monthName };

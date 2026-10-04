'use strict';
/**
 * Kishaa International — Supabase Client & Data Layer
 * Connects the platform to Supabase PostgreSQL (cloud) with automatic fallback
 * to local SQLite when Supabase is not configured.
 */
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || '';

let client = null;

function isAvailable() {
  return Boolean(SUPABASE_URL && SUPABASE_KEY && SUPABASE_URL.startsWith('https://'));
}

function getClient() {
  if (!isAvailable()) return null;
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false },
    });
  }
  return client;
}

// ---------------------------------------------------------------------------
// Queries & Helpers
// ---------------------------------------------------------------------------

async function getPrograms(pillar) {
  const sb = getClient();
  let query = sb.from('programs').select('*').eq('status', 'published').order('sort_order', { ascending: true }).order('id', { ascending: true });
  if (pillar) {
    query = query.eq('pillar', pillar);
  }
  const { data, error } = await query;
  if (error) {
    console.error('[supabase:getPrograms]', error.message);
    return null;
  }
  return data;
}

async function getFeaturedPrograms() {
  const sb = getClient();
  const { data, error } = await sb.from('programs')
    .select('*')
    .eq('status', 'published')
    .eq('featured', 1)
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true });
  if (error) {
    console.error('[supabase:getFeaturedPrograms]', error.message);
    return null;
  }
  return data;
}

async function getCountries() {
  const sb = getClient();
  const { data, error } = await sb.from('countries')
    .select('*')
    .eq('published', 1)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });
  if (error) {
    console.error('[supabase:getCountries]', error.message);
    return null;
  }
  return data;
}

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

async function getCountryBySlug(slug) {
  const sb = getClient();
  const s = String(slug || '').toLowerCase().trim();
  const target = SLUG_ALIASES[s] || s;
  const { data, error } = await sb.from('countries')
    .select('*')
    .or(`slug.eq.${s},slug.eq.${target}`)
    .eq('published', 1)
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error('[supabase:getCountryBySlug]', error.message);
    return null;
  }
  return data;
}

async function getCountryCosts(countryId) {
  const sb = getClient();
  const { data, error } = await sb.from('country_costs').select('*').eq('country_id', countryId);
  if (error) {
    console.error('[supabase:getCountryCosts]', error.message);
    return [];
  }
  return data || [];
}

async function getFundsRule(countryId) {
  const sb = getClient();
  const { data, error } = await sb.from('funds_rules')
    .select('*')
    .eq('country_id', countryId)
    .eq('published', 1)
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error('[supabase:getFundsRule]', error.message);
    return null;
  }
  return data;
}

async function getFlightRoutes(destCountryId) {
  const sb = getClient();
  const { data, error } = await sb.from('flight_routes')
    .select('*')
    .eq('dest_country_id', destCountryId)
    .order('base_fare', { ascending: true });
  if (error) {
    console.error('[supabase:getFlightRoutes]', error.message);
    return [];
  }
  return data || [];
}

async function getTeamMembers() {
  const sb = getClient();
  const { data, error } = await sb.from('team')
    .select('*')
    .eq('is_public', 1)
    .order('sort_order', { ascending: true });
  if (error) {
    console.error('[supabase:getTeamMembers]', error.message);
    return null;
  }
  return data;
}

async function getTeamMemberBySlug(slug) {
  const sb = getClient();
  const { data, error } = await sb.from('team')
    .select('*')
    .eq('slug', slug)
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error('[supabase:getTeamMemberBySlug]', error.message);
    return null;
  }
  return data;
}

async function getTestimonials() {
  const sb = getClient();
  const { data, error } = await sb.from('testimonials')
    .select('*')
    .or('status.eq.approved,status.eq.published')
    .order('featured', { ascending: false })
    .order('id', { ascending: false });
  if (error) {
    console.error('[supabase:getTestimonials]', error.message);
    return null;
  }
  return data;
}

async function getReviewCache() {
  const sb = getClient();
  const { data, error } = await sb.from('review_cache')
    .select('*')
    .eq('display_state', 'shown')
    .order('published_at', { ascending: false });
  if (error) {
    console.error('[supabase:getReviewCache]', error.message);
    return null;
  }
  return data;
}

async function getReviewAggregates() {
  const sb = getClient();
  const { data, error } = await sb.from('review_aggregates').select('*');
  if (error) {
    console.error('[supabase:getReviewAggregates]', error.message);
    return null;
  }
  return data;
}

async function getFeeds(platform, limit = 30) {
  const sb = getClient();
  let query = sb.from('feed_cache')
    .select('*')
    .eq('display_state', 'shown')
    .order('published_at', { ascending: false })
    .limit(limit);
  if (platform) {
    query = query.eq('platform', platform);
  }
  const { data, error } = await query;
  if (error) {
    console.error('[supabase:getFeeds]', error.message);
    return null;
  }
  return data;
}

async function upsertFeedItem(item) {
  const sb = getClient();
  if (!sb) return null;
  const { data, error } = await sb.from('feed_cache').upsert(item, { onConflict: 'platform,external_id' }).select();
  if (error) {
    console.error('[supabase:upsertFeedItem]', error.message);
    return null;
  }
  return data;
}

async function getFaqs(category) {
  const sb = getClient();
  let query = sb.from('faqs').select('*').eq('published', 1).order('sort_order', { ascending: true }).order('id', { ascending: true });
  if (category) {
    query = query.eq('category', category);
  }
  const { data, error } = await query;
  if (error) {
    console.error('[supabase:getFaqs]', error.message);
    return null;
  }
  return data;
}

async function getPosts() {
  const sb = getClient();
  const { data, error } = await sb.from('posts')
    .select('*, categories(name), media:cover_media_id(id, filename)')
    .eq('status', 'published')
    .order('publish_at', { ascending: false });
  if (error) {
    const fallback = await sb.from('posts').select('*').eq('status', 'published').order('publish_at', { ascending: false });
    return fallback.data || null;
  }
  return data;
}

async function getPostBySlug(slug) {
  const sb = getClient();
  const { data, error } = await sb.from('posts')
    .select('*, categories(name), media:cover_media_id(id, filename)')
    .eq('slug', slug)
    .limit(1)
    .maybeSingle();
  if (error) {
    const fallback = await sb.from('posts').select('*').eq('slug', slug).limit(1).maybeSingle();
    return fallback.data || null;
  }
  return data;
}

async function getPageBySlug(slug) {
  const sb = getClient();
  const { data, error } = await sb.from('pages')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .is('deleted_at', null)
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error('[supabase:getPageBySlug]', error.message);
    return null;
  }
  return data;
}

async function insertLead(leadData) {
  const sb = getClient();
  if (!sb) return null;

  // Check idempotency
  if (leadData.idempotency_key) {
    const { data: existing } = await sb.from('leads')
      .select('id, reference')
      .eq('idempotency_key', leadData.idempotency_key)
      .limit(1)
      .maybeSingle();
    if (existing) {
      return { id: existing.id, reference: existing.reference, duplicate: true };
    }
  }

  const { data, error } = await sb.from('leads').insert(leadData).select().single();
  if (error) {
    console.error('[supabase:insertLead]', error.message);
    throw new Error(error.message);
  }

  // Activity log
  if (data?.id) {
    try {
      await sb.from('lead_activities').insert({
        lead_id: data.id,
        actor_name: 'System',
        type: 'created',
        note: `Enquiry captured on ${leadData.source_page || '/'}. Interest: ${leadData.interest}.`,
        new_stage: 'new',
      });
    } catch (actErr) {
      console.warn('[supabase:lead_activities]', actErr.message);
    }
  }

  return { ...data, duplicate: false };
}

async function insertAudit(actorName, action, entity, entityId, meta, ip) {
  const sb = getClient();
  if (!sb) return;
  try {
    await sb.from('audit_log').insert({
      actor: actorName || 'system',
      action,
      entity: entity || null,
      entity_id: entityId != null ? String(entityId) : null,
      meta: JSON.stringify(meta || {}),
      ip: ip || null,
    });
  } catch (e) {
    console.warn('[supabase:audit]', e.message);
  }
}

module.exports = {
  isAvailable,
  getClient,
  getPrograms,
  getFeaturedPrograms,
  getCountries,
  getCountryBySlug,
  getCountryCosts,
  getFundsRule,
  getFlightRoutes,
  getTeamMembers,
  getTeamMemberBySlug,
  getTestimonials,
  getReviewCache,
  getReviewAggregates,
  getFeeds,
  upsertFeedItem,
  getFaqs,
  getPosts,
  getPostBySlug,
  getPageBySlug,
  insertLead,
  insertAudit,
};

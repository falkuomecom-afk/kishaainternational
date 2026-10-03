'use strict';
/**
 * COMPOSIO SYNC SERVICE — Kishaa International
 * Fetches verified live feeds (Instagram and Facebook) and reviews via Composio MCP connection.
 * Caches items in SQLite (feed_cache / review_cache) for zero-latency, high-availability public rendering.
 */
require('dotenv').config();
const { db } = require('./db');
const supabase = require('./supabase');

const COMPOSIO_ENDPOINT = 'https://connect.composio.dev/mcp';
const FB_PAGE_ID = process.env.FB_PAGE_ID || '287203676427581'; // Kishaa International Facebook Page

async function callComposioTool(toolSlug, args = {}) {
  const apiKey = process.env.COMPOSIO_API_KEY;
  if (!apiKey) {
    throw new Error('COMPOSIO_API_KEY is not defined in environment.');
  }

  const response = await fetch(COMPOSIO_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: 'COMPOSIO_MULTI_EXECUTE_TOOL',
        arguments: {
          sync_response_to_workbench: false,
          tools: [
            {
              tool_slug: toolSlug,
              arguments: args,
            },
          ],
        },
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Composio API error ${response.status}: ${errText}`);
  }

  const text = await response.text();
  let parsedResult = null;

  for (const line of text.split('\n')) {
    if (line.startsWith('data: ')) {
      try {
        const json = JSON.parse(line.slice(6));
        const toolOutput = json?.result?.content?.[0]?.text;
        if (toolOutput) {
          parsedResult = JSON.parse(toolOutput);
        }
      } catch (e) {
        // continue parsing
      }
    }
  }

  if (!parsedResult) {
    throw new Error('Failed to parse tool execution response from Composio stream.');
  }

  const resultItem = parsedResult?.data?.results?.[0];
  if (resultItem?.error) {
    throw new Error(`Tool execution error: ${resultItem.error}`);
  }

  return resultItem?.response?.data || {};
}

function formatDate(isoOrTs) {
  if (!isoOrTs) return new Date().toISOString().slice(0, 19).replace('T', ' ');
  try {
    const d = new Date(isoOrTs);
    if (isNaN(d.getTime())) return new Date().toISOString().slice(0, 19).replace('T', ' ');
    return d.toISOString().slice(0, 19).replace('T', ' ');
  } catch {
    return new Date().toISOString().slice(0, 19).replace('T', ' ');
  }
}

/** Sync real Instagram posts & reels from Kishaa International account */
async function syncInstagram() {
  console.log('🔄 Fetching Instagram feed from Composio (@kishaainternational)...');
  const data = await callComposioTool('INSTAGRAM_GET_IG_USER_MEDIA', {
    ig_user_id: 'me',
    limit: 15,
  });

  const mediaList = data.data || [];
  console.log(`📸 Retrieved ${mediaList.length} Instagram media items.`);

  const upsert = db.prepare(`
    INSERT INTO feed_cache (
      platform, external_id, kind, caption, media_url, thumb_url,
      permalink, published_at, retrieved_at, display_state, pinned, tags, is_sample
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), 'shown', 0, ?, 0)
    ON CONFLICT(platform, external_id) DO UPDATE SET
      kind = excluded.kind,
      caption = excluded.caption,
      media_url = excluded.media_url,
      thumb_url = excluded.thumb_url,
      permalink = excluded.permalink,
      published_at = excluded.published_at,
      retrieved_at = datetime('now'),
      is_sample = 0
  `);

  let count = 0;
  for (const item of mediaList) {
    const isVideo = item.media_type === 'VIDEO' || (item.permalink && item.permalink.includes('/reel/'));
    const kind = isVideo ? 'reel' : 'post';
    const thumb = item.thumbnail_url || (item.media_type !== 'VIDEO' ? item.media_url : null);
    const media = item.media_url || item.thumbnail_url;
    const caption = item.caption || (isVideo ? 'Watch our latest reel on Instagram' : 'Kishaa International update');
    const pubAt = formatDate(item.timestamp);
    const tags = JSON.stringify(['#KishaaInternational', isVideo ? '#Reels' : '#Admissions']);

    upsert.run(
      'instagram',
      String(item.id),
      kind,
      caption,
      media,
      thumb,
      item.permalink || 'https://www.instagram.com/kishaainternational',
      pubAt,
      tags
    );

    if (supabase.isAvailable()) {
      await supabase.upsertFeedItem({
        platform: 'instagram',
        external_id: String(item.id),
        kind,
        caption,
        media_url: media,
        thumb_url: thumb,
        permalink: item.permalink || 'https://www.instagram.com/kishaainternational',
        published_at: pubAt,
        tags,
        display_state: 'shown',
        is_sample: 0,
      });
    }

    count++;
  }

  return { ok: true, count };
}

/** Sync real Facebook posts from Kishaa International Page */
async function syncFacebook() {
  console.log(`🔄 Fetching Facebook posts from Composio (Page ID: ${FB_PAGE_ID})...`);
  const data = await callComposioTool('FACEBOOK_GET_PAGE_POSTS', {
    page_id: FB_PAGE_ID,
    limit: 15,
  });

  const posts = data.data || [];
  console.log(`📘 Retrieved ${posts.length} Facebook posts.`);

  const upsert = db.prepare(`
    INSERT INTO feed_cache (
      platform, external_id, kind, caption, media_url, thumb_url,
      permalink, published_at, retrieved_at, display_state, pinned, tags, is_sample
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), 'shown', 0, ?, 0)
    ON CONFLICT(platform, external_id) DO UPDATE SET
      kind = excluded.kind,
      caption = excluded.caption,
      media_url = excluded.media_url,
      thumb_url = excluded.thumb_url,
      permalink = excluded.permalink,
      published_at = excluded.published_at,
      retrieved_at = datetime('now'),
      is_sample = 0
  `);

  let count = 0;
  for (const post of posts) {
    const atts = post.attachments?.data?.[0];
    const isVideo = atts?.type === 'video_inline' || (atts?.media?.source && atts.media.source.includes('.mp4'));
    const kind = isVideo ? 'video' : 'post';
    const thumb = atts?.media?.image?.src || null;
    const media = atts?.media?.source || atts?.media?.image?.src || null;
    const caption = post.message || post.story || 'Kishaa International Official Update';
    const pubAt = formatDate(post.created_time);
    const tags = JSON.stringify(['#KishaaInternational', '#FacebookUpdate']);

    upsert.run(
      'facebook',
      String(post.id),
      kind,
      caption,
      media,
      thumb,
      post.permalink_url || `https://www.facebook.com/${FB_PAGE_ID}`,
      pubAt,
      tags
    );

    if (supabase.isAvailable()) {
      await supabase.upsertFeedItem({
        platform: 'facebook',
        external_id: String(post.id),
        kind,
        caption,
        media_url: media,
        thumb_url: thumb,
        permalink: post.permalink_url || `https://www.facebook.com/${FB_PAGE_ID}`,
        published_at: pubAt,
        tags,
        display_state: 'shown',
        is_sample: 0,
      });
    }

    count++;
  }

  return { ok: true, count };
}

/** Run complete Composio sync */
async function syncAll() {
  const results = { instagram: null, facebook: null, errors: [] };

  try {
    results.instagram = await syncInstagram();
    db.prepare(`
      INSERT INTO integrations (provider, kind, status, mode, token_status, last_sync_at, notes)
      VALUES ('instagram', 'feeds', 'connected', 'live', 'valid', datetime('now'), 'Live sync active via Composio (@kishaainternational)')
      ON CONFLICT(provider) DO UPDATE SET
        status = 'connected', mode = 'live', token_status = 'valid',
        last_sync_at = datetime('now'), notes = 'Live sync active via Composio (@kishaainternational)'
    `).run();
  } catch (err) {
    console.error('❌ Instagram sync failed:', err.message);
    results.errors.push({ provider: 'instagram', error: err.message });
  }

  try {
    results.facebook = await syncFacebook();
    db.prepare(`
      INSERT INTO integrations (provider, kind, status, mode, token_status, last_sync_at, notes)
      VALUES ('facebook', 'feeds', 'connected', 'live', 'valid', datetime('now'), 'Live sync active via Composio (Page ID: ${FB_PAGE_ID})')
      ON CONFLICT(provider) DO UPDATE SET
        status = 'connected', mode = 'live', token_status = 'valid',
        last_sync_at = datetime('now'), notes = 'Live sync active via Composio (Page ID: ${FB_PAGE_ID})'
    `).run();
  } catch (err) {
    console.error('❌ Facebook sync failed:', err.message);
    results.errors.push({ provider: 'facebook', error: err.message });
  }

  // Update Composio provider record in integrations
  db.prepare(`
    INSERT INTO integrations (provider, kind, status, mode, token_status, last_sync_at, notes)
    VALUES ('composio', 'automation', 'connected', 'live', 'valid', datetime('now'), 'Composio API connection authenticated and syncing feeds.')
    ON CONFLICT(provider) DO UPDATE SET
      status = 'connected', mode = 'live', token_status = 'valid',
      last_sync_at = datetime('now'), notes = 'Composio API connection authenticated and syncing feeds.'
  `).run();

  // Keep Google Business & Trustpilot ready in integrations table
  db.prepare(`
    INSERT INTO integrations (provider, kind, status, mode, token_status, notes)
    VALUES ('google', 'reviews', 'not_connected', 'cache', 'pending', 'Ready for Google Business Profile connection')
    ON CONFLICT(provider) DO NOTHING
  `).run();

  db.prepare(`
    INSERT INTO integrations (provider, kind, status, mode, token_status, notes)
    VALUES ('trustpilot', 'reviews', 'not_connected', 'cache', 'pending', 'Ready for Trustpilot profile connection')
    ON CONFLICT(provider) DO NOTHING
  `).run();

  return results;
}

if (require.main === module) {
  syncAll()
    .then((res) => {
      console.log('✅ Composio sync complete:', JSON.stringify(res, null, 2));
      process.exit(0);
    })
    .catch((err) => {
      console.error('Fatal sync error:', err);
      process.exit(1);
    });
}

module.exports = { syncAll, syncInstagram, syncFacebook, callComposioTool };

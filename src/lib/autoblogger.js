'use strict';
/**
 * AUTONOMOUS NICHE AUTOBLOGGER ENGINE — Kishaa International
 * -----------------------------------------------------------
 * Fully autonomous publishing engine tailored to Kishaa International's exact niche:
 * - Study Abroad (UK 2027 Intakes, Canada, Germany, Italy, Finland, Georgia MBBS, Australia)
 * - Immigration & Visit Visas (Canada 10-Yr Multiple Entry, UAE Golden/Green Visa, Schengen)
 * - Statutory Proof of Funds (UKVI 28-day rule, IRCC CAD 20,635, Germany Sperrkonto €11,904)
 * - Cambridge English & IELTS Academic (Band 6.5 to 7.5 roadmaps, MOI exemptions)
 *
 * For every post, it automatically:
 * 1. Derives an EEAT, rank-ready article via Qwen MaaS with live search enabled.
 * 2. Synthesizes a photorealistic 16:9 cover image via DashScope `qwen-image-plus`.
 * 3. Uploads the image buffer directly to Supabase Storage ('media' bucket).
 * 4. Registers the image in the CMS Media Library and links it as the post thumbnail.
 * 5. Publishes to local SQLite and syncs to Supabase cloud PostgreSQL.
 */
require('dotenv').config();
const { db, q, audit, searchReindex } = require('./db');
const H = require('./helpers');
const supabase = require('./supabase');
const qwenImage = require('./qwen-image');

const QWEN_API_KEY = process.env.QWEN_API_KEY || process.env.DASHSCOPE_API_KEY;
const QWEN_API_URL = 'https://maas.qwencloudapi.com/compatible-mode/v1/chat/completions';

// Rotating Niche Topic Pool for Kishaa International
const NICHE_TOPIC_POOL = [
  {
    topic: 'Canada Student Visa 2026: Proof of Funds CAD $20,635, GIC & Cost of Living Matrix',
    pillar: 'resources',
    category: 'Student Visas',
    targetQuery: 'canada student visa proof of funds 2026 gic cost',
  },
  {
    topic: 'UKVI 28-Day Rule 2026: Maintenance Funds for London vs Outer London (£1,483 vs £1,136)',
    pillar: 'resources',
    category: 'Bank Statements',
    targetQuery: 'ukvi 28 day rule student visa maintenance funds 2026',
  },
  {
    topic: 'Germany Blocked Account (Sperrkonto) 2026: €11,904 Statutory Requirement & Monthly Payouts',
    pillar: 'resources',
    category: 'Bank Statements',
    targetQuery: 'germany blocked account sperrkonto amount 2026',
  },
  {
    topic: 'UAE Golden Visa 2026: AED 30,000 Salary Route, Property Investment & GDRFA Application Process',
    pillar: 'immigration',
    category: 'Immigration & Visas',
    targetQuery: 'uae golden visa salary requirements 2026 dubai gdrfa',
  },
  {
    topic: 'Italy DSU & Regional Scholarships 2026: €3,600 Year-1 Route vs Full Tuition Waiver',
    pillar: 'career',
    category: 'Scholarships',
    targetQuery: 'italy dsu scholarship eligibility for pakistani students 2026',
  },
  {
    topic: 'Canada 10-Year Multiple Entry Visit Visa: IRCC Invitation Letter, Bank Statement & Filing Checklist',
    pillar: 'immigration',
    category: 'Visit Visas',
    targetQuery: 'canada 10 year visit visa requirements bank statement timeline 2026',
  },
  {
    topic: 'Finland Student Residence Permit: Why €9,600 Covers You and Your Family (Migri Guidelines 2026)',
    pillar: 'resources',
    category: 'Student Visas',
    targetQuery: 'finland student residence permit 9600 euros family dependants',
  },
  {
    topic: 'Australia Subclass 500 Genuine Student (GS) Requirement & AUD $29,710 Financial Capacity',
    pillar: 'resources',
    category: 'Student Visas',
    targetQuery: 'australia subclass 500 genuine student requirement financial capacity 2026',
  },
  {
    topic: 'Georgia MBBS & BDS for International Students: Low Tuition, Recognition & Study Gap Acceptance',
    pillar: 'career',
    category: 'Medical Admissions',
    targetQuery: 'georgia mbbs tuition fees recognition study gaps pakistani students 2026',
  },
  {
    topic: 'How to Move from Band 6.5 to 7.5 in IELTS Academic: Writing Task 2 & Speaking Fluency Roadmap',
    pillar: 'cambridge',
    category: 'IELTS & Cambridge',
    targetQuery: 'how to score 7.5 in ielts academic writing task 2 speaking',
  },
  {
    topic: 'Schengen Business & Tourist Visas: The 4-Pillar Documentation Strategy to Avoid Rejections',
    pillar: 'immigration',
    category: 'Visit Visas',
    targetQuery: 'schengen visa rejection reasons and how to avoid them 2026',
  },
  {
    topic: 'Medium of Instruction (MOI) Certificate for European Universities: Which Countries Accept It Without IELTS?',
    pillar: 'cambridge',
    category: 'IELTS & Cambridge',
    targetQuery: 'medium of instruction moi certificate accepted universities europe uk 2026',
  },
];

/**
 * Find or create a category in SQLite & Supabase.
 */
async function resolveCategory(categoryName) {
  let cat = db.prepare('SELECT id, name FROM categories WHERE LOWER(name) = LOWER(?)').get(categoryName);
  if (!cat) {
    const slug = H.slugify(categoryName);
    const info = db.prepare('INSERT INTO categories (name, slug) VALUES (?, ?)').run(categoryName, slug);
    cat = { id: info.lastInsertRowid, name: categoryName };

    // Sync to Supabase
    const sb = supabase.getClient();
    if (sb) {
      try {
        await sb.from('categories').upsert({ name: categoryName, slug }, { onConflict: 'slug' });
      } catch (e) {
        console.warn('[autoblogger:categorySync]', e.message);
      }
    }
  }
  return cat;
}

/**
 * Determine the next topic to write about that doesn't already have an identical slug.
 */
function getNextTopic() {
  const existingSlugs = new Set(db.prepare('SELECT slug FROM posts').all().map(r => r.slug));

  for (const item of NICHE_TOPIC_POOL) {
    const anticipatedSlug = H.slugify(item.topic.slice(0, 50));
    let match = false;
    for (const slug of existingSlugs) {
      if (slug.includes(anticipatedSlug.slice(0, 20))) {
        match = true;
        break;
      }
    }
    if (!match) return item;
  }

  // If all pool topics are published, pick the oldest one and generate a fresh angle
  const random = NICHE_TOPIC_POOL[Math.floor(Math.random() * NICHE_TOPIC_POOL.length)];
  return {
    ...random,
    topic: `${random.topic} — 2026/2027 Policy Updates`,
  };
}

/**
 * Generate EEAT article structure via Qwen MaaS API with search enabled.
 */
async function generateArticleContent(topicObj) {
  if (!QWEN_API_KEY) {
    throw new Error('QWEN_API_KEY or DASHSCOPE_API_KEY is not configured in environment.');
  }

  const systemPrompt = `You are the Senior Immigration Counsel & Lead Editorial Director at Kishaa International (founded by Zeb Khan).
Kishaa International is a licensed international education and immigration consultancy with offices in Islamabad, Lahore, London, and Dubai.

Your task is to write an exhaustive, authoritative, Google EEAT-optimized guide for the topic provided.
The guide MUST:
1. Provide an Answer-First summary (40–60 words) immediately stating the exact statutory figures, effective rules, and legal authorities (e.g. IRCC, UKVI, BAföG, Migri, GDRFA).
2. Include 4 to 6 scannable Key Takeaways.
3. Feature rich semantic HTML in the body with:
   - <h2> and <h3> section headings
   - A clean regulatory comparison or breakdown <table> with <thead> and <tbody>
   - Concrete statutory figures (currencies, timelines, document checklists)
   - An expert commentary block quoting Zeb Khan (CEO & Chief Consultant of Kishaa International) advising candidates on risk management and file preparation.
4. Supply an ultra-detailed, photorealistic prompt for a 16:9 widescreen editorial image suitable for Alibaba Cloud qwen-image-plus (NO text overlays, professional photography, cinematic lighting, realistic human subjects or modern university/airport architecture).

Respond ONLY with a valid JSON object matching this structure:
{
  "title": "Comprehensive SEO Title (max 70 chars)",
  "slug": "url-friendly-slug-without-special-characters",
  "excerpt": "Compelling 1-2 sentence overview for cards and social snippets (140-180 chars)",
  "answer_summary": "40-60 words concise answer directly stating the exact figures and statutory rules",
  "geo_summary": "Named entities, jurisdictions, authorities (e.g. IRCC Canada, UKVI London, Berlin BAföG, Dubai GDRFA)",
  "key_takeaways": [
    "Takeaway 1 with exact figure",
    "Takeaway 2 with timeline",
    "Takeaway 3 with compliance warning",
    "Takeaway 4 with counselor recommendation"
  ],
  "body": "Full HTML body with <h2>, <h3>, <p>, <table>, <ul>, and <blockquote> quoting Zeb Khan",
  "seo_title": "Search engine title (< 60 chars)",
  "seo_description": "Meta description with call-to-action (140-158 chars)",
  "target_query": "primary search query",
  "primary_pillar": "resources | immigration | career | cambridge",
  "category_name": "Category name",
  "tags": ["tag1", "tag2", "tag3", "tag4"],
  "image_prompt": "Ultra-detailed photorealistic prompt for 16:9 editorial photography representing the topic without any text overlays"
}`;

  const userPrompt = `Topic to write about: "${topicObj.topic}"
Pillar: ${topicObj.pillar || 'resources'}
Category: ${topicObj.category || 'Guides'}
Target Query: ${topicObj.targetQuery || topicObj.topic}

Generate the complete EEAT guide with statutory compliance details and a photorealistic 16:9 image prompt now.`;

  console.log(`🤖 Requesting EEAT post generation from Qwen MaaS for: "${topicObj.topic}"`);

  const res = await fetch(QWEN_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${QWEN_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'qwen-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      enable_search: true,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Qwen MaaS error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const rawContent = data?.choices?.[0]?.message?.content;
  if (!rawContent) {
    throw new Error('Empty response from Qwen MaaS.');
  }

  try {
    return JSON.parse(rawContent);
  } catch (err) {
    const cleaned = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  }
}

/**
 * Execute a complete Autoblog run:
 * 1. Generate post content via Qwen
 * 2. Synthesize 16:9 image via DashScope qwen-image-plus
 * 3. Upload image to Supabase Storage and register in media library
 * 4. Insert post into SQLite and Supabase cloud tables with cover image and thumbnail
 * 5. Reindex search and audit
 */
async function publishDailyPost(options = {}) {
  const startTime = Date.now();
  console.log('🚀 [Autoblogger] Starting automated post publication...');

  // 1. Resolve Topic
  const topicObj = options.topic
    ? { topic: options.topic, pillar: options.pillar || 'resources', category: options.category || 'Guides', targetQuery: options.targetQuery || options.topic }
    : getNextTopic();

  console.log(`📝 [Autoblogger] Target Topic: "${topicObj.topic}"`);

  // 2. Generate Content with Qwen
  const postData = await generateArticleContent(topicObj);

  const title = postData.title || topicObj.topic;
  let slug = H.slugify(postData.slug || title);

  // Check if slug exists in SQLite, append timestamp if duplicate
  const existing = db.prepare('SELECT id FROM posts WHERE slug = ?').get(slug);
  if (existing) {
    slug = `${slug}-${Date.now().toString().slice(-4)}`;
  }

  // 3. Resolve Category
  const cat = await resolveCategory(postData.category_name || topicObj.category || 'Guides');

  // 4. Automatically Synthesize 16:9 Cover Image & Upload to Supabase Storage
  let mediaRecord = null;
  const adminUser = db.prepare("SELECT id, name FROM users WHERE role IN ('administrator', 'admin', 'content_editor') LIMIT 1").get()
    || db.prepare("SELECT id, name FROM users LIMIT 1").get()
    || { id: null, name: 'Operations Administrator' };
  const authorId = adminUser.id;

  const imagePrompt = postData.image_prompt ||
    `Editorial photorealistic wide angle shot of international students in front of university campus, soft cinematic lighting, 8k resolution, documentary photography`;

  console.log(`🎨 [Autoblogger] Synthesizing cover image with prompt: "${imagePrompt.slice(0, 70)}..."`);
  try {
    mediaRecord = await qwenImage.generateAndSaveImage(imagePrompt, {
      folder: 'guides',
      size: '1664*928',
      user: adminUser,
    });
    console.log(`✅ [Autoblogger] Image generated & stored! Media ID: ${mediaRecord.mediaId}, Storage URL: ${mediaRecord.publicUrl || mediaRecord.url}`);
  } catch (imgErr) {
    console.warn(`⚠️ [Autoblogger] Image generation failed, proceeding with fallback:`, imgErr.message);
  }

  const coverMediaId = mediaRecord?.mediaId || null;
  const coverImage = mediaRecord?.publicUrl || (mediaRecord?.filename ? `/uploads/${mediaRecord.filename}` : null);

  // 5. Calculate Read Minutes
  const words = (postData.body || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  const readMinutes = Math.max(3, Math.ceil(words / 200));

  // 6. Insert Post into SQLite

  const insertStmt = db.prepare(`
    INSERT INTO posts (
      title, slug, excerpt, body, category_id, tags, cover_media_id,
      cover_image, author_id, reviewer_id, status, publish_at,
      read_minutes, answer_summary, key_takeaways, seo_title,
      seo_description, target_query, geo_summary, primary_pillar
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', datetime('now'), ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const info = insertStmt.run(
    title,
    slug,
    postData.excerpt || '',
    postData.body || '',
    cat.id,
    JSON.stringify(postData.tags || []),
    coverMediaId,
    coverImage,
    authorId,
    authorId,
    readMinutes,
    postData.answer_summary || '',
    JSON.stringify(postData.key_takeaways || []),
    postData.seo_title || title.slice(0, 60),
    postData.seo_description || (postData.excerpt || '').slice(0, 155),
    postData.target_query || topicObj.targetQuery || '',
    postData.geo_summary || '',
    postData.primary_pillar || topicObj.pillar || 'resources'
  );

  const postId = info.lastInsertRowid;
  console.log(`💾 [Autoblogger] Saved post to SQLite with ID: ${postId} (slug: /resources/${slug})`);

  // 7. Sync to Supabase Cloud PostgreSQL
  const sb = supabase.getClient();
  let sbPostId = null;
  if (sb) {
    try {
      // Resolve category ID in Supabase cloud
      const catSlug = H.slugify(postData.category_name || topicObj.category || 'Guides');
      let sbCatId = null;
      const { data: existingCat } = await sb.from('categories').select('id').eq('slug', catSlug).maybeSingle();
      if (existingCat?.id) {
        sbCatId = existingCat.id;
      } else {
        const { data: createdCat } = await sb.from('categories').insert({ name: postData.category_name || topicObj.category || 'Guides', slug: catSlug }).select('id').maybeSingle();
        sbCatId = createdCat?.id || 1;
      }

      const { data: sbPost, error: sbErr } = await sb.from('posts').upsert({
        title,
        slug,
        excerpt: postData.excerpt || '',
        body: postData.body || '',
        category_id: sbCatId || 1,
        tags: JSON.stringify(postData.tags || []),
        cover_media_id: mediaRecord?.sbMediaId || null,
        status: 'published',
        publish_at: new Date().toISOString(),
        read_minutes: readMinutes,
        answer_summary: postData.answer_summary || '',
        key_takeaways: JSON.stringify(postData.key_takeaways || []),
        seo_title: postData.seo_title || title.slice(0, 60),
        seo_description: postData.seo_description || (postData.excerpt || '').slice(0, 155),
        target_query: postData.target_query || topicObj.targetQuery || '',
        geo_summary: postData.geo_summary || '',
        primary_pillar: postData.primary_pillar || topicObj.pillar || 'resources',
      }, { onConflict: 'slug' }).select().single();

      if (sbErr) {
        console.warn('⚠️ [Autoblogger] Supabase cloud post sync warning:', sbErr.message);
      } else {
        sbPostId = sbPost?.id;
        console.log(`☁️ [Autoblogger] Synced post to Supabase cloud! Cloud ID: ${sbPostId}`);
      }
    } catch (sbEx) {
      console.warn('⚠️ [Autoblogger] Supabase cloud sync error:', sbEx.message);
    }
  }

  // 8. Re-index search and audit
  try {
    searchReindex('post', postId, title, postData.body, `/resources/${slug}`);
    audit(
      { id: authorId, name: 'Autoblogger AI' },
      'autoblog.publish',
      'posts',
      postId,
      { title, slug, coverMediaId, coverImage, durationMs: Date.now() - startTime }
    );
  } catch (e) {
    console.warn('[Autoblogger] Audit/Search warning:', e.message);
  }

  return {
    ok: true,
    postId,
    sbPostId,
    title,
    slug,
    url: `/resources/${slug}`,
    coverImage,
    coverMediaId,
    readMinutes,
    durationMs: Date.now() - startTime,
    postData,
  };
}

/**
 * Returns the current status of the Autoblogger, schedule, and recent posts.
 */
function getAutobloggerStatus() {
  let recentPosts = [];
  try {
    recentPosts = db.prepare(`
      SELECT p.id, p.title, p.slug, p.publish_at, p.cover_media_id, p.cover_image, p.views,
             m.filename, m.public_url
      FROM posts p
      LEFT JOIN media m ON m.id = p.cover_media_id
      ORDER BY p.id DESC
      LIMIT 6
    `).all();
  } catch (e) {
    console.warn('[Autoblogger] recentPosts query error:', e.message);
  }

  const today = new Date().toISOString().slice(0, 10);
  const todayPost = recentPosts.find(p => p.publish_at && p.publish_at.startsWith(today));

  return {
    active: true,
    publishedToday: Boolean(todayPost),
    todayPost: todayPost ? { id: todayPost.id, title: todayPost.title, slug: todayPost.slug } : null,
    nextTopic: getNextTopic(),
    topicPoolSize: NICHE_TOPIC_POOL.length,
    recentPosts: recentPosts.map(p => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      publishAt: p.publish_at,
      coverUrl: p.cover_image || (p.public_url ? p.public_url : (p.filename ? `/uploads/${p.filename}` : null)),
      views: p.views || 0,
    })),
  };
}

module.exports = {
  publishDailyPost,
  generateArticleContent,
  getAutobloggerStatus,
  getNextTopic,
  NICHE_TOPIC_POOL,
};

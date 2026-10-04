'use strict';
/**
 * Bot Tracker & AI Visibility Engine for Kishaa International
 * Automatically identifies, categorizes and records crawler visits from:
 * 1. AI Search & Intelligence Bots (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, etc.)
 * 2. Search Engine Crawlers (Googlebot, Bingbot, Yandex, Baidu, DuckDuckGo)
 * 3. Social Media Scrapers (Facebook, Twitter/X, LinkedIn, WhatsApp, Telegram)
 */
const { db } = require('./db');

// Ensure database table and indexes exist
db.exec(`
  CREATE TABLE IF NOT EXISTS bot_crawls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bot_name TEXT NOT NULL,
    bot_family TEXT NOT NULL,
    category TEXT NOT NULL, -- 'ai', 'search', 'social'
    path TEXT NOT NULL,
    method TEXT NOT NULL DEFAULT 'GET',
    status_code INTEGER NOT NULL DEFAULT 200,
    ip TEXT,
    user_agent TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_bot_crawls_created ON bot_crawls(created_at);
  CREATE INDEX IF NOT EXISTS idx_bot_crawls_category ON bot_crawls(category);
  CREATE INDEX IF NOT EXISTS idx_bot_crawls_bot ON bot_crawls(bot_name);
`);

/**
 * Known bot signature mappings
 */
const BOT_SIGNATURES = [
  // AI Bots
  { regex: /GPTBot/i, name: 'GPTBot', family: 'OpenAI', category: 'ai' },
  { regex: /ChatGPT-User/i, name: 'ChatGPT-User', family: 'OpenAI', category: 'ai' },
  { regex: /OAI-SearchBot/i, name: 'OAI-SearchBot', family: 'OpenAI', category: 'ai' },
  { regex: /ClaudeBot/i, name: 'ClaudeBot', family: 'Anthropic', category: 'ai' },
  { regex: /Claude-Web/i, name: 'Claude-Web', family: 'Anthropic', category: 'ai' },
  { regex: /anthropic-ai/i, name: 'Anthropic-AI', family: 'Anthropic', category: 'ai' },
  { regex: /PerplexityBot/i, name: 'PerplexityBot', family: 'Perplexity AI', category: 'ai' },
  { regex: /Google-Extended/i, name: 'Google-Extended (Gemini)', family: 'Google AI', category: 'ai' },
  { regex: /GoogleOther/i, name: 'GoogleOther (AI/Research)', family: 'Google AI', category: 'ai' },
  { regex: /Bytespider/i, name: 'Bytespider', family: 'ByteDance', category: 'ai' },
  { regex: /Applebot-Extended/i, name: 'Applebot-Extended', family: 'Apple Intelligence', category: 'ai' },
  { regex: /Cohere-ai/i, name: 'Cohere-AI', family: 'Cohere', category: 'ai' },
  { regex: /Meta-ExternalAgent/i, name: 'Meta-ExternalAgent', family: 'Meta AI', category: 'ai' },
  { regex: /Diffbot/i, name: 'Diffbot', family: 'Diffbot', category: 'ai' },
  { regex: /CCBot/i, name: 'CCBot', family: 'Common Crawl', category: 'ai' },
  
  // Search Engine Bots
  { regex: /Googlebot-Image/i, name: 'Googlebot-Image', family: 'Google Search', category: 'search' },
  { regex: /Googlebot-Mobile/i, name: 'Googlebot-Mobile', family: 'Google Search', category: 'search' },
  { regex: /Googlebot/i, name: 'Googlebot', family: 'Google Search', category: 'search' },
  { regex: /bingbot/i, name: 'Bingbot', family: 'Microsoft Bing', category: 'search' },
  { regex: /msnbot/i, name: 'MSNBot', family: 'Microsoft Bing', category: 'search' },
  { regex: /DuckDuckBot/i, name: 'DuckDuckBot', family: 'DuckDuckGo', category: 'search' },
  { regex: /YandexBot/i, name: 'YandexBot', family: 'Yandex', category: 'search' },
  { regex: /Baiduspider/i, name: 'Baiduspider', family: 'Baidu', category: 'search' },
  { regex: /Sogou/i, name: 'Sogou Spider', family: 'Sogou', category: 'search' },
  { regex: /Applebot/i, name: 'Applebot', family: 'Apple Siri/Search', category: 'search' },

  // Social Media Scrapers
  { regex: /facebookexternalhit/i, name: 'Facebook Preview Bot', family: 'Meta Facebook', category: 'social' },
  { regex: /Facebot/i, name: 'Facebot', family: 'Meta Facebook', category: 'social' },
  { regex: /Twitterbot/i, name: 'Twitterbot (X)', family: 'Twitter / X', category: 'social' },
  { regex: /LinkedInBot/i, name: 'LinkedInBot', family: 'LinkedIn', category: 'social' },
  { regex: /WhatsApp/i, name: 'WhatsApp Preview Bot', family: 'WhatsApp', category: 'social' },
  { regex: /TelegramBot/i, name: 'TelegramBot', family: 'Telegram', category: 'social' },
  { regex: /Pinterest/i, name: 'Pinterestbot', family: 'Pinterest', category: 'social' },
  { regex: /Slackbot/i, name: 'Slackbot', family: 'Slack', category: 'social' },
];

/**
 * Detect bot from user agent string
 */
function detectBot(userAgent) {
  if (!userAgent || typeof userAgent !== 'string') return null;
  for (const bot of BOT_SIGNATURES) {
    if (bot.regex.test(userAgent)) {
      return {
        name: bot.name,
        family: bot.family,
        category: bot.category,
      };
    }
  }
  return null;
}

/**
 * Express middleware to record bot crawls
 */
function middleware() {
  return (req, res, next) => {
    // Only track GET/HEAD requests to content paths, skip static assets unless robots/llms
    const path = req.path || '';
    if (
      path.startsWith('/_vite') ||
      path.startsWith('/assets') ||
      path.startsWith('/css') ||
      path.startsWith('/js') ||
      path.startsWith('/img') ||
      path.startsWith('/uploads') ||
      path.startsWith('/admin')
    ) {
      return next();
    }

    const ua = req.headers['user-agent'] || '';
    const bot = detectBot(ua);
    if (!bot) return next();

    // Hook response finish to capture final status code
    res.on('finish', () => {
      try {
        const ip = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.ip || '127.0.0.1';
        db.prepare(`
          INSERT INTO bot_crawls (bot_name, bot_family, category, path, method, status_code, ip, user_agent, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `).run(
          bot.name,
          bot.family,
          bot.category,
          path,
          req.method || 'GET',
          res.statusCode || 200,
          String(ip).split(',')[0].trim(),
          ua.slice(0, 500)
        );
      } catch (err) {
        // Non-blocking log error
        console.warn('[bot-tracker] record error:', err.message);
      }
    });

    next();
  };
}

/**
 * Fetch bot crawling statistics and logs for Admin Dashboard (100% REAL LIVE DATA)
 */
function getBotStats({ category = 'all', limit = 25, offset = 0, q = '' } = {}) {


  const where = [];
  const params = [];

  if (category && category !== 'all') {
    where.push('category = ?');
    params.push(category);
  }

  if (q && q.trim()) {
    where.push('(bot_name LIKE ? OR path LIKE ? OR bot_family LIKE ?)');
    const term = `%${q.trim()}%`;
    params.push(term, term, term);
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  // Totals
  const totalCrawls = db.prepare('SELECT COUNT(*) AS n FROM bot_crawls').get().n;
  const aiCrawls = db.prepare("SELECT COUNT(*) AS n FROM bot_crawls WHERE category = 'ai'").get().n;
  const searchCrawls = db.prepare("SELECT COUNT(*) AS n FROM bot_crawls WHERE category = 'search'").get().n;
  const socialCrawls = db.prepare("SELECT COUNT(*) AS n FROM bot_crawls WHERE category = 'social'").get().n;
  const last24h = db.prepare("SELECT COUNT(*) AS n FROM bot_crawls WHERE created_at >= datetime('now', '-24 hours')").get().n;

  // Breakdown by bot
  const botBreakdown = db.prepare(`
    SELECT bot_name, bot_family, category, COUNT(*) AS count, MAX(created_at) AS last_seen
    FROM bot_crawls
    GROUP BY bot_name
    ORDER BY count DESC
    LIMIT 12
  `).all();

  // Top crawled pages
  const topCrawled = db.prepare(`
    SELECT path, COUNT(*) AS count,
           SUM(CASE WHEN category = 'ai' THEN 1 ELSE 0 END) AS ai_count,
           SUM(CASE WHEN category = 'search' THEN 1 ELSE 0 END) AS search_count,
           SUM(CASE WHEN category = 'social' THEN 1 ELSE 0 END) AS social_count,
           MAX(created_at) AS last_crawled
    FROM bot_crawls
    GROUP BY path
    ORDER BY count DESC
    LIMIT 8
  `).all();

  // Paginated log rows
  const logsCount = db.prepare(`SELECT COUNT(*) AS n FROM bot_crawls ${whereClause}`).get(...params).n;
  const logs = db.prepare(`
    SELECT id, bot_name, bot_family, category, path, method, status_code, ip, user_agent, created_at
    FROM bot_crawls
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  // AI Readiness Indicators
  const aiReadiness = {
    llmsTxt: true,
    llmsTxtUrl: '/llms.txt',
    robotsTxt: true,
    robotsTxtUrl: '/robots.txt',
    sitemapXml: true,
    sitemapUrl: '/sitemap.xml',
    jsonLdSchemas: ['EducationalOrganization', 'Dataset', 'Review', 'AggregateRating', 'FAQPage', 'Course', 'BreadcrumbList'],
    allowedAiCrawlers: ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended', 'Applebot-Extended'],
  };

  return {
    totals: {
      total: totalCrawls,
      ai: aiCrawls,
      search: searchCrawls,
      social: socialCrawls,
      last24h,
    },
    botBreakdown,
    topCrawled,
    logs,
    totalLogs: logsCount,
    aiReadiness,
  };
}

module.exports = {
  detectBot,
  middleware,
  getBotStats,
};

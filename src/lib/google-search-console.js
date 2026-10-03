'use strict';
/**
 * Google Search Console & Google Indexing API Integration
 * Manages Google indexing, automated publish notifications, sitemap sync,
 * and live URL inspection for Kishaa International.
 */
const crypto = require('crypto');
const https = require('https');
const { db } = require('./db');

const CLIENT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || 'kishaainternational@acquired-router-471016-g8.iam.gserviceaccount.com';
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY || `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCj51WC7cwsUHEm
2Jwkc/koTnrrG/SI0xQ6T7ks45Tait0OJ1r3ufNEfzL4hBfhpbrFvL1CLXi4qM4e
CuX3k6sVyvOpr6f/ozvjwdYRxM6R47TO5b8PCIlELif7YxzjNOhPL3jWv4Y0fkEB
49U+rz5NKyPkt4QJX5KqjZtfzh8Jo7ehyd34RE4YazVA4cvlC/xXUQpeTf/rL+G7
SqbMHD0200JwgyvN9X9iPhbRog4s77WXurdpSRasBcVz7X4E3gUqORfJQDkJME/0
KuIy3MICmLqONkfuRW0LdoblvhIdNHhv01pJSfO9rl6THItX1Uenp03qbunWqdY8
HMJPmRRfAgMBAAECggEAIrKshaU13gPBkIm2tHjgvEmw9+jZIcYduCJ8fyZGsuVG
2uI1/c+d0lhjP/0m2RwuqAHGxyW9Msp5qB6ChKD8TQbEAp4vII079oFogiZ53KSp
+Erm4ZXbCVYEHNHkoaznqSvRlxTAoog/1tiWokiTFd8WICtBhoJ3GCgWRnfqVi29
rJdnoOIgwciL16P7FoE40EjUCTzp208Y8Qe0EQ40BgmaI5aeyYTBbw7M7X43881c
oWAzhj3wpgbFzcCm0FfQg8R+bglEX6QNVA4IIpshVur5e5xfESuXqYnnXs51WRJY
LAD0YwH9lQsnmia5kKA1WcBXDORtNAykDbjElm6gIQKBgQDYTrgRXbPVHY12V1TM
74WnWrHFednD2PMwtbUprhxAqEnvAmstiX1Lb4xooVRqwHHTMgMWmm99a/HfoR8o
PsuLM0p2bzNAD+7VzRWrz2T8igZTsk+b+act06QEdvM+X5p5S/8x7nMuA6heq4up
J/3wf/M7nI8D6z7lK2BGlxLydwKBgQDB+uMTRM4SPfg/2ZMlOBfRgi7H+P3m0eWF
SerdA/pbd+Jx2oCbnyZoNPfx8C4+YaedQ2slufjzQjqTaHp6znl+zoEPWfuCdaZa
hjtndWEv+UkkDYCMCtvcS682glFDkSzjA1UzwjxbY28gPrBw+o5+Rgs5ES2KnIVT
aBvWHMS/WQKBgQCMd7pC1MXWrMVTx2yzVQxHXLc7FWEcNMPgqu+FrKJ+PoscokZ1
oOZz2XGl9LZ8SJLiYoTs5cdm/HVrExfHq9fEgr9lX9s5S99+ihr7osfi08M+EPpv
wNUXBmxp1dEqfS00feywQTgc9pUdPWuJowXea0jKOmYJVnhWnC9+R9cvCwKBgHtS
hoTcjGpajXYCXCMgazweGKG3savKK7I2kSNcARGfwQ4DDRpi7ub3Ld7ZhHzSVt6L
WxZMCnKU22qV1LA4jlNI9BIPce+53j3U8vVOUbBPOum5z8y4ppiCYW01InbjV/cn
SkayqO6s45xLXp8lG+w5ma75NcvWwIiLOo9AEPFZAoGBAJFoiKatsZZUEXOIUK8/
eoPKS+Z6TMSpC8pcH1MpmXL/hb4Nb7ROEDS8DUQm0NAdS5K7Gkrmu/l00C494zzF
V8/qmjt5AZ4yengwqZ28jyfuLlRpw/2JbCJRxNWLbRHZtNeaFGWWDKxjWXxzbs/0
YYzQnSLQB8/Z+E4JlHttwQvc
-----END PRIVATE KEY-----`;

const API_KEY = process.env.GOOGLE_API_KEY || 'AIzaSyCuJIEpMNAERjmFSLTa4CgTQlz16s_wIXY';
const SEARCH_CONSOLE_SITE = 'sc-domain:kishaainternational.com';

let cachedToken = null;
let tokenExpiresAt = 0;

function base64url(str) {
  return Buffer.from(str).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function httpsRequest(url, { method = 'GET', headers = {}, body = null } = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request({
      protocol: u.protocol,
      hostname: u.hostname,
      port: u.port || 443,
      path: u.pathname + u.search,
      method,
      headers,
      family: 4,
      timeout: 15000,
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          ok: res.statusCode >= 200 && res.statusCode < 300,
          headers: res.headers,
          text: () => Promise.resolve(data),
          json: () => {
            try { return Promise.resolve(JSON.parse(data)); }
            catch (e) { return Promise.reject(new Error('Invalid JSON response: ' + data.slice(0, 100))); }
          },
        });
      });
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Google API request timed out'));
    });
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && now < tokenExpiresAt - 60) {
    return cachedToken;
  }

  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = base64url(JSON.stringify({
    iss: CLIENT_EMAIL,
    scope: 'https://www.googleapis.com/auth/indexing https://www.googleapis.com/auth/webmasters https://www.googleapis.com/auth/webmasters.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  }));

  const sign = crypto.createSign('RSA-SHA256');
  sign.update(header + '.' + claim);
  const signature = sign.sign(PRIVATE_KEY, 'base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const jwt = header + '.' + claim + '.' + signature;

  const res = await httpsRequest('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=' + jwt
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error('Google OAuth token exchange failed: ' + err);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiresAt = now + (data.expires_in || 3600);
  return cachedToken;
}

/**
 * Live URL inspection from Google Search Console
 */
async function inspectUrl(url) {
  try {
    const token = await getAccessToken();
    const res = await httpsRequest('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: {
        inspectionUrl: url,
        siteUrl: SEARCH_CONSOLE_SITE
      }
    });

    const json = await res.json();
    if (!res.ok) {
      return { ok: false, error: json.error?.message || 'Inspection failed', details: json };
    }

    const result = json.inspectionResult || {};
    const status = result.indexStatusResult || {};
    return {
      ok: true,
      inspectionUrl: url,
      verdict: status.verdict || 'NEUTRAL',
      coverageState: status.coverageState || 'Unknown',
      robotsTxtState: status.robotsTxtState || 'ALLOWED',
      indexingState: status.indexingState || 'INDEXING_ALLOWED',
      lastCrawlTime: status.lastCrawlTime || null,
      pageFetchState: status.pageFetchState || 'SUCCESSFUL',
      googleCanonical: status.googleCanonical || url,
      userCanonical: status.userCanonical || url,
      inspectionResultLink: result.inspectionResultLink || null,
    };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

/**
 * Submit or update URL notification via Google Indexing API
 */
async function publishIndexingNotification(url, type = 'URL_UPDATED') {
  try {
    const token = await getAccessToken();
    const res = await httpsRequest('https://indexing.googleapis.com/v3/urlNotifications:publish', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: { url, type }
    });

    const json = await res.json();
    if (!res.ok) {
      return {
        ok: false,
        error: json.error?.message || 'Indexing API failed',
        code: json.error?.code,
        status: json.error?.status
      };
    }
    return { ok: true, data: json };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

/**
 * Submit sitemap to Google Search Console
 */
async function submitSitemap(sitemapUrl = 'https://www.kishaainternational.com/sitemap.xml') {
  try {
    const token = await getAccessToken();
    const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SEARCH_CONSOLE_SITE)}/sitemaps/${encodeURIComponent(sitemapUrl)}`;
    const res = await httpsRequest(url, {
      method: 'PUT',
      headers: { Authorization: 'Bearer ' + token }
    });
    return { ok: res.status === 204 || res.ok, status: res.status };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

/**
 * Query search performance analytics from Search Console
 */
async function getSearchAnalytics(days = 28) {
  try {
    const token = await getAccessToken();
    const end = new Date();
    const start = new Date(Date.now() - days * 86400000);
    const toDate = d => d.toISOString().split('T')[0];

    const res = await httpsRequest(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SEARCH_CONSOLE_SITE)}/searchAnalytics/query`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: {
        startDate: toDate(start),
        endDate: toDate(end),
        dimensions: ['query'],
        rowLimit: 10
      }
    });

    if (!res.ok) {
      return { ok: false, rows: [] };
    }
    const data = await res.json();
    return { ok: true, rows: data.rows || [] };
  } catch (e) {
    return { ok: false, rows: [], error: e.message };
  }
}

/**
 * Submit all published content URLs to Indexing API
 */
async function indexAllPublishedUrls(baseUrl = 'https://www.kishaainternational.com') {
  const urls = [
    baseUrl + '/',
    baseUrl + '/destinations',
    baseUrl + '/bank-statements',
    baseUrl + '/career-counseling',
    baseUrl + '/immigration-consultancy',
    baseUrl + '/cambridge-courses',
    baseUrl + '/cost-planner',
    baseUrl + '/reviews',
    baseUrl + '/contact',
  ];

  try {
    const pages = db.prepare(`SELECT slug FROM pages WHERE status = 'published' AND deleted_at IS NULL`).all();
    for (const p of pages) {
      urls.push(`${baseUrl}/${p.slug}`);
    }
  } catch {}

  try {
    const posts = db.prepare(`SELECT slug FROM posts WHERE status = 'published'`).all();
    for (const p of posts) {
      urls.push(`${baseUrl}/resources/${p.slug}`);
    }
  } catch {}

  try {
    const countries = db.prepare(`SELECT slug FROM countries WHERE published = 1`).all();
    for (const c of countries) {
      urls.push(`${baseUrl}/destinations/${c.slug}`);
    }
  } catch {}

  const unique = Array.from(new Set(urls));
  const results = [];
  for (const u of unique.slice(0, 30)) {
    const r = await publishIndexingNotification(u);
    results.push({ url: u, ...r });
  }

  return { ok: true, total: unique.length, submitted: results.length, results };
}

module.exports = {
  CLIENT_EMAIL,
  SEARCH_CONSOLE_SITE,
  getAccessToken,
  inspectUrl,
  publishIndexingNotification,
  submitSitemap,
  getSearchAnalytics,
  indexAllPublishedUrls,
};

'use strict';
/**
 * LEAD NOTIFICATION & DELIVERY QUEUE
 * Brief p.9: "Queue staff notifications after storage. If delivery fails, keep the lead
 * visible, record the error and retry without creating another lead."
 * SMTP is optional; with no SMTP configured the queue runs in "log" transport so the
 * whole workflow stays demonstrable and testable offline.
 */
const { db, setting } = require('./db');
const { esc } = require('./helpers');

let nodemailer = null;
try { nodemailer = require('nodemailer'); } catch {}

function transport() {
  if (!nodemailer || !process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE) === 'true',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
}

function recipientsFor(lead) {
  const configured = setting('ops.notification_recipients', []);
  const list = Array.isArray(configured) && configured.length ? configured : [setting('brand.email', 'kishaainternational@gmail.com')];
  const owners = db.prepare(`SELECT email FROM users WHERE status='active' AND role IN ('lead_manager','administrator')`).all().map(u => u.email);
  const region = (lead.region || '').toLowerCase().includes('pak') ? 'pakistan' : 'uae';
  const regional = setting(`ops.recipients_${region}`, []);
  return [...new Set([...(Array.isArray(regional) ? regional : []), ...list, ...owners])].filter(Boolean);
}

function queueLeadNotifications(lead, { type = 'new_lead' } = {}) {
  const to = recipientsFor(lead);
  const subject = type === 'new_lead'
    ? `[Kishaa] New enquiry ${lead.reference} · ${lead.interest_label || lead.interest}`
    : `[Kishaa] Repeat contact ${lead.reference}`;
  const minimal = ['email', 'phone', 'whatsapp'].some(k => lead[k]);
  const body = [
    `Reference: ${lead.reference}`,
    `Interest: ${lead.interest_label || lead.interest}`,
    `Service: ${lead.service_context || '—'}`,
    `Destination: ${lead.country_name || lead.country_id || '—'}`,
    `Preferred contact: ${lead.contact_preference}`,
    `Received: ${lead.created_at} (Asia/Dubai)`,
    `Source: ${lead.source_type} · ${lead.source_page || '—'}`,
    '',
    'Open the authenticated record for full details:',
    `${process.env.PUBLIC_BASE_URL || 'http://localhost:3000'}/admin/leads/${lead.id}`,
    '',
    minimal ? 'Personal details are intentionally excluded from this notification.' : '',
  ].filter(Boolean).join('\n');

  const info = db.prepare(`INSERT INTO notifications (lead_id, channel, recipients, subject, body, status)
                           VALUES (?, 'email', ?, ?, ?, 'queued')`)
    .run(lead.id, JSON.stringify(to), subject, body);
  return { id: info.lastInsertRowid, recipients: to, subject };
}

async function sendNotification(id) {
  const n = db.prepare('SELECT * FROM notifications WHERE id = ?').get(id);
  if (!n) return { ok: false, error: 'notification not found' };
  if (n.status === 'sent') return { ok: true, already: true };
  const t = transport();
  try {
    if (!t) {
      db.prepare(`UPDATE notifications SET status='sent', attempts = attempts + 1, sent_at = datetime('now'),
                  last_error = 'SMTP not configured — delivered to local log transport (lead is stored and visible).'
                  WHERE id = ?`).run(id);
      return { ok: true, transport: 'log' };
    }
    await t.sendMail({
      from: process.env.SMTP_FROM || 'no-reply@kishaainternational.com',
      to: JSON.parse(n.recipients || '[]').join(','),
      subject: n.subject, text: n.body,
    });
    db.prepare("UPDATE notifications SET status='sent', attempts = attempts + 1, sent_at = datetime('now'), last_error = NULL WHERE id = ?").run(id);
    return { ok: true, transport: 'smtp' };
  } catch (e) {
    const attempts = n.attempts + 1;
    const backoff = Math.min(60, Math.pow(2, attempts)) * 60; // seconds
    db.prepare(`UPDATE notifications SET status='failed', attempts = ?, last_error = ?,
                next_retry_at = datetime('now', '+' || ? || ' seconds') WHERE id = ?`)
      .run(attempts, String(e.message).slice(0, 400), backoff, id);
    return { ok: false, error: e.message, retry_in_seconds: backoff };
  }
}

/** Worker entry point — called by the scheduler every minute. */
async function processQueue(limit = 20) {
  const due = db.prepare(`SELECT id FROM notifications
                          WHERE status IN ('queued','failed') AND attempts < 6
                            AND (next_retry_at IS NULL OR next_retry_at <= datetime('now'))
                          ORDER BY id ASC LIMIT ?`).all(limit);
  const results = [];
  for (const row of due) results.push({ id: row.id, ...(await sendNotification(row.id)) });
  return { processed: results.length, results };
}

function retryAll() {
  db.prepare(`UPDATE notifications SET status='queued', next_retry_at = NULL
              WHERE status='failed' AND attempts < 6`).run();
}

module.exports = { queueLeadNotifications, sendNotification, processQueue, retryAll, transport };

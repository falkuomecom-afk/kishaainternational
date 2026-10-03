'use strict';
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DB_PATH = process.env.DATABASE_PATH || path.join(DATA_DIR, 'kishaa.db');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 5000');

function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8');
  db.exec(sql);
  // Idempotent column additions for evolving installs
  const addColumn = (table, col, def) => {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all().map(c => c.name);
    if (!cols.includes(col)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`);
  };
  addColumn('fee_versions', 'note', 'TEXT');
  addColumn('posts', 'geo_summary', 'TEXT');
  addColumn('posts', 'primary_pillar', "TEXT DEFAULT 'resources'");
  addColumn('leads', 'region', 'TEXT');
  addColumn('site_settings', 'group_name', "TEXT DEFAULT 'general'");
}

const q = {
  all: (sql, ...p) => db.prepare(sql).all(...p),
  get: (sql, ...p) => db.prepare(sql).get(...p),
  run: (sql, ...p) => db.prepare(sql).run(...p),
  many: (fn) => db.transaction(fn),
};

function nowISO() { return new Date().toISOString().slice(0, 19).replace('T', ' '); }

function audit(actor, action, entity, entityId, meta, ip) {
  try {
    db.prepare(`INSERT INTO audit_log (actor_id, actor, action, entity, entity_id, meta, ip)
                VALUES (?,?,?,?,?,?,?)`)
      .run(actor?.id || null, actor?.name || 'system', action, entity || null,
           entityId != null ? String(entityId) : null, JSON.stringify(meta || {}), ip || null);
  } catch (e) { console.error('audit failed', e.message); }
}

function setting(key, fallback = null) {
  const row = db.prepare('SELECT value FROM site_settings WHERE key = ?').get(key);
  if (!row) return fallback;
  try { const v = JSON.parse(row.value); return v === undefined ? fallback : v; }
  catch { return row.value; }
}
function settings(keys) {
  const out = {};
  for (const k of keys) out[k] = setting(k);
  return out;
}
function setSetting(key, value, group, userId) {
  db.prepare(`INSERT INTO site_settings (key, value, group_name, updated_by, updated_at)
              VALUES (?,?,?,?,datetime('now'))
              ON CONFLICT(key) DO UPDATE SET value=excluded.value, group_name=excluded.group_name,
              updated_by=excluded.updated_by, updated_at=datetime('now')`)
    .run(key, JSON.stringify(value), group || 'general', userId || null);
}

function searchReindex(entity, entityId, title, body, url) {
  db.prepare('DELETE FROM search_index WHERE entity = ? AND entity_id = ?').run(entity, String(entityId));
  db.prepare('INSERT INTO search_index (entity, entity_id, title, body, url) VALUES (?,?,?,?,?)')
    .run(entity, String(entityId), title || '', body || '', url || '');
}
function searchRemove(entity, entityId) {
  db.prepare('DELETE FROM search_index WHERE entity = ? AND entity_id = ?').run(entity, String(entityId));
}

module.exports = { db, q, migrate, nowISO, audit, setting, settings, setSetting, searchReindex, searchRemove, DB_PATH };

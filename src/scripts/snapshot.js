'use strict';
/**
 * Database snapshot utility.
 *
 *   npm run snapshot                → consistent copy into data/backups/
 *   npm run snapshot -- --keep 10   → keep only the 10 most recent snapshots
 *
 * Uses SQLite's VACUUM INTO, which produces a transactionally consistent copy
 * while the site keeps serving traffic.
 */
const fs = require('fs');
const path = require('path');
const { db, DB_PATH } = require('../lib/db');

const args = process.argv.slice(2);
const keepIdx = args.indexOf('--keep');
const keep = keepIdx >= 0 ? Number(args[keepIdx + 1]) || 10 : 10;

const dir = path.join(__dirname, '..', '..', 'data', 'backups');
fs.mkdirSync(dir, { recursive: true });

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const file = path.join(dir, `kishaa-${stamp}.db`);

db.prepare('VACUUM INTO ?').run(file);
const size = fs.statSync(file).size;

console.log(`✔ Snapshot written: ${path.relative(process.cwd(), file)} (${(size / 1024).toFixed(1)} KB)`);
console.log(`  Source database:  ${path.relative(process.cwd(), DB_PATH)}`);

const all = fs.readdirSync(dir).filter(f => f.startsWith('kishaa-') && f.endsWith('.db')).sort().reverse();
if (all.length > keep) {
  for (const old of all.slice(keep)) {
    fs.unlinkSync(path.join(dir, old));
    console.log(`  Removed old snapshot: ${old}`);
  }
}
console.log(`  Snapshots retained: ${Math.min(all.length, keep)}`);

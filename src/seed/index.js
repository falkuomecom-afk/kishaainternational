'use strict';
/** Main seeder — idempotent. Run with: npm run seed  (or node src/seed/index.js) */
require('dotenv').config();
const { db, migrate, setSetting, searchReindex } = require('../lib/db');
const { hashPassword } = require('../lib/auth');
const { slugify } = require('../lib/helpers');
const seedSettings = require('./settings');
const seedContent = require('./content');
const seedPages = require('./pages');
const seedPosts = require('./posts');
const seedTrust = require('./trust');

function alreadySeeded() {
  try { return db.prepare('SELECT COUNT(*) AS n FROM pages').get().n > 0; } catch { return false; }
}

function seed() {
  migrate();
  const force = process.argv.includes('--force');

  if (alreadySeeded() && !force) {
    const z = db.prepare('SELECT id FROM users WHERE email = ?').get('zeb@kishaainternational.com');
    if (!z) createUsers();
    if (db.prepare('SELECT COUNT(*) AS n FROM programs').get().n === 0) runContentSeed();
    reindex();
    console.log('✔ Database already contains content — seeder completed the missing pieces only.');
    return summary();
  }

  if (force) wipe();
  createUsers();
  runContentSeed();
  reindex();
  console.log('✔ Seed complete.');
  return summary();
}

function wipe() {
  // Order matters: children before parents so foreign keys never block a reset.
  const tables = ['lead_activities','consultations','notifications','autosaves','leads','page_revisions','post_revisions',
    'testimonials','review_cache','review_aggregates','feed_cache','country_costs','funds_rules','fee_versions',
    'flight_routes','quote_snapshots','estimate_snapshots','programs','countries','team','posts','categories',
    'pages','faqs','events','menus','redirects','forms','site_settings','integrations','jobs','audit_log',
    'analytics_events','search_index','sessions','users'];
  for (const t of tables) { try { db.prepare(`DELETE FROM ${t}`).run(); } catch {} }
  console.log('• Cleared existing data (--force).');
}

function createUsers() {
  const users = [
    { name: 'Zeb Khan', email: 'zeb@kishaainternational.com', password: 'Trainer#2026', role: 'trainer', team: 'Dubai HQ', phone: '+971 58 682 6099' },
    { name: 'Operations Administrator', email: 'admin@kishaainternational.com', password: 'Admin#2026', role: 'administrator', team: 'Dubai HQ', phone: '+971 58 682 6099' },
    { name: 'Lead Manager (Dubai)', email: 'leads@kishaainternational.com', password: 'Leads#2026', role: 'lead_manager', team: 'Dubai HQ', phone: '+971 58 682 6099' },
    { name: 'Lead Manager (Pakistan)', email: 'leads.pk@kishaainternational.com', password: 'LeadsPK#2026', role: 'lead_manager', team: 'Pakistan', phone: '+92 312 552 6099' },
    { name: 'Content Editor', email: 'editor@kishaainternational.com', password: 'Editor#2026', role: 'content_editor', team: 'Shared' },
    { name: 'Contributor Desk', email: 'contributor@kishaainternational.com', password: 'Write#2026', role: 'contributor', team: 'Shared' },
    { name: 'Rule Reviewer', email: 'rules@kishaainternational.com', password: 'Rules#2026', role: 'rule_reviewer', team: 'Shared' },
  ];
  const ins = db.prepare(`INSERT OR IGNORE INTO users (name, email, password_hash, role, team, phone, mfa_enabled)
                          VALUES (?,?,?,?,?,?,?)`);
  for (const u of users) ins.run(u.name, u.email, hashPassword(u.password), u.role, u.team, u.phone || null, 0);
  console.log(`• ${users.length} named staff accounts ready (one per role — no shared passwords).`);
  return users;
}

function runContentSeed() {
  seedSettings(setSetting);

  const ins = (table, obj) => {
    const keys = Object.keys(obj).filter(k => obj[k] !== undefined);
    return db.prepare(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`)
      .run(...keys.map(k => obj[k])).lastInsertRowid;
  };

  const ownerId = db.prepare("SELECT id FROM users WHERE role = 'administrator' ORDER BY id LIMIT 1").get()?.id || null;
  const ctx = { ins, ownerId };
  const contentCtx = seedContent(db);           // programs, countries, costs, funds rules, routes, menus, redirects
  Object.assign(ctx, contentCtx);
  const pageCtx = seedPages(db, ctx);           // pages + blocks
  Object.assign(ctx, pageCtx);
  const postIds = seedPosts(db, ctx);           // editorial guides
  const trust = seedTrust(db, ctx);             // reviews, feeds, testimonials, faqs, integrations

  seedSampleLeads(ctx);
  console.log(`• Content seeded: ${db.prepare('SELECT COUNT(*) AS n FROM programs').get().n} programs, ` +
    `${db.prepare('SELECT COUNT(*) AS n FROM countries').get().n} destinations, ` +
    `${db.prepare('SELECT COUNT(*) AS n FROM country_costs').get().n} city cost profiles, ` +
    `${db.prepare('SELECT COUNT(*) AS n FROM funds_rules').get().n} statutory rules, ` +
    `${db.prepare('SELECT COUNT(*) AS n FROM flight_routes').get().n} flight routes, ` +
    `${db.prepare('SELECT COUNT(*) AS n FROM pages').get().n} pages, ${postIds.length} guides, ` +
    `${trust.reviews} cached reviews, ${trust.feeds} feed items, ${trust.faqs} FAQs.`);
}

/** A realistic lead pipeline so the dashboard, follow-up queue and reporting are meaningful. */
function seedSampleLeads(ctx) {
  const existing = db.prepare('SELECT COUNT(*) AS n FROM leads').get().n;
  if (existing) return;
  const owners = db.prepare("SELECT id, name, team FROM users WHERE role IN ('lead_manager','trainer')").all();
  const dubai = owners.find(o => o.team === 'Dubai HQ') || owners[0];
  const pk = owners.find(o => o.team === 'Pakistan') || owners[0];
  const zeb = owners.find(o => o.name === 'Zeb Khan') || owners[0];
  const prog = (s) => db.prepare('SELECT id FROM programs WHERE slug = ?').get(s)?.id || null;
  const ctry = (s) => db.prepare('SELECT id FROM countries WHERE slug = ?').get(s)?.id || null;

  const leads = [
    ['Adnan Sheikh', '+971501234567', 'adnan.sheikh@example.ae', 'whatsapp', 'immigration', 'Canada 10-Year Visit Visa', dubai, 'qualified', 'canada',
      'Owns an import business in Deira. Has 2024 UK visit visa and 2025 Schengen. Six-month statements ready; wants to file before the winter season.', -2, 1],
    ['Hira Nawaz', '+923005551234', 'hira.nawaz@example.com', 'whatsapp', 'cambridge', 'IELTS Preparation — Academic', zeb, 'consultation', null,
      'Diagnostic 6.0 overall; needs 7.0 for a UK master’s application in January. Writing is the weakest skill (5.5).', -5, 2],
    ['Usman Raza', '+971529998877', 'usman.raza@example.ae', 'phone', 'career', 'UK University Admissions — 2027 Intakes', dubai, 'contacted', 'uk',
      'BSc Computer Science, 2.9 CGPA, budget up to £14,000. Asked about MOI acceptance and whether a gap year is a problem.', -1, 3],
    ['Sana Iqbal', '+923339998811', 'sana.iqbal@example.pk', 'email', 'career', 'Georgia Medical & Tech Programs', pk, 'new', 'georgia',
      'Pre-medical FSc with 78%. Wants MBBS; asked specifically about MCI recognition and whether the 2024 study gap matters.', 0, 0],
    ['Kashif Bhatti', '+971544443322', 'kashif.bhatti@example.ae', 'whatsapp', 'immigration', 'UAE Golden, Freelance & Family Visas', dubai, 'enrolled', 'uae',
      'Freelance permit plus family sponsorship for wife and two children. All attestation completed; filing scheduled.', -9, 4],
    ['Maryam Durrani', '+923214445566', 'maryam.d@example.pk', 'email', 'career', 'Italy English-Taught Degrees', pk, 'qualified', 'italy',
      'BBA graduate; family can evidence PKR 5.2M. Scholarship window closes early — needs dossier prepared urgently.', -3, 5],
    ['Tariq Mehmood', '+971567778899', 'tariq.m@example.ae', 'phone', 'immigration', 'Schengen, Serbia & Romania Work Pathways', dubai, 'contacted', null,
      'Asked about Romania work permit timeline. Employer offer received but contract does not state accommodation — advised to obtain it in writing before filing.', -2, 6],
    ['Areeba Malik', '+923027778899', 'areeba.malik@example.pk', 'whatsapp', 'cambridge', 'Corporate Professional English', zeb, 'consultation', null,
      'HR manager booking corporate training for a sales team of 18, needs an on-site proposal for their Karachi office.', -4, 7],
    ['Imran Qureshi', '+971501112233', 'imran.q@example.ae', 'whatsapp', 'immigration', 'Canada 10-Year Visit Visa', dubai, 'closed', 'canada',
      'Advised to wait two months and strengthen bank history rather than file immediately. Follow-up scheduled for the new year.', -14, 0, 'declined', 'Advising a delay to strengthen the file — not a refusal.'],
    ['Zainab Farooq', '+923451119988', 'zainab.f@example.pk', 'email', 'cambridge', 'Spoken English & Communication Skills', zeb, 'new', null,
      'Pharmacist, needs English confidence for hospital interviews in the UAE.', 0, 0],
  ];

  let i = 0;
  for (const [name, phone, email, pref, interest, service, owner, stage, country, note, dayOffset, followUpDays, closeReason, closeNote] of leads) {
    i++;
    const ref = `KI-2026-${String(1000 + i)}`;
    const created = new Date(Date.now() + dayOffset * 86400e3).toISOString().slice(0, 19).replace('T', ' ');
    const nextFollow = (stage === 'new' || stage === 'contacted' || stage === 'qualified' || stage === 'consultation')
      ? new Date(Date.now() + (followUpDays - 1) * 86400e3).toISOString().slice(0, 19).replace('T', ' ')
      : null;
    const id = db.prepare(`INSERT INTO leads (reference, full_name, phone, whatsapp, email, contact_preference,
        interest, service_context, program_id, country_id, requested_trainer, message, qualification, source_page,
        source_type, owner_id, stage, stage_reason, consent_notice_version, marketing_consent, region,
        first_response_at, next_follow_up_at, created_at, updated_at, closed_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      ref, name, phone, pref === 'whatsapp' ? phone : null, email, pref, interest, service,
      prog(slugForService(service)) || null, country ? ctry(country) : null,
      interest === 'cambridge' ? 'Zeb Khan' : null, note,
      JSON.stringify(interest === 'cambridge' ? { test_type: 'IELTS Academic', target_band: '7.0', planned_date: 'not decided', delivery: 'in-person' } : {}),
      '/contact', 'form', owner.id, stage, closeReason ? (closeNote || 'Closed') : null,
      'v1.2-2026-09', i % 4 === 0 ? 1 : 0, owner.team,
      ['contacted','qualified','consultation','enrolled','closed'].includes(stage)
        ? new Date(new Date(created).getTime() + 3 * 3600e3).toISOString().slice(0, 19).replace('T', ' ') : null,
      nextFollow, created, created, closeReason ? created : null).lastInsertRowid;

    db.prepare('INSERT INTO lead_activities (lead_id, actor_id, actor_name, type, note, new_stage, created_at) VALUES (?,?,?,?,?,?,?)')
      .run(id, null, 'Public form', 'system', 'Enquiry received and stored. Notification queued to the intake team.', 'new', created);
    if (stage !== 'new') {
      db.prepare('INSERT INTO lead_activities (lead_id, actor_id, actor_name, type, note, prior_stage, new_stage, created_at) VALUES (?,?,?,?,?,?,?,?)')
        .run(id, owner.id, owner.name, 'call', 'Contacted on the preferred channel. Interest and budget confirmed.', 'new', 'contacted',
          new Date(new Date(created).getTime() + 3 * 3600e3).toISOString().slice(0, 19).replace('T', ' '));
    }
    if (['qualified','consultation','enrolled','closed'].includes(stage)) {
      db.prepare('INSERT INTO lead_activities (lead_id, actor_id, actor_name, type, note, prior_stage, new_stage, created_at) VALUES (?,?,?,?,?,?,?,?)')
        .run(id, owner.id, owner.name, 'note', 'Qualification recorded: relevant need confirmed and a usable contact channel verified.', 'contacted', 'qualified',
          new Date(new Date(created).getTime() + 26 * 3600e3).toISOString().slice(0, 19).replace('T', ' '));
    }
    if (['consultation','enrolled'].includes(stage)) {
      const when = new Date(Date.now() + (i % 4 + 1) * 86400e3).toISOString().slice(0, 19).replace('T', ' ');
      db.prepare(`INSERT INTO consultations (lead_id, owner_id, mode, requested_at, confirmed_at, timezone, status, history)
                  VALUES (?,?,?,?,?,?,?,?)`).run(id, owner.id, i % 2 ? 'online' : 'in-person',
        new Date(new Date(created).getTime() + 30 * 3600e3).toISOString().slice(0, 19).replace('T', ' '), when, 'Asia/Dubai', 'confirmed',
        JSON.stringify([{ at: when, action: 'confirmed', by: owner.name }]));
      db.prepare('INSERT INTO lead_activities (lead_id, actor_id, actor_name, type, note, prior_stage, new_stage, follow_up_at, created_at) VALUES (?,?,?,?,?,?,?,?,?)')
        .run(id, owner.id, owner.name, 'consultation', 'Consultation confirmed with the client (Asia/Dubai timezone recorded).', 'qualified', 'consultation', when,
          new Date(new Date(created).getTime() + 31 * 3600e3).toISOString().slice(0, 19).replace('T', ' '));
    }
    if (stage === 'enrolled') {
      db.prepare('INSERT INTO lead_activities (lead_id, actor_id, actor_name, type, note, prior_stage, new_stage, created_at) VALUES (?,?,?,?,?,?,?,?)')
        .run(id, owner.id, owner.name, 'stage_change', 'Engagement confirmed and milestone schedule issued.', 'consultation', 'enrolled',
          new Date(new Date(created).getTime() + 50 * 3600e3).toISOString().slice(0, 19).replace('T', ' '));
    }
    db.prepare(`INSERT INTO notifications (lead_id, channel, recipients, subject, body, status, attempts, sent_at)
                VALUES (?, 'email', ?, ?, ?, 'sent', 1, ?)`).run(id, JSON.stringify([owner.email || 'kishaainternational@gmail.com']),
      `[Kishaa] New enquiry ${ref} · ${service}`, `Reference: ${ref}\nInterest: ${interest}\nDelivered to the intake queue.`, created);

    db.prepare(`INSERT INTO analytics_events (name, path, props, created_at) VALUES (?,?,?,?)`)
      .run('planner_estimate_generated', '/cost-planner', JSON.stringify({ country: country || 'uk', purpose: interest === 'immigration' ? 'visit' : 'study' }), created);
  }
  console.log(`• ${leads.length} sample leads seeded across the pipeline (new → contacted → qualified → consultation → enrolled → closed).`);
}

function slugForService(service) {
  const map = {
    'Canada 10-Year Visit Visa': 'canada-10-year-visit-visa',
    'IELTS Preparation — Academic': 'ielts-preparation',
    'UK University Admissions — 2027 Intakes': 'uk-admissions-2027',
    'Georgia Medical & Tech Programs': 'georgia-medical-tech',
    'UAE Golden, Freelance & Family Visas': 'uae-visas-pro-gdrfa',
    'Italy English-Taught Degrees': 'italy-funded-tuition',
    'Schengen, Serbia & Romania Work Pathways': 'europe-work-paths',
    'Corporate Professional English': 'corporate-english',
    'Spoken English & Communication Skills': 'spoken-english',
  };
  return map[service] || null;
}

function reindex() {
  try {
    db.prepare('DELETE FROM search_index').run();
    // Page bodies are stored as block JSON, so flatten them to plain text for the index.
    const flatten = (raw) => String(raw || '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/[{}"\[\],:]+/g, ' ')
      .replace(/\b[a-z_]+\b(?=\s)/g, (m) => m)
      .replace(/\s+/g, ' ').trim();
    for (const p of db.prepare("SELECT id, title, excerpt, blocks, slug FROM pages WHERE status = 'published'").all()) {
      const url = p.slug === 'home' ? '/' : '/' + p.slug;
      searchReindex('page', p.id, p.title, `${p.excerpt || ''} ${flatten(p.blocks)}`, url);
    }
    for (const p of db.prepare("SELECT id, name, summary, answer_summary, slug, highlights FROM programs WHERE status = 'published'").all()) {
      searchReindex('program', p.id, p.name, `${p.answer_summary || ''} ${p.summary || ''} ${p.highlights || ''}`, '/services/' + p.slug);
    }
    for (const c of db.prepare('SELECT id, name, summary, answer_summary, slug FROM countries WHERE published = 1').all()) {
      searchReindex('country', c.id, c.name, `${c.answer_summary || ''} ${c.summary || ''}`, '/destinations/' + c.slug);
    }
    for (const p of db.prepare("SELECT id, title, answer_summary, body, slug FROM posts WHERE status = 'published'").all()) {
      searchReindex('post', p.id, p.title, `${p.answer_summary || ''} ${String(p.body || '').replace(/<[^>]*>/g, ' ')}`, '/resources/' + p.slug);
    }
    for (const f of db.prepare('SELECT id, question, answer FROM faqs WHERE published = 1').all()) {
      searchReindex('faq', f.id, f.question, f.answer, '/faq');
    }
    for (const m of db.prepare('SELECT id, name, role_title, bio, intro, slug FROM team WHERE is_public = 1').all()) {
      searchReindex('team', m.id, m.name, `${m.role_title} ${m.intro || ''} ${m.bio || ''}`, '/team/' + m.slug);
    }
  } catch (e) { console.error('reindex warning:', e.message); }
}

function summary() {
  const counts = {};
  for (const t of ['pages','posts','programs','countries','funds_rules','country_costs','flight_routes','leads','review_cache','feed_cache','faqs','users']) {
    try { counts[t] = db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get().n; } catch { counts[t] = 0; }
  }
  return counts;
}

if (require.main === module) {
  const counts = seed();
  console.log('\nCounts:', counts);
  console.log('\nStaff sign-in (change these before any real deployment):');
  console.log('  Administrator     admin@kishaainternational.com / Admin#2026');
  console.log('  Lead Manager UAE  leads@kishaainternational.com / Leads#2026');
  console.log('  Content Editor    editor@kishaainternational.com / Editor#2026');
  console.log('  Trainer           zeb@kishaainternational.com  / Trainer#2026');
}
module.exports = { seed, reindex, createUsers };

'use strict';
/**
 * EEAT Pillar Blog Posts Seeder with AI Image Generation
 * ------------------------------------------------------
 * Generates photorealistic 16:9 cover images via `qwen-image-plus` and
 * inserts 4 authoritative, high-ranking guides into SQLite and Supabase.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { db } = require('../lib/db');
const supabase = require('../lib/supabase');
const { generateAndSaveImage } = require('../lib/qwen-image');

const POSTS = [
  {
    title: 'Canada 2026 Student Visa Proof of Funds & Living Costs: New IRCC Financial Guidelines Explained',
    slug: 'canada-student-visa-proof-of-funds-living-costs-2026',
    categorySlug: 'visa-immigration',
    readMinutes: 6,
    targetQuery: 'canada student visa proof of funds 2026 living costs ircc',
    seoTitle: 'Canada Student Visa Proof of Funds 2026: IRCC $20,635 Rule & Living Costs',
    seoDescription: 'Official 2026 IRCC proof-of-funds guidelines for Canada study permits: $20,635 CAD living funds, GIC procedures, tuition requirements, and city rent comparisons.',
    excerpt: 'Complete breakdown of the official IRCC $20,635 CAD proof-of-funds rule, GIC purchase procedure, provincial attestation letters (PAL), and actual Canadian living expenses for 2026 applicants.',
    answerSummary: 'Under current IRCC financial guidelines for 2026, single study permit applicants must demonstrate CAD $20,635 for living expenses in addition to their first-year tuition fees and return airfare. Funds are verified via a Guaranteed Investment Certificate (GIC) from an approved Canadian financial institution, seasoned bank statements, and a provincial attestation letter (PAL).',
    geoSummary: 'IRCC, Ottawa, Toronto, Vancouver, Montreal, GIC, Canada Study Permit, PAL, 2026',
    keyTakeaways: [
      'Statutory living funds requirement is CAD $20,635 for single applicants (excluding Quebec).',
      'First-year tuition must be paid in full or shown seasoned in a verified bank account for at least 4 months.',
      'GIC certificates must be issued by CDIC-insured banks (Scotiabank, CIBC, RBC, or ICICI Canada).',
      'Spouse and dependent additions require an extra CAD $5,055 and CAD $3,892 respectively.',
      'Provincial Attestation Letter (PAL) is mandatory for undergraduate applicants under the national cap.'
    ],
    imagePrompt: 'International university students walking through a beautiful Canadian university campus in autumn with golden and crimson maple leaves, holding Canadian passports and admission folders, modern architecture in background, 8k photorealistic, documentary cinematic lighting',
    body: `<h2>The 2026 IRCC Proof of Funds Standard</h2>
<p>In response to rising housing and living costs across Canada, Immigration, Refugees and Citizenship Canada (IRCC) updated the baseline financial threshold for international students. As of 2026, a single applicant must demonstrate a minimum of <strong>CAD $20,635</strong> in available living expenses — representing 75% of Statistics Canada's low-income cut-off (LICO) — alongside full first-year tuition fees and travel allowances.</p>

<div class="table-wrap">
  <table class="table">
    <thead>
      <tr><th>Applicant Category</th><th>Statutory Living Funds (CAD)</th><th>Monthly Living Allowance</th><th>First-Year Tuition</th></tr>
    </thead>
    <tbody>
      <tr><td><strong>Single Student</strong></td><td>CAD $20,635</td><td>~CAD $1,720 / month</td><td>CAD $15,000 – $38,000</td></tr>
      <tr><td><strong>Student + 1 Family Member (Spouse)</strong></td><td>CAD $25,690</td><td>~CAD $2,140 / month</td><td>As per DLI letter of acceptance</td></tr>
      <tr><td><strong>Student + 2 Family Members</strong></td><td>CAD $29,582</td><td>~CAD $2,465 / month</td><td>As per DLI letter of acceptance</td></tr>
      <tr><td><strong>Each Additional Dependent</strong></td><td>+ CAD $3,892</td><td>—</td><td>—</td></tr>
    </tbody>
  </table>
</div>

<h2>How to Secure and Prove Your Funds (The GIC System)</h2>
<p>For students applying under standard study permit streams or expedited student pathways, purchasing a <strong>Guaranteed Investment Certificate (GIC)</strong> of CAD $20,635 is the most reliable financial evidence. Approved financial institutions include Scotiabank, CIBC, RBC, BMO, and ICICI Bank Canada.</p>
<p>Upon arrival in Canada, students receive an initial disbursement (typically CAD $4,000 – $5,000) to cover upfront rental deposits and lease agreements, with the remaining balance paid out in equal monthly installments over 10 to 12 months.</p>

<h2>Real-World City Living Cost Comparison</h2>
<p>While IRCC enforces a uniform national standard, local rental and grocery expenses vary significantly by province and municipality:</p>
<ul>
  <li><strong>Toronto &amp; Greater Vancouver:</strong> Private 1-bedroom apartments range from $2,100 to $2,500/month. Shared student accommodation averages $900 – $1,250/month.</li>
  <li><strong>Montreal &amp; Ottawa:</strong> Shared housing costs typically range between $650 and $950/month, offering superior budget flexibility for international students.</li>
  <li><strong>Calgary &amp; Edmonton (Alberta):</strong> High employment growth and lower provincial sales taxes make average student room rentals $700 – $950/month.</li>
</ul>

<h2>Work Rights &amp; Off-Campus Employment in 2026</h2>
<p>IRCC has established a permanent off-campus working cap of <strong>24 hours per week</strong> during regular academic terms, increasing to full-time (up to 40 hours) during scheduled academic breaks, winter holidays, and summer sessions. Minimum wages across provinces currently range from CAD $15.00 to $17.30 per hour, allowing students to earn between $1,400 and $1,650 gross per month to offset daily living costs.</p>

<h2>Expert Advisory from Zeb Khan (British Council Certified Trainer)</h2>
<blockquote>
  <p>"The single most common ground for Canadian study permit refusals is financial credibility. Officers scrutinize unexplained lump-sum deposits made shortly before application filing. Every dollar must be accompanied by a traceable tax return, business ledger, or audited gift deed. At Kishaa International, we conduct a pre-filing funds audit to ensure your bank certificate withstands IRCC verification."</p>
</blockquote>`
  },
  {
    title: 'UK Student Visa (2027 Intakes): London vs Outer London Living Expenses & Maintenance Funds Guide',
    slug: 'uk-student-visa-london-vs-outer-london-living-expenses-2027',
    categorySlug: 'study-abroad',
    readMinutes: 6,
    targetQuery: 'uk student visa living costs 2027 maintenance funds london ukvi',
    seoTitle: 'UK Student Visa Maintenance Funds 2027: London vs Outer London Rates & 28-Day Rule',
    seoDescription: 'UKVI statutory maintenance funds requirements for 2027 intakes: £1,483/month in London vs £1,136/month outer London, the strict 28-day holding rule, and CAS tuition deposits.',
    excerpt: 'Official UKVI 2026/2027 maintenance funds rates: £1,483/month inside London vs £1,136/month outer London, the strict 28-day holding rule, CAS deposit requirements, and MOI admissions.',
    answerSummary: 'For the UK 2027 intake, UKVI requires £1,483 per month (up to 9 months, totaling £13,347) for study in Greater London, and £1,136 per month (£10,224 total) outside London, plus unpaid course fees. Funds must be held continuously for a minimum 28-day seasoning period in a regulated financial institution before CAS visa filing.',
    geoSummary: 'UKVI, Home Office, London, Manchester, Birmingham, Edinburgh, CAS, UK Student Visa, 2027',
    keyTakeaways: [
      'Inner London maintenance requirement is £13,347 (£1,483/month for 9 months).',
      'Outer London / regional maintenance requirement is £10,224 (£1,136/month for 9 months).',
      'The 28-day rule is absolute: the closing balance must not dip below the required threshold for even one day.',
      'Partner universities accepting MOI (Medium of Instruction) letters eliminate the need for IELTS.',
      'Initial university tuition deposits typically range from £4,000 to £6,500, deducted directly from your CAS fee.'
    ],
    imagePrompt: 'Diverse group of postgraduate students walking past a grand historic red-brick British university building in Oxford and London with clock tower and green courtyards, bright autumn sunlight, photorealistic 8K, architectural documentary style',
    body: `<h2>UKVI Financial Requirements for 2027 Intakes</h2>
<p>International students planning for the 2027 intakes at UK partner universities must comply with the financial maintenance guidelines stipulated by the UK Home Office (UKVI). The required funds depend entirely on whether your university campus is classified as inside Greater London or in outer London and regional areas.</p>

<div class="table-wrap">
  <table class="table">
    <thead>
      <tr><th>Study Location</th><th>Monthly UKVI Benchmark</th><th>Total Living Funds (9 Months Max)</th><th>Typical Tuition Deposit</th></tr>
    </thead>
    <tbody>
      <tr><td><strong>Inner London (Greater London)</strong></td><td>£1,483 / month</td><td><strong>£13,347</strong></td><td>£4,000 – £6,500</td></tr>
      <tr><td><strong>Outer London &amp; Rest of UK</strong></td><td>£1,136 / month</td><td><strong>£10,224</strong></td><td>£4,000 – £5,500</td></tr>
    </tbody>
  </table>
</div>

<h2>The Strict 28-Day Holding Rule</h2>
<p>UKVI enforces a rigorous 28-day holding requirement. The total maintenance funds plus any outstanding first-year tuition balance must be maintained in an acceptable financial institution for a consecutive 28-day period ending no more than 31 days prior to visa application submission.</p>
<ul>
  <li><strong>Acceptable Account Types:</strong> Personal savings or current accounts in the student's name or their legal parent/guardian's name (accompanied by birth certificate and consent affidavit).</li>
  <li><strong>Critical Compliance Rule:</strong> If the balance drops below the required sum for even a single hour during the 28 days, UKVI will issue an automatic mandatory refusal.</li>
</ul>

<h2>MOI Admissions (No IELTS) for 2027</h2>
<p>Many Pakistani and international candidates with an English-medium degree can secure unconditional admission to over 25 UK partner universities without taking the IELTS exam, utilizing an official <strong>Medium of Instruction (MOI)</strong> certificate issued by their degree-granting institution. Kishaa International maintains direct partnerships with participating universities offering MOI waivers, internal university English assessments, and scholarships up to £5,000.</p>

<h2>Graduate Route (Post-Study Work Rights)</h2>
<p>Upon completing an eligible undergraduate or master's program, international graduates are entitled to apply for the <strong>2-year Graduate Route visa</strong> (3 years for PhD holders), granting unencumbered employment rights in the UK without employer sponsorship.</p>`
  },
  {
    title: 'Germany Blocked Account (Sperrkonto) 2026: €11,904 Statutory Requirement & Monthly Payouts',
    slug: 'germany-blocked-account-sperrkonto-statutory-requirement-2026',
    categorySlug: 'cost-planning',
    readMinutes: 5,
    targetQuery: 'germany blocked account sperrkonto 2026 11904 expatrio coracle fintiba',
    seoTitle: 'Germany Blocked Account 2026: €11,904 Sperrkonto Requirement & Monthly Payouts',
    seoDescription: 'Complete 2026 guide to Germany blocked account (Sperrkonto): €11,904 statutory deposit, €992/month payout, provider comparison (Expatrio, Coracle, Fintiba), and free tuition routes.',
    excerpt: 'The official BAföG statutory benchmark for Germany student visas requires €11,904 in a Sperrkonto (€992/month). Compare Expatrio, Coracle, and Fintiba with health insurance bundles.',
    answerSummary: 'Germany\'s Federal Foreign Office requires international students to deposit €11,904 into an approved blocked account (Sperrkonto) for the 2026/2027 academic year. This releases €992 per month to cover living expenses, health insurance, and semester contributions across German public universities.',
    geoSummary: 'Germany, Berlin, Munich, Sperrkonto, BAföG, Expatrio, Coracle, Fintiba, 2026',
    keyTakeaways: [
      'Statutory blocked amount is €11,904 (€992 per month for 12 months).',
      'Public university tuition in Germany remains €0 (free) in most federal states, with only a €150–€350 semester fee.',
      'Approved providers include Expatrio, Coracle, and Fintiba with integrated public health insurance (TK/Barmer).',
      'Students are legally permitted to work 140 full days or 280 half days per calendar year.',
      'Blocked accounts must be opened and funded prior to your German embassy / VFS visa appointment.'
    ],
    imagePrompt: 'Modern university lecture hall and glass library in Germany with students working on laptops and study materials, clean German architectural design, morning light, photorealistic 8K',
    body: `<h2>Germany's Sperrkonto Rule Explained</h2>
<p>Germany remains one of the world's most attractive higher education destinations because public universities across almost all 16 federal states charge <strong>€0 tuition fees</strong> for international students. To guarantee that students can sustain themselves without public assistance, the German government mandates proof of funds through a <strong>Blocked Account (Sperrkonto)</strong>.</p>
<p>In accordance with the 29th BAföG amendment, the annual statutory amount is <strong>€11,904</strong> (€992 per month) for the 2026/2027 academic year.</p>

<div class="table-wrap">
  <table class="table">
    <thead>
      <tr><th>Blocked Account Provider</th><th>Account Opening Fee</th><th>Monthly Maintenance</th><th>Health Insurance Integration</th></tr>
    </thead>
    <tbody>
      <tr><td><strong>Expatrio (Value Package)</strong></td><td>€49 (often refunded)</td><td>€5 / month</td><td>TK / Techniker Krankenkasse</td></tr>
      <tr><td><strong>Coracle (Prime Package)</strong></td><td>€59 flat</td><td>€0 (no monthly fee)</td><td>Barmer / TK public insurance</td></tr>
      <tr><td><strong>Fintiba (Plus Package)</strong></td><td>€89</td><td>€4.90 / month</td><td>DAK / Barmer health bundle</td></tr>
    </tbody>
  </table>
</div>

<h2>What Does the Monthly €992 Cover?</h2>
<p>International students in cities like Munich, Frankfurt, Berlin, and Hamburg budget their monthly disbursement across the following necessities:</p>
<ul>
  <li><strong>Student Dormitory / WG (Shared Flat):</strong> €350 – €550 / month</li>
  <li><strong>Mandatory Public Health Insurance:</strong> ~€125 – €135 / month</li>
  <li><strong>Food &amp; Groceries:</strong> €200 – €250 / month</li>
  <li><strong>Semester Ticket (Public Transit):</strong> Included in semester contribution (€25 – €40/month amortized)</li>
</ul>

<h2>Working Rights for International Students</h2>
<p>Students can work <strong>140 full days or 280 half days</strong> per year under standard student visa rules. With Germany's statutory minimum wage at €12.41+ per hour, part-time student employment ("Werkstudent") frequently yields €800 to €1,200 per month, allowing students to cover ongoing expenses after their first year.</p>`
  },
  {
    title: 'UAE Golden Visa & Green Visa 2026: Salary Criteria, Property Investment & GDRFA Filing',
    slug: 'uae-golden-visa-green-visa-salary-property-criteria-2026',
    categorySlug: 'visa-immigration',
    readMinutes: 6,
    targetQuery: 'uae golden visa requirements 2026 salary criteria 30000 gdrfa icp property',
    seoTitle: 'UAE Golden Visa 2026 Requirements: AED 30,000 Salary, Real Estate & GDRFA Filing',
    seoDescription: 'Complete 2026 guide to UAE 10-year Golden Visas: AED 30,000 professional salary rule, AED 2M property criteria, family sponsorship, and Dubai GDRFA application steps.',
    excerpt: 'The definitive 2026 guide to UAE 10-Year Golden Visas and 5-Year Green Visas: AED 30,000 professional salary criteria, AED 2M real estate pathways, freelance permits, and ICP/GDRFA documentation.',
    answerSummary: 'The UAE 10-Year Golden Visa is granted to skilled professionals with an attested bachelor degree and a minimum basic salary of AED 30,000/month under MOHRE category 1 or 2, as well as property investors with AED 2,000,000 in real estate equity. Applications are processed through GDRFA (Dubai) or ICP (Abu Dhabi and Northern Emirates).',
    geoSummary: 'UAE, Dubai, Abu Dhabi, Golden Visa, GDRFA, ICP, MOHRE, Emirates ID, 2026',
    keyTakeaways: [
      'Skilled professional category requires AED 30,000 monthly salary and attested degree.',
      'Real estate Golden Visa requires AED 2 Million property valuation (off-plan and mortgaged accepted with bank NOC).',
      'Golden Visa holders can stay outside the UAE for more than 6 months without invalidating residency.',
      'Sponsorship extends to spouses, children of any age, and domestic helpers with no maximum limit.',
      'Freelance Green Visas offer 5-year residency with AED 15,000 monthly income evidence and freelance permit.'
    ],
    imagePrompt: 'Executive boardroom overlooking the Dubai skyline with Burj Khalifa and modern skyscrapers, business professionals in sharp tailored suits examining residency documents and gold visa card, cinematic luxury lighting, 8k photorealistic',
    body: `<h2>UAE Golden Visa Overview &amp; 2026 Criteria</h2>
<p>The UAE 10-Year Golden Visa represents one of the world's most sought-after long-term residency frameworks. It provides 100% foreign ownership, freedom from national sponsor requirements, and exemption from the traditional requirement to re-enter the UAE every six months to keep residency active.</p>

<div class="table-wrap">
  <table class="table">
    <thead>
      <tr><th>Residency Stream</th><th>Minimum Requirement</th><th>Validity</th><th>Key Documentation Required</th></tr>
    </thead>
    <tbody>
      <tr><td><strong>Skilled Professionals</strong></td><td>AED 30,000 / month salary</td><td>10 Years</td><td>MOHRE contract, 6-month bank statements, MOFA attested degree</td></tr>
      <tr><td><strong>Real Estate Investors</strong></td><td>AED 2,000,000 property value</td><td>10 Years</td><td>Title deed from Dubai Land Department (DLD) or equivalent</td></tr>
      <tr><td><strong>Entrepreneurs &amp; Tech Founders</strong></td><td>AED 500,000 project or incubator approval</td><td>5–10 Years</td><td>Auditor financial statement, Ministry of Economy approval</td></tr>
      <tr><td><strong>Green Visa (Freelancers/Professionals)</strong></td><td>AED 15,000 / month income</td><td>5 Years</td><td>Freelance permit, bachelor's degree, proof of self-employment</td></tr>
    </tbody>
  </table>
</div>

<h2>Step-by-Step Filing via GDRFA &amp; ICP</h2>
<p>Kishaa International's Dubai headquarters in Business Bay assists professionals and high-net-worth investors through official channels:</p>
<ol>
  <li><strong>Eligibility Screening:</strong> Review of employment contract classification, salary slips, and educational degree attestation (UAE Ministry of Foreign Affairs - MOFA).</li>
  <li><strong>Initial Nomination / Approval:</strong> Submission of candidate file via the GDRFA Dubai smart services portal or ICP federal channel.</li>
  <li><strong>Medical Fitness &amp; Biometrics:</strong> Priority VIP medical examination and Emirates ID biometric capture in Dubai.</li>
  <li><strong>Residency Stamping:</strong> Digital 10-year Golden Visa issuance and express delivery of the physical Emirates ID.</li>
</ol>

<h2>Family &amp; Dependent Benefits</h2>
<p>Unlike standard 2-year employment visas, Golden Visa sponsors can include spouses and unmarried children of any age (no age 25 cutoff for male dependents). In the event of the primary visa holder's demise, family members may legally remain in the UAE until the full expiration of their 10-year term.</p>`
  }
];

async function main() {
  console.log('🚀 Starting EEAT Pillar Blog Posts Seeder with AI Image Synthesis...');

  const catMap = {};
  const cats = db.prepare('SELECT id, slug FROM categories').all();
  for (const c of cats) catMap[c.slug] = c.id;

  const adminUser = db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").get() || { id: 44 };

  for (const p of POSTS) {
    console.log(`\n============================================================`);
    console.log(`📝 Processing Post: "${p.title}"`);

    // 1. Generate photorealistic cover image
    let mediaId = null;
    let coverUrl = `/img/guides/${p.slug}.svg`;

    try {
      console.log(`🎨 Requesting AI image generation for prompt...`);
      const imgRes = await generateAndSaveImage(p.imagePrompt, {
        size: '1664*928',
        folder: 'guides',
        user: adminUser,
      });
      if (imgRes && imgRes.mediaId) {
        mediaId = imgRes.mediaId;
        coverUrl = imgRes.url;
        console.log(`✅ AI Image Generated & Saved! ID: ${mediaId}, Path: ${coverUrl}`);
      }
    } catch (err) {
      console.warn(`⚠️ AI Image generation fallback: ${err.message}`);
    }

    const catId = catMap[p.categorySlug] || 1;
    const tagsJson = JSON.stringify(['2026', 'Immigration', 'Statutory Guidelines', 'Kishaa Advisory']);
    const takeawaysJson = JSON.stringify(p.keyTakeaways);

    // 2. Insert or update in SQLite
    const existing = db.prepare('SELECT id FROM posts WHERE slug = ?').get(p.slug);
    if (existing) {
      db.prepare(`
        UPDATE posts SET
          title = ?, excerpt = ?, body = ?, category_id = ?, tags = ?,
          cover_media_id = ?, read_minutes = ?, answer_summary = ?, key_takeaways = ?,
          seo_title = ?, seo_description = ?, target_query = ?, status = 'published',
          updated_at = datetime('now')
        WHERE id = ?
      `).run(
        p.title, p.excerpt, p.body, catId, tagsJson,
        mediaId, p.readMinutes, p.answerSummary, takeawaysJson,
        p.seoTitle, p.seoDescription, p.targetQuery, existing.id
      );
      console.log(`💾 Updated existing post in SQLite: ID ${existing.id}`);
    } else {
      const info = db.prepare(`
        INSERT INTO posts (
          title, slug, excerpt, body, category_id, tags, cover_media_id,
          author_id, status, publish_at, read_minutes, answer_summary,
          key_takeaways, seo_title, seo_description, target_query, noindex
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'published', datetime('now'), ?, ?, ?, ?, ?, ?, 0)
      `).run(
        p.title, p.slug, p.excerpt, p.body, catId, tagsJson, mediaId,
        adminUser.id, p.readMinutes, p.answerSummary,
        takeawaysJson, p.seoTitle, p.seoDescription, p.targetQuery
      );
      console.log(`💾 Inserted new post into SQLite: ID ${info.lastInsertRowid}`);
    }

    // 3. Sync to Supabase if connected
    if (supabase.isAvailable()) {
      try {
        const sb = supabase.getClient();
        await sb.from('posts').upsert({
          slug: p.slug,
          title: p.title,
          excerpt: p.excerpt,
          body: p.body,
          category_id: catId,
          tags: tagsJson,
          status: 'published',
          publish_at: new Date().toISOString(),
          read_minutes: p.readMinutes,
          answer_summary: p.answerSummary,
          key_takeaways: takeawaysJson,
          seo_title: p.seoTitle,
          seo_description: p.seoDescription,
          target_query: p.targetQuery,
          cover_image: coverUrl,
        }, { onConflict: 'slug' });
        console.log(`☁️ Synced post to Supabase cloud.`);
      } catch (sbErr) {
        console.warn(`Supabase sync note:`, sbErr.message);
      }
    }
  }

  console.log('\n🎉 Finished seeding all 4 EEAT Pillar Blog Guides!');
}

main().catch(err => {
  console.error('Fatal error during seed:', err);
  process.exit(1);
});

'use strict';

const fs = require('fs');
const path = require('path');

const GUIDES = [
  {
    slug: 'canada-10-year-multiple-entry-visit-visa-requirements-cost-and-timeline-2026',
    flag: '🇨🇦',
    category: 'VISA & IMMIGRATION',
    topic: 'CANADA 10-YEAR VISIT VISA',
    titleLine1: 'Canada 10-Year Multiple Entry',
    titleLine2: 'Requirements, Cost & Timeline',
    statLabel: 'IRCC STATUTORY METRIC',
    statValue: 'Up to 10-Year Validity · 6-Month Stay/Visit · Business LOI Track',
    badge: 'IRCC 2026'
  },
  {
    slug: 'ukvi-28-day-rule-explained-how-much-must-sit-in-the-bank-for-a-student-visa-2026',
    flag: '🇬🇧',
    category: 'BANK STATEMENTS & FUNDS',
    topic: 'UKVI 28-DAY FINANCIAL RULE',
    titleLine1: 'UKVI 28-Day Rule Explained',
    titleLine2: 'Student Visa Maintenance Funds',
    statLabel: 'STATUTORY FUNDS REQUIRED',
    statValue: 'London £1,483/mo (£13,347) · Outside London £1,136/mo (£10,224)',
    badge: 'UKVI 2026'
  },
  {
    slug: 'finland-student-permit-why-9-600-covers-you-and-your-family-2026-guide',
    flag: '🇫🇮',
    category: 'STUDY & RELOCATION',
    topic: 'FINLAND RESIDENCE PERMIT',
    titleLine1: 'Finland Student & Family Permit',
    titleLine2: 'Why €9,600 Covers Your Whole Household',
    statLabel: 'FAMILY RELOCATION ADVANTAGE',
    statValue: '€9,600 Covers Student + Dependants · 4-Year Full-Degree Permit',
    badge: 'MIGRI 2026'
  },
  {
    slug: 'germany-blocked-account-sperrkonto-2026-exact-amount-and-payout-rules',
    flag: '🇩🇪',
    category: 'BANK STATEMENTS & FUNDS',
    topic: 'GERMANY SPERRKONTO',
    titleLine1: 'Germany Blocked Account 2026',
    titleLine2: 'Exact Amount & Payout Rules',
    statLabel: 'BAFÖG STATUTORY REQUIREMENT',
    statValue: '€11,904 Deposit Required · €992/Month Statutory Release',
    badge: 'BAFÖG 2026'
  },
  {
    slug: 'georgia-mbbs-for-pakistani-students-fees-recognition-and-study-gaps-2026',
    flag: '🇬🇪',
    category: 'MEDICAL ADMISSIONS',
    topic: 'GEORGIA MEDICAL DEGREE',
    titleLine1: 'Georgia MBBS Admissions 2026',
    titleLine2: 'Fees, PMDC Recognition & Study Gaps',
    statLabel: 'TUITION & ELIGIBILITY',
    statValue: '$4,000–$5,000 / Year · No IELTS Needed · Study Gaps Accepted',
    badge: 'PMDC / WHO'
  },
  {
    slug: 'how-to-move-from-band-6-5-to-7-5-in-ielts-academic-a-ten-week-plan',
    flag: '🎓',
    category: 'CAMBRIDGE TRAINING',
    topic: 'IELTS ACADEMIC ROADMAP',
    titleLine1: 'Move from Band 6.5 to 7.5',
    titleLine2: 'A Structured 10-Week Academic Plan',
    statLabel: 'CAMBRIDGE EXAM STRATEGY',
    statValue: 'Task 2 Coherence · Lexical Precision · Fluency Under Pressure',
    badge: 'BAND 7.5+'
  },
  {
    slug: 'uae-golden-visa-and-freelance-permit-which-category-actually-fits-you',
    flag: '🇦🇪',
    category: 'IMMIGRATION & BUSINESS',
    topic: 'UAE RESIDENCY PATHWAYS',
    titleLine1: 'UAE Golden Visa & Freelance',
    titleLine2: 'Which Category Actually Fits You?',
    statLabel: 'LONG-TERM RESIDENCY',
    statValue: '10-Year Golden Visa · Green Freelance Permit · Dubai HQ Direct',
    badge: 'ICP & GDRFA'
  },
  {
    slug: 'monthly-living-cost-in-the-uk-london-vs-manchester-vs-glasgow-2026',
    flag: '🇬🇧',
    category: 'COST INTELLIGENCE',
    topic: 'UK STUDENT LIVING BUDGET',
    titleLine1: 'Monthly Living Cost in the UK',
    titleLine2: 'London vs Manchester vs Glasgow',
    statLabel: 'CITY COMPARISON BENCHMARK',
    statValue: 'London £2,085/mo · Manchester £1,290/mo · Glasgow £1,090/mo',
    badge: 'BUDGET 2026'
  },
  {
    slug: 'flight-tickets-from-pakistan-to-dubai-and-europe-how-seasonal-pricing-works',
    flag: '✈️',
    category: 'TRAVEL INTELLIGENCE',
    topic: 'FLIGHT PRICING & LOGISTICS',
    titleLine1: 'Pakistan to Dubai & Europe Flights',
    titleLine2: 'How Seasonal Pricing & Taxes Work',
    statLabel: 'AIRFARE BREAKDOWN FORMULA',
    statValue: 'Base Fare + Taxes + Multipliers · Save 15–25% Off Shoulder Windows',
    badge: 'AIRFARE DESK'
  },
  {
    slug: 'italy-free-tuition-scholarships-for-pakistani-students-eligibility-and-timelines',
    flag: '🇮🇹',
    category: 'SCHOLARSHIPS & EUROPE',
    topic: 'ITALY DSU SCHOLARSHIPS',
    titleLine1: 'Italy Free Tuition Scholarships',
    titleLine2: 'Eligibility, ISEE & Intake Timelines',
    statLabel: 'FUNDING OPPORTUNITY',
    statValue: '100% Tuition Waiver · Up to €7,000/yr Living Stipend · English Taught',
    badge: 'DSU / REGIONAL'
  },
  {
    slug: 'why-schengen-visa-applications-get-refused-and-how-to-build-a-file-that-holds',
    flag: '🇪🇺',
    category: 'VISA REFUSAL PREVENTION',
    topic: 'SCHENGEN COMPLIANCE',
    titleLine1: 'Why Schengen Visas Get Refused',
    titleLine2: 'How to Build a File That Holds',
    statLabel: 'DECISION METHODOLOGY',
    statValue: '4-Pillar File Audit · Purpose · Funds History · Ties to Origin',
    badge: 'SCHENGEN CODE'
  },
  {
    slug: 'ielts-vs-pte-for-australia-which-test-should-you-take',
    flag: '🇦🇺',
    category: 'TEST COMPARISON',
    topic: 'AUSTRALIA ENGLISH REQUIREMENTS',
    titleLine1: 'IELTS vs PTE for Australia',
    titleLine2: 'Scoring Comparison & Strategy',
    statLabel: 'SCORE CONCORDANCE',
    statValue: 'IELTS 7.0 = PTE 65 · Human Examiner vs AI Algorithm Breakdown',
    badge: 'CRICOS / DHA'
  },
  {
    slug: 'romania-and-serbia-work-permits-what-a-realistic-timeline-looks-like',
    flag: '🇷🇴',
    category: 'WORK PERMITS & EUROPE',
    topic: 'EASTERN EUROPE EMPLOYMENT',
    titleLine1: 'Romania & Serbia Work Permits',
    titleLine2: 'Realistic Timelines & Quota Rules',
    statLabel: 'PROCESSING BENCHMARK',
    statValue: 'Romania: 6–14 Wks (Annual Quotas) · Serbia: 2–10 Wks Fast-Track',
    badge: 'WORK PERMIT'
  },
  {
    slug: 'australia-subclass-500-financial-capacity-oshc-and-the-genuine-student-requirement',
    flag: '🇦🇺',
    category: 'STUDY & IMMIGRATION',
    topic: 'AUSTRALIA SUBCLASS 500',
    titleLine1: 'Australia Subclass 500 Visa',
    titleLine2: 'Financial Capacity, OSHC & GS Rule',
    statLabel: 'DEPARTMENT OF HOME AFFAIRS',
    statValue: 'AUD $29,710 Capacity Evidence · CRICOS Offer · OSHC Health Cover',
    badge: 'SUBCLASS 500'
  }
];

function generateSvg(guide) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" width="1200" height="675" role="img" aria-label="${guide.titleLine1} ${guide.titleLine2} - Kishaa International">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#040e1d"/>
      <stop offset="45%" stop-color="#06162d"/>
      <stop offset="100%" stop-color="#0b2447"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#d9b43c"/>
      <stop offset="50%" stop-color="#f3d87f"/>
      <stop offset="100%" stop-color="#c9a227"/>
    </linearGradient>
    <linearGradient id="cardGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0e2343" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="#08182f" stop-opacity="0.95"/>
    </linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#ffffff" stroke-width="1" stroke-opacity="0.025"/>
    </pattern>
  </defs>

  <!-- Background -->
  <rect width="1200" height="675" fill="url(#bg)"/>
  <rect width="1200" height="675" fill="url(#grid)"/>

  <!-- Subtle Ambient Glow Rings -->
  <circle cx="1060" cy="180" r="320" fill="none" stroke="#c9a227" stroke-width="1.5" stroke-opacity="0.07"/>
  <circle cx="1060" cy="180" r="220" fill="none" stroke="#c9a227" stroke-width="1" stroke-opacity="0.1"/>
  <circle cx="1060" cy="180" r="120" fill="#c9a227" fill-opacity="0.03"/>

  <!-- Top Accent Bar -->
  <rect x="0" y="0" width="1200" height="6" fill="url(#gold)"/>

  <!-- Outer Architectural Border -->
  <rect x="24" y="24" width="1152" height="627" rx="4" fill="none" stroke="#c9a227" stroke-width="1" stroke-opacity="0.25"/>

  <!-- Header: Monogram Brand & Eyebrow -->
  <g transform="translate(64, 54)">
    <!-- Monogram Box -->
    <rect width="52" height="52" rx="4" fill="#040e1d" stroke="#c9a227" stroke-width="1.5"/>
    <text x="26" y="37" font-family="'Fraunces', Georgia, serif" font-size="32" font-weight="600" fill="#c9a227" text-anchor="middle">K</text>

    <!-- Company & Pillar Title -->
    <text x="68" y="24" font-family="'Inter', -apple-system, sans-serif" font-size="15" font-weight="700" letter-spacing="3" fill="#ffffff">KISHAA INTERNATIONAL</text>
    <text x="68" y="44" font-family="'Inter', -apple-system, sans-serif" font-size="12" font-weight="600" letter-spacing="2" fill="#c9a227">OFFICIAL ADVISORY &amp; IMMIGRATION GUIDANCE</text>
  </g>

  <!-- Top Right Topic / Authority Badge -->
  <g transform="translate(980, 54)">
    <rect width="156" height="42" rx="3" fill="#0a1d36" stroke="#c9a227" stroke-width="1" stroke-opacity="0.4"/>
    <text x="78" y="26" font-family="'Inter', -apple-system, sans-serif" font-size="13" font-weight="700" letter-spacing="1.5" fill="#f3d87f" text-anchor="middle">${guide.badge}</text>
  </g>

  <!-- Large Country / Topic Seal & Flag -->
  <g transform="translate(960, 210)">
    <circle cx="90" cy="90" r="85" fill="#040e1d" stroke="#c9a227" stroke-width="1.5" stroke-opacity="0.5"/>
    <circle cx="90" cy="90" r="74" fill="#081b35" stroke="#ffffff" stroke-width="0.75" stroke-opacity="0.1"/>
    <text x="90" y="112" font-size="70" text-anchor="middle">${guide.flag}</text>
  </g>

  <!-- Content Block: Category Pill & Main Titles -->
  <g transform="translate(64, 180)">
    <!-- Category Pill -->
    <rect width="210" height="30" rx="3" fill="#c9a227" fill-opacity="0.15" stroke="#c9a227" stroke-width="1" stroke-opacity="0.6"/>
    <text x="14" y="20" font-family="'Inter', -apple-system, sans-serif" font-size="11" font-weight="700" letter-spacing="2" fill="#f3d87f">${guide.category}</text>

    <!-- Subtitle / Topic Breadcrumb -->
    <text x="0" y="66" font-family="'Inter', -apple-system, sans-serif" font-size="14" font-weight="600" letter-spacing="3" fill="#94a3b8">${guide.topic}</text>

    <!-- Main Headline Lines -->
    <text x="0" y="132" font-family="'Fraunces', Georgia, serif" font-size="52" font-weight="600" fill="#ffffff" letter-spacing="-0.5">${guide.titleLine1}</text>
    <text x="0" y="196" font-family="'Fraunces', Georgia, serif" font-size="52" font-weight="600" fill="#ffffff" letter-spacing="-0.5">${guide.titleLine2}</text>
  </g>

  <!-- Highlight Stat Card at Bottom -->
  <g transform="translate(64, 455)">
    <rect width="1072" height="130" rx="4" fill="url(#cardGrad)" stroke="#c9a227" stroke-width="1.2" stroke-opacity="0.4"/>
    <rect x="0" y="0" width="6" height="130" rx="2" fill="url(#gold)"/>

    <!-- Stat Label -->
    <text x="32" y="42" font-family="'Inter', -apple-system, sans-serif" font-size="12" font-weight="700" letter-spacing="2.5" fill="#f3d87f">${guide.statLabel}</text>

    <!-- Stat Value -->
    <text x="32" y="86" font-family="'Fraunces', Georgia, serif" font-size="27" font-weight="500" fill="#ffffff">${guide.statValue}</text>

    <!-- Verified Timestamp Badge -->
    <text x="1040" y="68" font-family="'Inter', -apple-system, sans-serif" font-size="11" font-weight="600" letter-spacing="1.5" fill="#94a3b8" text-anchor="end">2026 EDITION · VERIFIED</text>
    <text x="1040" y="88" font-family="'Inter', -apple-system, sans-serif" font-size="11" font-weight="600" letter-spacing="1" fill="#c9a227" text-anchor="end">kishaainternational.com</text>
  </g>

  <!-- Bottom Accent Line -->
  <rect x="64" y="618" width="1072" height="1" fill="#c9a227" fill-opacity="0.3"/>
</svg>`;
}

const clientDir = path.resolve(__dirname, '../../client/public/img/guides');
const publicDir = path.resolve(__dirname, '../../public/img/guides');

fs.mkdirSync(clientDir, { recursive: true });
fs.mkdirSync(publicDir, { recursive: true });

for (const guide of GUIDES) {
  const svg = generateSvg(guide);
  const fileName = `${guide.slug}.svg`;
  fs.writeFileSync(path.join(clientDir, fileName), svg, 'utf8');
  fs.writeFileSync(path.join(publicDir, fileName), svg, 'utf8');
  console.log(`Generated: ${fileName}`);
}

// Also create default generic guide thumbnail
const genericGuide = {
  slug: 'default-guide',
  flag: '🌐',
  category: 'KISHAA ADVISORY',
  topic: 'GLOBAL IMMIGRATION & EDUCATION',
  titleLine1: 'Visa, Study & Career Guide',
  titleLine2: 'Official 2026 Policy Reference',
  statLabel: 'ONE COMPANY · GLOBAL SOLUTIONS',
  statValue: 'Dubai HQ +971 58 682 6099 · Pakistan +92 312 552 6099',
  badge: 'GUIDE 2026'
};
const defaultSvg = generateSvg(genericGuide);
fs.writeFileSync(path.join(clientDir, 'default-guide.svg'), defaultSvg, 'utf8');
fs.writeFileSync(path.join(publicDir, 'default-guide.svg'), defaultSvg, 'utf8');
console.log('Generated: default-guide.svg');
console.log(`Total ${GUIDES.length + 1} thumbnails generated successfully.`);

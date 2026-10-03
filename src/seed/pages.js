'use strict';
/** Seed pages as block documents — every section here is editable in the CMS page builder. */
module.exports = function seedPages(db, ctx) {
  const ins = ctx.ins;
  const J = JSON.stringify;
  const page = (o) => ins('pages', { status: 'published', template: 'blocks', ...o, blocks: J(o.blocks) });

  /* ============================================================== HOME ==== */
  page({
    title: 'Home', slug: 'home', template: 'home', sort_order: 1,
    excerpt: 'Career Counseling, Immigration Consultancy and Cambridge Courses Training from Dubai (HQ) and Pakistan.',
    seo_title: 'Career Counseling, Immigration Consultancy & Cambridge Training in Dubai & Pakistan',
    seo_description: 'Kishaa International guides students and professionals from Dubai and Pakistan into global careers: UK 2027 admissions with MOI, Canada 10-year visit visas, Italy, Finland, Georgia MBBS, UAE Golden visas, plus Cambridge & IELTS training with British Council Certified Trainer Zeb Khan. Plan real costs, then book a consultation.',
    blocks: [
      { type: 'hero', eyebrow: 'Gateway to Global Careers · One Company, Global Solutions',
        title: 'Career counseling, immigration consultancy and Cambridge training — under one roof.',
        subtitle: 'Explore expert career counseling, immigration consultancy and Cambridge courses training with Kishaa International. Whether you are securing a 10-year Canada visit visa with business LOI letters, winning UK, Italy, Finland or Georgia university admissions with generous scholarships, or mastering English under British Council Certified Trainer Zeb Khan, our Dubai and Pakistan teams deliver transparent, step-by-step guidance.',
        actions: [
          { label: 'Request a Visa & Admissions Consultation', url: '/contact?interest=immigration', style: 'primary' },
          { label: 'Explore Cambridge & IELTS Courses', url: '/cambridge-courses', style: 'ghost' }],
        stats: [
          { value: '26', label: 'Countries with sourced cost data' },
          { value: '60–70', label: 'Days typical Canada visit processing' },
          { value: '2', label: 'Offices — Dubai HQ & Pakistan' }],
        badges: ['British Council Certified Trainer', 'PRO & GDRFA approved channels', 'Sources dated & versioned'] },

      { type: 'answerFirst',
        question: 'What does Kishaa International actually do?',
        answer: 'Kishaa International is a Dubai-headquartered consultancy with a Pakistan office that delivers three services: career counseling and university admissions, immigration and visa consultancy, and Cambridge and IELTS training. You can compare destinations, calculate flight, living and statutory proof-of-funds costs on this site for free, then book a consultation with a named advisor — with no guaranteed-outcome promises and no payment until scope is confirmed in writing.' },

      { type: 'pillars', heading: 'Three pillars, one accountable team',
        subheading: 'Each pillar has its own specialists, its own enquiry funnel and its own measurement — not a single generic contact form.',
        items: [
          { icon: 'compass', title: 'Career Counseling & Admissions', text: 'UK 2027 intakes with MOI accepted, Italy free-tuition scholarships, Finland family and PR pathway, Georgia MBBS with no IELTS, plus CV and interview preparation.', url: '/career-counseling', cta: 'Plan my pathway' },
          { icon: 'passport', title: 'Immigration Consultancy', text: 'Canada 10-year multiple-entry visit visas with business LOI, UAE Golden and Freelance visas through PRO and GDRFA, Turkey Emirates ID route for Afghan passports, Serbia, Romania and Schengen.', url: '/immigration-consultancy', cta: 'Explore visa routes' },
          { icon: 'target', title: 'Cambridge & IELTS Training', text: 'Spoken English, IELTS Academic and General Training, Cambridge English levels and corporate executive communication — all led by British Council Certified Trainer Zeb Khan.', url: '/cambridge-courses', cta: 'Choose my course' }] },

      { type: 'plannerTeaser', heading: 'Know the real number before you commit',
        subheading: 'Choose a destination and see flights, city living costs, the statutory bank statement rule and the document checklist — separated, dated and sourced.',
        countries: ['uk', 'canada', 'italy', 'finland', 'georgia', 'germany', 'uae', 'turkey'] },

      { type: 'programCards', heading: 'Flagship visa & admissions pathways',
        subheading: 'Each card opens a detail page with eligibility, what is included, timelines, fees and the next step.',
        pillar: 'all', filter: 'featured', limit: 6 },

      { type: 'trainer', heading: 'Meet your trainer and senior consultant',
        teamSlug: 'zeb-khan' },

      { type: 'programCards', heading: 'Cambridge & IELTS courses',
        subheading: 'Diagnostic test, a written band roadmap, weekly marked writing and full mock examinations.',
        pillar: 'cambridge', limit: 4 },

      { type: 'reviews', heading: 'Verified reviews, fetched from the source platforms',
        subheading: 'Aggregated from Google Business Profile, Facebook and Trustpilot. Ratings are never invented or inflated — every review links back to its original platform.',
        limit: 6 },

      { type: 'feeds', heading: 'Recent student success, straight from our channels',
        subheading: 'Instagram, Facebook and YouTube posts ingested through the integration hub and cached for speed. Source deletions propagate automatically.',
        limit: 6 },

      { type: 'destinations', heading: 'Destination intelligence hub',
        subheading: 'Region-aware guidance for Europe, North America, Oceania, the Middle East, Eurasia and the Central Asian republics — with the EU, Schengen and non-Schengen distinctions kept precise.',
        limit: 8 },

      { type: 'process', heading: 'How a Kishaa consultation works',
        steps: [
          { title: 'Discover', detail: 'Tell us the goal — study, work, visit or training — and the destination you are considering.' },
          { title: 'Calculate', detail: 'We model tuition, flight, living costs and the statutory bank statement rule for that specific route.' },
          { title: 'Verify', detail: 'You inspect our track record, source dates and credentials rather than taking a claim on trust.' },
          { title: 'Convert', detail: 'You choose the channel — call, WhatsApp or email — and a named consultant responds within one business day.' }] },

      { type: 'enquiryForm', heading: 'Request a consultation',
        subheading: 'Tell us whether this is about career counseling, a visa, or Cambridge and IELTS training, and a named consultant will reply.',
        variant: 'full' },

      { type: 'faq', heading: 'Questions we are asked before every engagement', limit: 8 },

      { type: 'sources', heading: 'Where our figures come from',
        note: 'Every statutory figure on this site carries its authority, effective date and review state. Anything unverified is withheld from automatic calculation.',
        items: [
          { label: 'UK Visas & Immigration — Appendix Student maintenance', url: 'https://www.gov.uk/student-visa/money', date: '2025-01-02' },
          { label: 'Migri (Finland) — student residence permit funds', url: 'https://migri.fi/en/studying', date: '2025-01-01' },
          { label: 'German Federal Foreign Office / § 16b AufenthG — blocked account', url: 'https://www.auswaertiges-amt.de/en/visa-service', date: '2025-09-01' },
          { label: 'IRCC — visitor visa documentation guidance', url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada.html', date: '2026-08-01' },
          { label: 'Australian Department of Home Affairs — subclass 500 financial capacity', url: 'https://immi.homeaffairs.gov.au/', date: '2024-05-10' },
          { label: 'Numbeo & national statistics offices — city living-cost profiles', url: 'https://www.numbeo.com/cost-of-living/', date: '2026-08-15' }] },
    ],
  });

  /* =================================================== CAREER COUNSELING === */
  page({
    title: 'Career Counseling', slug: 'career-counseling', sort_order: 2,
    excerpt: 'Admissions strategy, scholarships, CV and interview preparation for global careers.',
    seo_title: 'Career Counseling & Study Abroad Admissions — UK 2027, Italy, Finland, Georgia',
    seo_description: 'Career counseling and admissions support from Kishaa International: UK 2027 intakes with MOI accepted and scholarships up to £5,000, Italy free-tuition scholarships, Finland family and PR pathway, Georgia MBBS with no IELTS, plus CV and interview preparation from Dubai and Pakistan.',
    blocks: [
      { type: 'hero', compact: true, eyebrow: 'Career Counseling',
        title: 'Admissions strategy built around your budget, not a brochure.',
        subtitle: 'We map your qualifications, funds and family situation to a route you can actually complete — then we tell you honestly when a route is not worth applying for yet.',
        actions: [{ label: 'Book a career counseling session', url: '/contact?interest=career_counseling', style: 'primary' },
                  { label: 'Compare country costs', url: '/cost-planner', style: 'ghost' }] },
      { type: 'answerFirst',
        question: 'What does career counseling at Kishaa International include?',
        answer: 'A 90-minute discovery session, a comparison of two or three viable destinations on cost and timeline, CV and cover-letter re-engineering, a recorded mock interview with structured feedback, a written pathway action plan, and a follow-up review session. Fees are quoted in writing before any work begins, and we advise against applying where a route is not realistic.' },
      { type: 'programCards', heading: 'Flagship study programs', pillar: 'career' },
      { type: 'comparison', heading: 'Four flagship admissions routes compared',
        columns: ['Route', 'Tuition', 'English evidence', 'Signature advantage'],
        rows: [
          ['UK 2027 intake', '£11,300–£15,500', 'MOI accepted with or without IELTS', '25+ partner universities, scholarships to £5,000'],
          ['Italy (English-taught)', 'Free on funded scholarship · €3,600 partial year 1', 'MOI or IELTS per university', 'Free accommodation options, DSU regional grants'],
          ['Finland (BS/Masters)', 'approx. €6,500 per year', 'MOI or IELTS', '€9,600 funds covers family, spouse work rights'],
          ['Georgia (MBBS/Tech)', '$2,000–$8,000 per year', 'No IELTS for qualifying applicants', 'MCI/WHO recognised, study gaps accepted']] },
      { type: 'checklist', heading: 'What you should prepare before we file anything',
        items: [
          'Attested transcripts and degrees (HEC-attested for Pakistan)',
          'Medium of Instruction (MOI) letter from your institution',
          'Passport valid for at least the full study duration plus six months',
          'Statutory funds held in the required form for the required holding period',
          'Statement of purpose matching the course, not a generic template',
          'Two academic or professional references',
          'Health insurance and tuberculosis screening where the route requires it'] },
      { type: 'enquiryForm', heading: 'Start your career counseling enquiry', variant: 'compact', preselect: 'career_counseling' },
      { type: 'faq', heading: 'Admissions questions', category: 'admissions', limit: 6 },
    ],
  });

  /* ================================================ IMMIGRATION HUB ====== */
  page({
    title: 'Immigration Consultancy', slug: 'immigration-consultancy', sort_order: 3,
    excerpt: 'Canada 10-year LOI visit visas, UAE PRO and GDRFA filings, Turkey Emirates ID route, Serbia, Romania and Schengen.',
    seo_title: 'Immigration Consultancy — Canada 10-Year Visit Visa, UAE Golden Visa, Schengen',
    seo_description: 'Immigration consultancy from Dubai (HQ) and Pakistan: Canada 10-year multiple-entry visit visa with business LOI at AED 7,500 in milestones, UAE Golden, Freelance and Family visas via PRO and GDRFA, Turkey Emirates ID route for Afghan passports, Serbia and Romania work pathways, and Schengen preparation with honest eligibility screening.',
    blocks: [
      { type: 'hero', compact: true, eyebrow: 'Immigration Consultancy',
        title: 'Transparent visa consultancy — with the refusal risks explained up front.',
        subtitle: 'We file through approved channels, verify every employer and invitation, and tell you when a file is not strong enough to submit. No guaranteed outcomes, ever.',
        actions: [{ label: 'Request a visa assessment', url: '/contact?interest=immigration', style: 'primary' },
                  { label: 'See statutory bank statement rules', url: '/bank-statements', style: 'ghost' }] },
      { type: 'answerFirst',
        question: 'Which immigration routes does Kishaa International handle?',
        answer: 'Canada ten-year multiple-entry visit visas with business Invitation Letters and sponsor letters (AED 7,500 in three milestones, 60–70 days typical processing), UAE Golden, Freelance, Family and Visit visas through PRO services with GDRFA-approved processing, the Turkey Emirates ID route for Afghan passport holders resident in the UAE, Serbia and Romania work pathways, and Schengen tourist and visit applications.' },
      { type: 'programCards', heading: 'Visa pathways', pillar: 'immigration' },
      { type: 'table', heading: 'Milestone payment structure — Canada 10-year LOI visit visa',
        columns: ['Milestone', 'Amount', 'When it is payable'],
        rows: [
          ['Submission & assessment', 'AED 1,500', 'On file build and submission preparation'],
          ['IRCC filing & VFS biometrics', 'AED 1,500', 'When the application and biometrics are filed'],
          ['After approval', 'AED 4,500', 'On visa approval'],
        ],
        note: 'Total AED 7,500 (about PKR 575,000). In the event of refusal, AED 1,500 is retained and the balance milestones are not charged. IRCC and VFS biometric fees are included in the package. Entry decisions rest solely with IRCC.' },
      { type: 'notice', tone: 'warn', heading: 'What we will not do',
        text: 'We do not offer guaranteed visas, guaranteed admissions, “pay after result” arrangements, or any route that depends on false documents. Where a file is weak we say so, and we recommend waiting rather than risking a refusal record.' },
      { type: 'process', heading: 'The five-stage immigration workflow',
        steps: [
          { title: 'Eligibility & file strength', detail: 'Travel history, ties, funds and purpose assessed honestly — including where we advise a delay.' },
          { title: 'Documentation build', detail: 'Invitation letters, sponsor letters, financial evidence and translations assembled and cross-checked.' },
          { title: 'Filing', detail: 'Application lodged through the approved channel with biometrics scheduled.' },
          { title: 'Tracking', detail: 'Status monitored; you receive updates at defined checkpoints rather than silence.' },
          { title: 'Decision & next step', detail: 'Approval, refusal reasons or follow-up documentation handled with a written plan.' }] },
      { type: 'enquiryForm', heading: 'Request a visa assessment', variant: 'full', preselect: 'immigration' },
      { type: 'faq', heading: 'Visa questions', category: 'visa', limit: 6 },
    ],
  });

  /* ================================================= CAMBRIDGE COURSES ==== */
  page({
    title: 'Cambridge Courses', slug: 'cambridge-courses', sort_order: 4,
    excerpt: 'Spoken English, IELTS Academic and General Training, Cambridge English and corporate executive training.',
    seo_title: 'Cambridge & IELTS Courses in Dubai and Pakistan — British Council Certified Trainer',
    seo_description: 'Spoken English, IELTS Academic and General Training, Cambridge English levels and corporate executive communication taught by British Council Certified Trainer Zeb Khan (MA English, MEd, PGD TEFL, Dip EPM) in Dubai, Rawalpindi and online, with a diagnostic test, band roadmap and full mock examinations.',
    blocks: [
      { type: 'hero', compact: true, eyebrow: 'Cambridge Courses & IELTS',
        title: 'A written band roadmap, weekly marked writing, and a trainer who tracks your progress.',
        subtitle: 'Taught by British Council Certified Trainer Zeb Khan — MA English, MEd, PGD TEFL, Dip EPM — in Dubai, Pakistan and live online.',
        actions: [{ label: 'Book a free diagnostic test', url: '/contact?interest=cambridge', style: 'primary' },
                  { label: 'Talk to Zeb Khan', url: '/team/zeb-khan', style: 'ghost' }] },
      { type: 'answerFirst',
        question: 'How does IELTS preparation work at Kishaa International?',
        answer: 'You begin with a four-skill diagnostic test and a target-band gap analysis. From there Zeb Khan issues a written roadmap stating the band each skill must reach and by when. The course runs 28 sessions across all four skills with 12 marked writing tasks, four full mock examinations under exam conditions and speaking simulations, finishing with a test-day strategy session. Academic and General Training tracks are taught separately.' },
      { type: 'stats', items: [
        { value: '6.0–8.0', label: 'Target band range supported' },
        { value: '12', label: 'Marked writing tasks per course' },
        { value: '4', label: 'Full mock examinations' },
        { value: '10', label: 'Weeks per IELTS course' }] },
      { type: 'programCards', heading: 'Courses', pillar: 'cambridge' },
      { type: 'trainer', heading: 'Your trainer', teamSlug: 'zeb-khan', compact: true },
      { type: 'table', heading: 'Which course is right for you?',
        columns: ['If you need…', 'Take', 'Duration'],
        rows: [
          ['Confidence speaking in meetings and interviews', 'Spoken English & Communication Skills', '8 weeks'],
          ['A 6.0–8.0 band for study, work or migration', 'IELTS Preparation (Academic or General)', '10 weeks'],
          ['Structured level progression with certification', 'Cambridge English Courses', '12 weeks per level'],
          ['Team-wide business writing and presentation capability', 'Corporate Professional English', '4–12 weeks']] },
      { type: 'enquiryForm', heading: 'Book your diagnostic', variant: 'compact', preselect: 'cambridge' },
      { type: 'faq', heading: 'Training questions', category: 'training', limit: 6 },
    ],
  });

  /* ============================================================ ABOUT ===== */
  page({
    title: 'About Us', slug: 'about-us', sort_order: 5,
    excerpt: 'Dual presence in Dubai, UAE (HQ) and Pakistan, with verified credentials and transparent advice.',
    seo_title: 'About Kishaa International — Dubai HQ & Pakistan',
    seo_description: 'Kishaa International is a career counseling, immigration consultancy and Cambridge training practice with its headquarters in Dubai, UAE and an office in Pakistan. Verified credentials, sourced cost data and no guaranteed-outcome claims.',
    blocks: [
      { type: 'hero', compact: true, eyebrow: 'About Kishaa International',
        title: 'One company, global solutions — from Dubai and Pakistan.',
        subtitle: 'Kishaa International exists because families were being sold outcomes nobody could guarantee. We publish our sources, date our figures, name our advisors and record every enquiry with an owner and a response time.',
        actions: [{ label: 'Talk to our team', url: '/contact', style: 'primary' }] },
      { type: 'richtext', html: '<h2>What we do</h2><p>We deliver three services under one accountable team: <strong>career counseling and university admissions</strong>, <strong>immigration and visa consultancy</strong>, and <strong>Cambridge and IELTS training</strong>. Our teams sit in Dubai, United Arab Emirates (headquarters) and in Pakistan, and they serve applicants from both countries plus UAE residents of other nationalities.</p><h2>How we work</h2><p>Every engagement starts with an honest eligibility assessment that includes the reasons a route might not succeed. Fees are quoted in writing with milestone structures where a package spans several stages. Nothing is promised that a government authority or a university decides — not visas, not admissions, not bands, not scholarships.</p><h2>Our data standards</h2><p>Statutory figures published here carry the issuing authority, the effective date and the reviewing officer, and they are versioned. When a rule is pending confirmation it is withheld from automatic calculation and referred to a counselor instead. Living costs are maintained statistical estimates with observation dates. Flight figures are supplier quotes while a provider is connected, and clearly labelled route-matrix estimates while one is not.</p>' },
      { type: 'stats', items: [
        { value: 'Dubai', label: 'Headquarters — Business Bay' },
        { value: 'Pakistan', label: 'Rawalpindi office' },
        { value: '3', label: 'Service pillars' },
        { value: '26', label: 'Countries with sourced data' }] },
      { type: 'pillars', heading: 'Leadership and desks', items: [
        { icon: 'star', title: 'Zeb Khan — Senior Consultant & Executive Trainer', text: 'MA English · MEd · PGD TEFL · Dip EPM · British Council Certified Trainer.', url: '/team/zeb-khan', cta: 'View profile' },
        { icon: 'folder', title: 'Admissions & Visa Desk', text: 'Document verification, funds-rule evidence review, filings, appointments and status tracking.', url: '/team/admissions-visa-desk', cta: 'Meet the desk' }] },
      { type: 'cta', heading: 'Work with a team that shows its sources',
        text: 'Bring us your target country and your budget. We will tell you what is realistic before you spend anything.',
        actions: [{ label: 'Request a consultation', url: '/contact', style: 'primary' }, { label: 'Read our guides', url: '/resources', style: 'ghost' }] },
    ],
  });

  /* ========================================================== CONTACT ===== */
  page({
    title: 'Contact', slug: 'contact', sort_order: 6,
    excerpt: 'Dubai (HQ) and Pakistan contact lines, verified WhatsApp, and the consultation form.',
    seo_title: 'Contact Kishaa International — Dubai HQ & Pakistan',
    seo_description: 'Contact Kishaa International on +971 58 682 6099 (Dubai, UAE) or +92 312 552 6099 (Pakistan), by verified WhatsApp, or submit the consultation form. Enquiries are stored privately, assigned an owner and answered within one business day.',
    blocks: [
      { type: 'hero', compact: true, eyebrow: 'Contact',
        title: 'Tell us the goal. We will tell you the honest route.',
        subtitle: 'Every enquiry is stored privately, assigned to a named consultant and acknowledged. A consultation time is confirmed only once we agree it with you.',
        actions: [{ label: 'Call Dubai HQ', url: 'tel:+971586826099', style: 'primary' },
                  { label: 'Call Pakistan', url: 'tel:+923125526099', style: 'ghost' }] },
      { type: 'contactCards' },
      { type: 'enquiryForm', heading: 'Consultation request', variant: 'full' },
      { type: 'faq', heading: 'Before you write to us', category: 'general', limit: 5 },
    ],
  });

  /* ====================================================== LEGAL PAGES ===== */
  page({
    title: 'Privacy Policy', slug: 'privacy', sort_order: 20, noindex: 0,
    seo_title: 'Privacy Policy', seo_description: 'How Kishaa International collects, uses, stores and deletes enquiry data, planner inputs and review-feed content.',
    blocks: [{ type: 'richtext', html: `<h2>What we collect</h2><p>When you submit an enquiry we collect your name, your chosen contact channel and the contact detail for that channel (phone, WhatsApp number or email), the interest you selected, any qualification details you choose to provide, your optional message, and a record of which page and form you used. We also record the privacy notice version you were shown, whether you separately consented to marketing, and a one-way hash of your IP address used only for abuse prevention.</p>
<h2>What we never ask for through this website</h2><p>We never request bank account numbers, card numbers, financial passwords, passport scans or identity documents through any public form. Do not send such material through the website or the public WhatsApp link — we will request documents through a secure channel after your enquiry is acknowledged.</p>
<h2>Cost planner inputs</h2><p>You can generate a cost estimate without submitting any contact details. If you save or share an estimate, we store the planning inputs (country, purpose, city, budget scenario, dependants and dates) against a reference number — never your name, unless you later attach it to an enquiry.</p>
<h2>Reviews and social feeds</h2><p>We display reviews and posts fetched from Google Business Profile, Facebook, Trustpilot, Instagram and YouTube through our integration hub. Each item is attributed with a link to its original source, and where content is deleted at source it is removed here on the next refresh cycle.</p>
<h2>Who processes data on our behalf</h2><p>Our hosting provider, database provider, transactional email provider and the integration hub that fetches review and feed content. Credentials for these services are held server-side only and are never exposed to the browser.</p>
<h2>How long we keep it</h2><p>Enquiry records and their activity history are retained for 24 months from last contact unless a longer period is required to service an active engagement, after which they are deleted or anonymised. Backups are encrypted and rotate on a 24-hour recovery-point objective.</p>
<h2>Your rights</h2><p>You can request access, correction, withdrawal of marketing consent or deletion of your enquiry record by writing to kishaainternational@gmail.com or calling +971 58 682 6099. We respond within 30 days and confirm in writing what was done.</p>
<h2>Cookies</h2><p>Essential cookies keep an administrator signed in and protect forms against cross-site request forgery. Optional analytics cookies record anonymous intent events such as which country you selected in the planner — analytics events never contain personal information. You can decline optional cookies and still use every page.</p>` }],
  });
  page({
    title: 'Terms of Service', slug: 'terms', sort_order: 21,
    seo_title: 'Terms of Service', seo_description: 'The basis on which Kishaa International provides consultancy, admissions support and training.',
    blocks: [{ type: 'richtext', html: `<h2>What we provide</h2><p>Kishaa International provides consultancy, documentation support, admissions guidance and language training. We are not a government authority, an embassy, a university or an immigration decision-maker.</p>
<h2>No guarantee of outcome</h2><p>Visa grants, admission offers, scholarship awards and test bands are decided by the relevant authority, institution or examination body. We do not guarantee any outcome and we do not offer “pay after result” arrangements.</p>
<h2>Fees</h2><p>Advisory fees are quoted in writing and, for multi-stage packages, structured as milestones. Government, embassy, biometric, tuition and examination fees are payable to the relevant authority or institution and are shown separately from our advisory fee.</p>
<h2>Estimates on this website</h2><p>Cost planner outputs are planning estimates. Living costs are maintained statistical averages with observation dates. Statutory funds rules are published with their source and effective date and are versioned; where a rule is pending confirmation we withhold the automatic calculation rather than show an unverified number.</p>
<h2>Your responsibilities</h2><p>You agree to provide accurate information and genuine documents. We will decline to file any application we believe relies on false or altered documentation.</p>
<h2>Refusals</h2><p>Where a package includes milestones, only the milestone corresponding to work already performed is retained. Statutory and third-party fees already paid to authorities are non-refundable by us because they are not received by us.</p>
<h2>Governing law</h2><p>Engagements are governed by the terms in the signed engagement letter and the applicable law of the jurisdiction in which the engagement is contracted.</p>` }],
  });
  page({
    title: 'Thank You', slug: 'thank-you', sort_order: 22, noindex: 1, status: 'published',
    seo_title: 'Thank you — enquiry received', seo_description: 'Your enquiry has been received by Kishaa International.',
    blocks: [{ type: 'thankYou' }],
  });
  page({
    title: 'Services', slug: 'services', sort_order: 7,
    excerpt: 'Every program, visa package and course in one place.',
    seo_title: 'All Services, Visa Packages & Courses',
    seo_description: 'Browse every Kishaa International service: career counseling, UK, Italy, Finland and Georgia admissions, Canada and UAE visa packages, Schengen routes, and Cambridge, IELTS and corporate English training.',
    blocks: [
      { type: 'hero', compact: true, eyebrow: 'Services', title: 'Every program, package and course',
        subtitle: 'Filter by pillar, open a detail page, and see what is included, how long it takes and what it costs before you enquire.' },
      { type: 'programCards', heading: 'Career counseling & admissions', pillar: 'career' },
      { type: 'programCards', heading: 'Immigration & visa packages', pillar: 'immigration' },
      { type: 'programCards', heading: 'Cambridge, IELTS & corporate training', pillar: 'cambridge' },
      { type: 'enquiryForm', heading: 'Not sure which route fits?', variant: 'compact' },
    ],
  });
  page({
    title: 'Bank Statement Rules', slug: 'bank-statements', sort_order: 8,
    excerpt: 'Country-by-country statutory proof-of-funds rules with source authority and effective dates.',
    seo_title: 'Bank Statement & Proof of Funds Rules by Country (2026)',
    seo_description: 'Statutory proof-of-funds rules for the UK, Germany, Finland, Italy, Canada, Australia, Georgia and the UAE — each with its issuing authority, effective date and version status, plus a calculator that shows spending separately from mandatory bank balances.',
    blocks: [
      { type: 'hero', compact: true, eyebrow: 'Proof of funds',
        title: 'Statutory bank statement rules, with the source printed beside every number.',
        subtitle: 'These are the amounts that must sit in a bank account, held for the mandated period — entirely separate from your flights and living spending.',
        actions: [{ label: 'Open the cost planner', url: '/cost-planner', style: 'primary' }] },
      { type: 'answerFirst',
        question: 'How much money must be in the bank for a student visa?',
        answer: 'It depends entirely on the country and route. The UK currently requires £1,483 per month in London or £1,136 outside London for up to nine months, held for 28 consecutive days. Germany requires €11,904 in a blocked account released at €992 per month. Finland requires €9,600, which uniquely can cover the student and dependants. Italy accepts PKR 4.5–5.5 million from the applicant or a blood relative. Australia requires financial capacity evidence for living costs, tuition and travel, with the figure indexed periodically. The planner below shows the rule, its authority and its effective date for each route.' },
      { type: 'fundsTable' },
      { type: 'notice', tone: 'info', heading: 'Why some rules show as “under review”',
        text: 'Where a statutory amount has been reported but not yet confirmed against the issuing authority, we withhold it from automatic calculation and ask a counselor to verify it with you. A published figure that is wrong is worse than no figure at all.' },
      { type: 'enquiryForm', heading: 'Ask us to verify a rule for your route', variant: 'compact' },
    ],
  });

  return { page };
};

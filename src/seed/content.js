'use strict';
/**
 * CONTENT SEED — programs, destinations, funds rules, guides, trust data.
 * Statutory figures carry the source authority, effective date and review state.
 * Items still awaiting rule-reviewer sign-off are seeded as `needs_review`, which the
 * planner treats honestly: it suppresses the automatic calculation instead of guessing.
 */
const { slugify } = require('../lib/helpers');

module.exports = function seedContent(db) {
  const ins = (table, obj) => {
    const keys = Object.keys(obj);
    const stmt = db.prepare(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`);
    return stmt.run(...keys.map(k => obj[k])).lastInsertRowid;
  };
  const J = (v) => JSON.stringify(v);

  /* =========================================================== CATEGORIES */
  const cats = {};
  for (const c of [
    { name: 'Visa & Immigration', slug: 'visa-immigration', description: 'Route-by-route visa guides, statutory rules and document checklists.' },
    { name: 'Study Abroad', slug: 'study-abroad', description: 'Admissions, tuition and scholarship pathways for the agreed destination set.' },
    { name: 'IELTS & Cambridge', slug: 'ielts-cambridge', description: 'Band roadmaps, exam strategy and Cambridge course guidance.' },
    { name: 'Cost Planning', slug: 'cost-planning', description: 'Flight tickets, living costs and proof-of-funds intelligence.' },
  ]) cats[c.slug] = ins('categories', { ...c, seo_title: c.name + ' Guides | Kishaa International' });

  /* ================================================================ TEAM */
  const zeb = ins('team', {
    name: 'Zeb Khan', slug: 'zeb-khan',
    role_title: 'Senior Consultant & Executive Trainer',
    intro: 'Zeb Khan is the Senior Consultant & Executive Trainer at Kishaa International — a British Council Certified Trainer who leads Cambridge and IELTS preparation while advising students and professionals on admissions, immigration and visa strategy from Dubai, UAE and Pakistan.',
    bio: 'Zeb Khan holds an MA in English and an MEd, alongside a PGD in Teaching English as a Foreign Language (TEFL) and a Diploma in Educational Planning & Management (Dip EPM). As a British Council Certified Trainer he designs executive training for corporate clients and personalised band-improvement roadmaps for IELTS Academic and General Training candidates.\n\nAlongside training, Zeb advises families and professionals on university admissions (UK 2027 intake, Italy, Finland, Georgia), Canada ten-year multiple-entry visit visas with business LOI support, and UAE PRO/GDRFA-approved residency routes. His approach is deliberately transparent: attendees receive an honest assessment of eligibility, cost and timeline before any commitment, and Kishaa International never promotes guaranteed outcomes.\n\nHe trains in English and Urdu, in person across Dubai and Pakistan and online for international candidates.',
    credentials: J(['MA English', 'MEd', 'PGD TEFL', 'Dip EPM (Educational Planning & Management)', 'British Council Certified Trainer']),
    expertise: J(['Career counseling & pathway planning', 'UK / Italy / Finland / Georgia admissions', 'Canada ten-year LOI visit visa', 'UAE PRO & GDRFA routes', 'Cambridge English teaching', 'IELTS Academic & General Training', 'Executive business communication']),
    languages: J(['English', 'Urdu']),
    locations: J(['Dubai, UAE (HQ)', 'Pakistan (Rawalpindi & online)', 'Online worldwide']),
    email: 'kishaainternational@gmail.com',
    phones: J(['+971 58 682 6099', '+92 312 552 6099']),
    seo_title: 'Zeb Khan — Senior Consultant & Executive Trainer',
    seo_description: 'Zeb Khan, Senior Consultant & Executive Trainer at Kishaa International: MA English, MEd, PGD TEFL, Dip EPM and British Council Certified Trainer. Cambridge & IELTS training, admissions and immigration guidance from Dubai and Pakistan.',
    sort_order: 1,
  });
  const ayesha = ins('team', {
    name: 'Admissions & Visa Desk', slug: 'admissions-visa-desk',
    role_title: 'Admissions, Visa Filing & Documentation Team',
    intro: 'The Kishaa admissions and visa desk handles university applications, document verification, funds-rule evidence checks and appointment scheduling across Dubai and Pakistan.',
    bio: 'Our admissions desk maintains the country intelligence used by the cost planner: tuition schedules, statutory proof-of-funds rules, processing timelines and appointment availability. The team files Canada LOI visit-visa packs, UAE PRO and GDRFA applications, and study applications for the UK, Italy, Finland, Georgia, Germany, France, Portugal and Central Asia. Every figure published on this website carries its source and observation date; anything unverified is pulled from automatic calculation and escalated to the rule reviewer.',
    credentials: J(['Document verification', 'IRCC / VFS appointment handling', 'GDRFA & PRO filings', 'Funds-rule evidence review']),
    expertise: J(['Canada 10-yr LOI visit visa packs', 'UAE Golden & Freelance visa filings', 'Schengen application preparation', 'Scholarship documentation']),
    locations: J(['Dubai, UAE (HQ)', 'Pakistan']),
    phones: J(['+971 58 682 6099', '+92 312 552 6099']),
    sort_order: 2,
  });

  /* ============================================================ PROGRAMS */
  const P = [
    { name: 'Canada 10-Year Multiple Entry Visit Visa', slug: 'canada-10-year-visit-visa', pillar: 'immigration', type: 'visa',
      audience: 'Families, business owners and professionals seeking repeat travel to Canada.',
      summary: 'A ten-year multiple-entry visit visa pathway supported by business invitation and sponsor letters, with IRCC and VFS biometric fees included and milestone-based payment.',
      answer_summary: 'Kishaa International prepares Canada 10-year multiple-entry visit visa applications including a business Invitation Letter, sponsor letter, and IRCC plus VFS biometric fees. The document pack is charged AED 7,500 (about PKR 575,000) in three milestones, processing typically runs 60–70 days, and stays are usually up to six months per visit. In the event of refusal only the AED 1,500 submission milestone is retained.',
      highlights: J(['Ten-year multiple-entry visa objective', 'Business Invitation Letter (LOI) prepared', 'Sponsor letter supported', 'IRCC & VFS biometric fees included', 'Milestone payment structure', 'Stays of up to 6 months per visit']),
      included: J(['Eligibility assessment and honest file-strength review', 'Business Invitation Letter preparation', 'Sponsor letter drafting and review', 'IRCC application filing and VFS biometric appointment', 'Six-month bank statement guidance and evidence check', 'Refusal-risk briefing before submission']),
      process: J([{ title: 'Eligibility & file-strength review', detail: 'Travel history, ties, business and financial profile assessed honestly — including cases we advise not to file yet.' },
        { title: 'Documentation build', detail: 'Business invitation letter, sponsor letter, financial evidence and supporting records assembled and cross-checked.' },
        { title: 'Milestone 1 — submission', detail: 'AED 1,500 covers assessment and filing preparation.' },
        { title: 'IRCC filing & biometrics', detail: 'Application submitted; VFS biometric appointment booked (AED 1,500 milestone).' },
        { title: 'Decision & release', detail: 'On approval the AED 4,500 balance completes the pack. In the event of refusal only the submission milestone is retained.' }]),
      delivery: 'In person (Dubai & Pakistan) with online document support', duration: '60–70 days typical processing',
      fee_from: 7500, fee_to: 7500, currency: 'AED',
      fee_notes: 'AED 7,500 total in three milestones (AED 1,500 submission · AED 1,500 biometric · AED 4,500 after approval). In refusal, AED 1,500 is deducted. Embassy and biometric fees are included in this package.',
      location: 'Dubai HQ & Pakistan', processing_time: '60–70 days', featured: 1, sort_order: 1, icon: 'maple',
      urgency: 'Visa validity and entry decisions rest with IRCC — outcomes are never guaranteed.' },

    { name: 'UK University Admissions — 2027 Intakes (MOI Accepted)', slug: 'uk-admissions-2027', pillar: 'career', type: 'study',
      audience: 'Students targeting UK bachelor and master programs in the 2027 intakes.',
      summary: 'Applications to 25+ UK partner universities with MOI acceptance, no university interview, scholarships up to £5,000 and transparent tuition bands.',
      answer_summary: 'Kishaa International supports UK 2027 intake applications across 25+ partner universities including Bolton, Greenwich, Anglia Ruskin and Kingston. Medium of Instruction (MOI) letters are accepted with or without IELTS at participating institutions, no university interview is required, scholarships can reach £5,000, and tuition typically ranges £11,300–£15,500 with an initial deposit of £4,000–£6,500.',
      highlights: J(['MOI accepted with or without IELTS at partner universities', 'No university interview required', 'Scholarships up to £5,000', '25+ partner universities', 'CAS and visa preparation included', 'Proof-of-funds planning with 28-day rule']),
      included: J(['Course and university shortlisting against your budget', 'Application filing, offer follow-up and deposit guidance', 'MOI letter and English evidence strategy', 'CAS issuance coordination', 'UKVI 28-day maintenance funds planning', 'Accommodation and pre-departure briefing']),
      process: J([{ title: 'Profile assessment', detail: 'Academic history, gaps, budget and career goal reviewed against partner requirements.' },
        { title: 'University shortlisting', detail: 'Three to five realistic options with fee, scholarship and city cost comparisons.' },
        { title: 'Application & offers', detail: 'Applications filed; conditional and unconditional offers tracked.' },
        { title: 'Deposit & CAS', detail: 'Deposit paid, CAS issued, funds arranged to satisfy the 28-day rule.' },
        { title: 'Visa & departure', detail: 'Student route filing, biometrics, accommodation and pre-departure session.' }]),
      delivery: 'In person (Dubai & Pakistan) and online', duration: 'Intakes: Sept 2026 · Jan 2027 · Sept 2027',
      fee_from: 11300, fee_to: 15500, currency: 'GBP',
      fee_notes: 'Tuition £11,300–£15,500 depending on institution and program. Initial deposit £4,000–£6,500. Advisory service fees are quoted separately and confirmed in writing before work begins.',
      location: 'United Kingdom', processing_time: 'Offer 2–6 weeks; visa 3–8 weeks', featured: 1, sort_order: 2, icon: 'cap',
      urgency: '2027 intake places and scholarship pools are limited and allocated on a rolling basis.' },

    { name: 'Italy English-Taught Degrees — Funded Tuition', slug: 'italy-funded-tuition', pillar: 'career', type: 'study',
      audience: 'Budget-conscious students seeking European degrees taught in English.',
      summary: 'Fully funded scholarship routes where tuition can be free, with accommodation support and a defined bank statement requirement.',
      answer_summary: 'Italy offers English-taught degree programs where tuition can be fully covered by regional and merit scholarships, including free or subsidised accommodation. Applicants typically evidence funds of PKR 4.5–5.5 million from the applicant or a blood relative. A partial-funding version charges €3,600 in year one then becomes free. Kishaa International prepares the admission and scholarship dossier and the financial evidence pack.',
      highlights: J(['Tuition FREE on fully funded scholarships', 'Partial route: €3,600 year 1, then free', 'Free or subsidised accommodation options', 'English-taught programs — no Italian required', 'Bank statement PKR 4.5–5.5M accepted from applicant or blood relative', 'DSU regional scholarship guidance']),
      included: J(['Program shortlisting across Italian universities', 'Scholarship and DSU application preparation', 'Document translation and legalisation guidance', 'Bank statement structuring to the accepted format', 'Pre-enrolment and visa filing', 'Arrival, permit and accommodation guidance']),
      process: J([{ title: 'Funded-route assessment', detail: 'Merit profile checked against scholarship criteria and deadlines.' },
        { title: 'Admission filing', detail: 'University application and pre-enrolment prepared.' },
        { title: 'Scholarship dossier', detail: 'Regional and merit scholarship documentation assembled.' },
        { title: 'Financial evidence', detail: 'Bank statement prepared to the accepted PKR 4.5–5.5M format with relationship proof.' },
        { title: 'Visa & arrival', detail: 'Study visa filed, residence permit and accommodation arranged.' }]),
      delivery: 'In person & online', duration: 'Intake: September 2027 (applications open November 2026)',
      fee_from: 0, fee_to: 3600, currency: 'EUR',
      fee_notes: 'Fully funded route: tuition free. Partial-funding route: €3,600 in year one, free thereafter. Advisory fees quoted separately.',
      location: 'Italy', processing_time: 'Admission 4–10 weeks; visa 3–6 weeks', featured: 1, sort_order: 3, icon: 'euro',
      urgency: 'Scholarship windows close early and are competitive — prepare documents in advance.' },

    { name: 'Finland Bachelor & Master Programs — Family Friendly', slug: 'finland-family-pathway', pillar: 'career', type: 'study',
      audience: 'Students and families who want to relocate together with residence rights.',
      summary: '€6,500 annual tuition programs with spouse work rights, free schooling for children and a clear path to permanent residence.',
      answer_summary: 'Finnish bachelor and master programs at Kishaa partner institutions charge about €6,500 per year. Applicants evidence €9,600 in funds — a figure that can cover the student together with dependants. Spouses receive work rights, children attend school free of charge, and graduates can move through residence-permit and permanent-residence pathways.',
      highlights: J(['Tuition approx. €6,500 per year', '€9,600 funds covers student and dependants', 'Spouse work rights', 'Free schooling for children', 'Residence permit (TRC) and PR pathway', 'English-taught programs']),
      included: J(['Program selection for family relocation goals', 'Entrance examination and interview preparation', 'Funds planning to the €9,600 rule', 'Family residence permit applications', 'Accommodation and municipal registration guidance', 'Dependant documentation']),
      process: J([{ title: 'Family-goal planning', detail: 'Program, city and cost base chosen for a family budget.' },
        { title: 'Application & entrance test', detail: 'Application filed and entrance examination scheduled.' },
        { title: 'Tuition & funds', detail: 'Tuition arranged and €9,600 funds evidenced for the family unit.' },
        { title: 'Residence permits', detail: 'Student and family permits filed together with dependant documents.' },
        { title: 'Arrival', detail: 'Registration, schooling and residence-card steps on arrival.' }]),
      delivery: 'Online & in person', duration: 'Intakes: January & August',
      fee_from: 6500, fee_to: 6500, currency: 'EUR',
      fee_notes: 'Tuition approximately €6,500 per year at partner institutions. Statutory funds €9,600 (covers student and dependants).',
      location: 'Finland', processing_time: 'Permit 4–8 weeks', featured: 1, sort_order: 4, icon: 'north',
      urgency: 'January intake applications typically close in September.' },

    { name: 'Georgia Medical & Tech Programs — No IELTS', slug: 'georgia-medical-tech', pillar: 'career', type: 'study',
      audience: 'Students with study gaps seeking MBBS, BDS or technology degrees at low cost.',
      summary: 'Low tuition, no IELTS requirement for qualifying applicants, recognised medical programs and a study-gap friendly admission policy.',
      answer_summary: 'Georgian universities offer MBBS and BDS programs from about $4,000–$5,000 per year, with broader tuition ranging $2,000–$8,000. Programs are recognised by MCI and WHO listings, study gaps are accepted, no IELTS is required for qualifying applicants, and monthly living costs run around $1,100.',
      highlights: J(['MBBS/BDS tuition approx. $4,000–$5,000 per year', 'Broader tuition range $2,000–$8,000', 'MCI / WHO recognised medical programs', 'Study gaps accepted', 'No IELTS requirement for qualifying applicants', 'Living cost approx. $1,100 per month']),
      included: J(['University and program comparison with recognition checks', 'Admission and invitation letter processing', 'Study-gap explanation and documentation strategy', 'Tuition payment guidance and receipts', 'Visa filing and arrival support', 'Hostel and accommodation arrangement']),
      process: J([{ title: 'Recognition check', detail: 'Program checked against MCI/WHO listings for your intended destination of practice.' },
        { title: 'Admission', detail: 'Application filed; invitation letter issued.' },
        { title: 'Tuition arrangement', detail: 'First-year tuition paid directly to the institution with receipts.' },
        { title: 'Visa', detail: 'Study visa filed with the invitation and financial evidence.' },
        { title: 'Arrival', detail: 'Airport pickup, hostel, registration and city orientation.' }]),
      delivery: 'In person & online', duration: 'Intakes: September & February',
      fee_from: 2000, fee_to: 8000, currency: 'USD',
      fee_notes: 'Tuition $2,000–$8,000 per year depending on program; MBBS/BDS commonly $4,000–$5,000. Living cost approximately $1,100 per month.',
      location: 'Georgia', processing_time: 'Admission 2–4 weeks', featured: 1, sort_order: 5, icon: 'med',
      urgency: 'September intake seats at recognised medical faculties are limited.' },

    { name: 'UAE Golden, Freelance & Family Visas (PRO & GDRFA)', slug: 'uae-visas-pro-gdrfa', pillar: 'immigration', type: 'visa',
      audience: 'Residents, investors, professionals and families in the UAE.',
      summary: 'PRO-supported filing for Golden Visa, Freelance Permit, Family Sponsorship and Visit Visas through GDRFA-approved channels.',
      answer_summary: 'Kishaa International handles UAE Golden Visa, Freelance Permit, family sponsorship and visit visa filings through PRO services with GDRFA-approved processing. The team manages eligibility assessment, document attestation, medical and Emirates ID steps, and status-change timelines end to end.',
      highlights: J(['Golden Visa eligibility and filing', 'Freelance permit and residence', 'Family sponsorship and dependant visas', 'Visit visa extensions and status change', 'GDRFA-approved processing', 'PRO document handling and attestation']),
      included: J(['Category assessment for Golden, Freelance, Family or Visit', 'Document attestation and translation coordination', 'GDRFA application filing', 'Medical fitness and Emirates ID appointment', 'Status change and residency stamping', 'Renewal calendar reminders']),
      process: J([{ title: 'Category assessment', detail: 'Correct visa category identified from your profile and documents.' },
        { title: 'Documentation', detail: 'Attestation, translation and financial evidence prepared.' },
        { title: 'Filing', detail: 'GDRFA application submitted with PRO support.' },
        { title: 'Medical & Emirates ID', detail: 'Appointments booked and completed.' },
        { title: 'Residency issue', detail: 'Visa stamped and renewal dates recorded.' }]),
      delivery: 'Dubai HQ', duration: 'Typically 5–20 working days by category',
      fee_from: 2500, fee_to: 15000, currency: 'AED',
      fee_notes: 'Government fees vary by category and duration; advisory and PRO service fees are quoted per case after assessment.',
      location: 'United Arab Emirates', processing_time: '5–20 working days', featured: 1, sort_order: 6, icon: 'desert',
      urgency: 'Category rules change — confirm current eligibility with the team.' },

    { name: 'Schengen, Serbia & Romania Work Pathways', slug: 'europe-work-pathways', pillar: 'immigration', type: 'visa',
      audience: 'Workers and families seeking European work and residence routes.',
      summary: 'Serbia and Romania work-permit pathways plus Schengen tourist and visit visa preparation with honest eligibility screening.',
      answer_summary: 'Kishaa International prepares Serbia and Romania work-permit pathways and Schengen tourist or visit visa applications. Every case begins with an honest eligibility screening covering employer verification, salary expectations, contract terms and document authenticity — and we advise against filing where the route is not credible.',
      highlights: J(['Serbia and Romania work permit support', 'Schengen tourist and visit visa preparation', 'Employer and contract verification', 'Honest eligibility screening before payment', 'Document authentication guidance', 'Embassy appointment booking']),
      included: J(['Eligibility screening and route comparison', 'Employer and offer verification', 'Application form completion and appointment booking', 'Travel, accommodation and insurance evidence', 'Covering letter and itinerary preparation', 'Pre-interview briefing']),
      process: J([{ title: 'Screening', detail: 'Eligibility, documents and risk assessed honestly before any payment.' },
        { title: 'Route selection', detail: 'Serbia, Romania or Schengen route chosen to fit your profile.' },
        { title: 'Documentation', detail: 'Contracts, insurance, funds and accommodation evidence prepared.' },
        { title: 'Filing & appointment', detail: 'Application submitted at the relevant embassy or centre.' },
        { title: 'Decision support', detail: 'Status tracked and next steps advised.' }]),
      delivery: 'In person & online', duration: 'Varies by route: 3 weeks to 4 months',
      fee_from: 1200, fee_to: 4500, currency: 'EUR',
      fee_notes: 'Advisory fees depend on the route and case complexity; embassy fees are payable directly. Quotes are issued in writing after screening.',
      location: 'Europe & Balkans', processing_time: '3 weeks – 4 months', sort_order: 7, icon: 'rails',
      urgency: 'Work-permit quotas and employer allocations open and close during the year.' },

    { name: 'Turkey Visa on Emirates ID — Afghan Passport Special', slug: 'turkey-emirates-id', pillar: 'immigration', type: 'visa',
      audience: 'Afghan passport holders residing in the UAE.',
      summary: 'Specialist route advice for Afghan passport holders applying for Turkey entry using UAE Emirates ID residency.',
      answer_summary: 'Afghan passport holders legally resident in the UAE can access specific Turkey entry routes using Emirates ID residency. Kishaa International screen eligibility, prepares the application pack, and explains current requirements and timelines honestly rather than promising outcomes.',
      highlights: J(['Route guidance for Afghan passport holders', 'Emirates ID residency evidence handling', 'Current requirement checks', 'Appointment and submission support', 'Honest eligibility advice', 'Family case support']),
      included: J(['Eligibility and document screening', 'Application pack preparation', 'Residency and Emirates ID evidence review', 'Appointment booking', 'Pre-submission briefing', 'Follow-up on application status']),
      process: J([{ title: 'Eligibility screen', detail: 'Residency status, documentation and route availability checked.' },
        { title: 'Pack preparation', detail: 'Forms, evidence and photographs prepared to specification.' },
        { title: 'Submission', detail: 'Application filed through the applicable channel.' },
        { title: 'Decision', detail: 'Outcome communicated; onward steps advised.' }]),
      delivery: 'Dubai HQ', duration: 'Varies by current route rules',
      fee_from: 900, fee_to: 2200, currency: 'AED',
      fee_notes: 'Advisory fee per application; government fees payable separately. Rules for this route change frequently — the team confirms the current position at enquiry stage.',
      location: 'UAE → Turkey', processing_time: 'Routed by current rules', featured: 1, sort_order: 8, icon: 'crescent',
      urgency: 'Policy settings for this route change without notice — check current position.' },

    { name: 'Spoken English & Communication Skills', slug: 'spoken-english', pillar: 'cambridge', type: 'course',
      audience: 'Students, job seekers and professionals who need confident spoken English.',
      summary: 'Practical spoken English and communication training with pronunciation, fluency, vocabulary and interview practice.',
      answer_summary: 'This course builds spoken English fluency and workplace communication with pronunciation coaching, structured speaking practice, vocabulary expansion and mock interviews. It is delivered by British Council Certified Trainer Zeb Khan in Dubai, across Pakistan and online, in group or one-to-one formats.',
      highlights: J(['Pronunciation and accent clarity coaching', 'Everyday and workplace fluency drills', 'Confidence building for interviews', 'Weekly assessed speaking tasks', 'Group or one-to-one formats', 'Taught by a British Council Certified Trainer']),
      included: J(['Diagnostic speaking assessment', '24 guided sessions (group) or 12 one-to-one sessions', 'Recorded progress reviews', 'Vocabulary and idiom builder', 'Mock interview simulations', 'Certificate of completion']),
      process: J([{ title: 'Assessment', detail: 'Speaking diagnostic to place you at the correct level.' },
        { title: 'Skill plan', detail: 'Personal roadmap covering fluency, range, accuracy and confidence.' },
        { title: 'Guided practice', detail: 'Weekly sessions with structured speaking and listening tasks.' },
        { title: 'Mock evaluation', detail: 'Assessed presentations and interviews.' },
        { title: 'Completion', detail: 'Progress report and certificate issued.' }]),
      delivery: 'In person (Dubai & Pakistan) and online', duration: '8 weeks · 2 sessions per week',
      fee_from: 1200, fee_to: 3500, currency: 'AED',
      fee_notes: 'Group and one-to-one fees quoted separately; instalments available on request. Test and material fees are not included.',
      location: 'Dubai, Pakistan, Online', trainer_id: zeb, processing_time: null,
      cta_label: 'Book a Speaking Assessment', featured: 1, sort_order: 10, icon: 'mic' },

    { name: 'IELTS Preparation — Academic & General Training', slug: 'ielts-preparation', pillar: 'cambridge', type: 'course',
      audience: 'Candidates targeting 6.0–8.0 bands for study, work or migration.',
      summary: 'Band-targeted IELTS preparation with full mock tests, writing feedback and an individual improvement roadmap.',
      answer_summary: 'IELTS preparation at Kishaa International covers both Academic and General Training modules with a diagnostic test, a personalised band roadmap, weekly writing feedback, full mock examinations and speaking simulations. Courses run in Dubai and Pakistan with online options and are led by British Council Certified Trainer Zeb Khan.',
      highlights: J(['Academic and General Training tracks', 'Diagnostic test with band-gap analysis', 'Personal band-improvement roadmap', 'Writing Task 1 & 2 feedback on every submission', 'Weekly full-length mock tests', 'Speaking simulations with a certified trainer']),
      included: J(['Diagnostic assessment and target-band plan', '28 sessions covering all four skills', '12 marked writing tasks with detailed feedback', '4 full mock examinations', 'Test-day strategy and timing drills', 'Progress reports to family or sponsor on request']),
      process: J([{ title: 'Diagnostic', detail: 'Four-skill baseline test and target-band gap analysis.' },
        { title: 'Roadmap', detail: 'Written plan showing which band each skill must reach and by when.' },
        { title: 'Skill build', detail: 'Listening, reading, writing and speaking sessions with feedback.' },
        { title: 'Mock cycle', detail: 'Full mock tests under exam conditions with error analysis.' },
        { title: 'Test readiness', detail: 'Final strategy session and test booking guidance.' }]),
      delivery: 'In person (Dubai, Rawalpindi) and live online', duration: '10 weeks · 3 sessions per week',
      fee_from: 1400, fee_to: 4200, currency: 'AED',
      fee_notes: 'Course fee excludes the official IELTS test fee payable to the test centre. Retake preparation modules are available to past students.',
      location: 'Dubai, Pakistan, Online', trainer_id: zeb, processing_time: null,
      cta_label: 'Book a Free Diagnostic', featured: 1, sort_order: 11, icon: 'target' },

    { name: 'Cambridge English Courses', slug: 'cambridge-english', pillar: 'cambridge', type: 'course',
      audience: 'Learners advancing through structured Cambridge English levels.',
      summary: 'Structured Cambridge English progression from foundational levels to advanced, with exam technique and practice papers.',
      answer_summary: 'Cambridge English courses follow structured level progression with exam-technique training and authentic practice papers. Classes are taught by British Council Certified Trainer Zeb Khan in Dubai, Pakistan and online, and each learner receives regular assessed progress reports.',
      highlights: J(['Structured level progression', 'Exam technique and timing practice', 'Authentic Cambridge practice papers', 'Regular assessed progress', 'Small groups', 'Certificate of completion']),
      included: J(['Level placement test', 'Coursebook-based instruction', 'Practice papers with marking', 'Speaking test simulations', 'Progress reports', 'Certificate of completion']),
      process: J([{ title: 'Placement', detail: 'Level established against Cambridge descriptors.' },
        { title: 'Instruction', detail: 'Structured teaching covering all four skills.' },
        { title: 'Assessment', detail: 'Practice papers marked to Cambridge criteria.' },
        { title: 'Exam readiness', detail: 'Timing, technique and final revision.' }]),
      delivery: 'In person & online', duration: '12 weeks per level',
      fee_from: 1500, fee_to: 4000, currency: 'AED',
      fee_notes: 'Excludes official Cambridge examination fees. Levels can be combined for a discounted package.',
      location: 'Dubai, Pakistan, Online', trainer_id: zeb, sort_order: 12, icon: 'books' },

    { name: 'Corporate Professional English & Executive Training', slug: 'corporate-english', pillar: 'cambridge', type: 'course',
      audience: 'Companies and executives requiring business communication capability.',
      summary: 'Executive communication training for teams: presentations, email and report writing, negotiation and meeting fluency.',
      answer_summary: 'Corporate training covers executive communication: business writing, presentations, negotiation language, client-facing conversations and meeting fluency. Programs are designed by British Council Certified Trainer Zeb Khan and delivered on site at Dubai and Pakistan offices or online, with a team-level communication report at the end.',
      highlights: J(['Business writing: email, report and proposal', 'Presentation and public-speaking coaching', 'Negotiation and meeting fluency', 'Client-facing communication for sales teams', 'On site at your office or online', 'Team capability report at completion']),
      included: J(['Needs analysis with department heads', 'Custom curriculum per role and level', 'Block delivery on site or online', 'Assessed presentation at completion', 'Team capability report', 'Line-manager debrief']),
      process: J([{ title: 'Needs analysis', detail: 'Role-based communication gaps identified with managers.' },
        { title: 'Curriculum design', detail: 'Custom blocks built around real workplace tasks.' },
        { title: 'Delivery', detail: 'On site or online sessions by role and level.' },
        { title: 'Assessment', detail: 'Business presentation and writing assessed against criteria.' },
        { title: 'Reporting', detail: 'Capability report and coaching recommendations.' }]),
      delivery: 'On site (UAE & Pakistan) or online', duration: '4–12 week programs',
      fee_from: 6500, fee_to: 26000, currency: 'AED',
      fee_notes: 'Quoted per cohort by size, duration and location. A written proposal is issued after needs analysis.',
      location: 'UAE, Pakistan, Online', trainer_id: zeb, sort_order: 13, icon: 'briefcase' },

    { name: 'Career Counseling & CV / Interview Preparation', slug: 'career-counseling-cv', pillar: 'career', type: 'service',
      audience: 'Graduates and professionals planning study or job moves abroad.',
      summary: 'Pathway planning, CV re-engineering, interview practice and a written action plan mapped to your destination.',
      answer_summary: 'Career counseling at Kishaa International maps your qualifications, budget and family situation to realistic study or work pathways abroad. The service includes CV and cover-letter re-engineering, interview practice and a written action plan specifying the country, route, cost and timeline that matches your profile.',
      highlights: J(['Destination and pathway comparison', 'CV and cover-letter re-engineering', 'Interview practice with recorded feedback', 'Budget and timeline modelling', 'Written action plan', 'Follow-up review session']),
      included: J(['90-minute counseling session', 'CV and cover letter rework', 'Mock interview with feedback', 'Written pathway action plan', 'Cost and timeline model', '30-minute follow-up review']),
      process: J([{ title: 'Discovery', detail: 'Goals, qualifications, budget and constraints captured.' },
        { title: 'Options', detail: 'Two or three viable routes compared on cost, timeline and risk.' },
        { title: 'Documents', detail: 'CV, cover letter and statement work re-engineered.' },
        { title: 'Interview practice', detail: 'Recorded mock interview with structured feedback.' },
        { title: 'Action plan', detail: 'Written plan with owners, dates and next steps.' }]),
      delivery: 'In person & online', duration: '2–3 weeks',
      fee_from: 600, fee_to: 1800, currency: 'AED',
      fee_notes: 'Single-session and full-program packages available. Advisory fees are confirmed in writing.',
      location: 'Dubai, Pakistan, Online', sort_order: 14, icon: 'compass' },

    { name: 'Central Asia Study & Visit Pathways', slug: 'central-asia-pathways', pillar: 'career', type: 'study',
      audience: 'Students and travellers considering Kazakhstan, Kyrgyzstan and Tajikistan.',
      summary: 'Low-cost study and visit routes across Central Asia with entry-rule, living-cost and flight guidance.',
      answer_summary: 'Kishaa International advises on Kazakhstan, Kyrgyzstan and Tajikistan study and visit routes, covering entry rules, university options, living costs, flight connections from Pakistan and the UAE, and practical documentation. These are accessible, lower-cost options often used as a first step towards wider mobility.',
      highlights: J(['Kazakhstan, Kyrgyzstan & Tajikistan coverage', 'Low tuition and living costs', 'Entry-rule and documentation guidance', 'Flight connections from ISB, LHE, KHI and DXB', 'Study and visit route options', 'Practical arrival support']),
      included: J(['Country and university comparison', 'Entry rule and document guidance', 'Admission assistance where applicable', 'Flight and budget planning', 'Arrival practicalities', 'Pre-departure briefing']),
      process: J([{ title: 'Route comparison', detail: 'Country and program options compared on cost and outcome.' },
        { title: 'Documentation', detail: 'Admission, invitation and travel documents prepared.' },
        { title: 'Filing', detail: 'Applications submitted to the relevant channel.' },
        { title: 'Travel', detail: 'Flights, accommodation and arrival logistics planned.' }]),
      delivery: 'Online & in person', duration: 'Varies by route',
      fee_from: 500, fee_to: 2500, currency: 'USD',
      fee_notes: 'Advisory fees quoted per route; tuition and consular fees payable directly.',
      location: 'Kazakhstan, Kyrgyzstan, Tajikistan', sort_order: 15, icon: 'caravan' },
  ];
  for (const p of P) {
    if (p.fee_from != null) p.fee_from = Number(p.fee_from);
    if (p.fee_to != null) p.fee_to = Number(p.fee_to);
    ins('programs', { ...p, status: 'published' });
  }
  const progId = (slug) => db.prepare('SELECT id FROM programs WHERE slug = ?').get(slug).id;

  /* -------------------------------------------------------- FEE VERSIONS */
  const fees = [
    { slug: 'canada-10-year-visit-visa', label: 'Canada 10-year LOI visit visa — package', amount: 7500, currency: 'AED', schedule: [{ milestone: 'Submission', amount: 1500 }, { milestone: 'Biometric', amount: 1500 }, { milestone: 'After approval', amount: 4500 }], effective_date: '2026-08-01', source_name: 'Kishaa International published schedule', note: 'In refusal, AED 1,500 is retained; remaining milestones are not charged.' },
    { slug: 'uk-admissions-2027', label: 'UK partner-university tuition band 2027', amount: 11300, currency: 'GBP', schedule: [{ milestone: 'Initial deposit', amount: 4000 }, { milestone: 'Balance', amount: 7300 }], effective_date: '2026-09-01', source_name: 'Partner university fee schedules (2027 cycle)' },
    { slug: 'italy-funded-tuition', label: 'Italy partial-funding tuition — year 1', amount: 3600, currency: 'EUR', schedule: [{ milestone: 'Year 1 (partial funding)', amount: 3600 }, { milestone: 'Year 2+ (fully funded)', amount: 0 }], effective_date: '2026-09-01', source_name: 'Italian university scholarship schedule' },
    { slug: 'finland-family-pathway', label: 'Finland annual tuition', amount: 6500, currency: 'EUR', schedule: [], effective_date: '2026-08-01', source_name: 'Finnish partner institution fee schedule' },
    { slug: 'georgia-medical-tech', label: 'Georgia tuition range per year', amount: 4000, currency: 'USD', schedule: [], effective_date: '2026-08-01', source_name: 'Georgian medical faculty fee schedule' },
  ];
  for (const f of fees) {
    ins('fee_versions', { program_id: progId(f.slug), label: f.label, amount: f.amount, currency: f.currency,
      schedule: JSON.stringify(f.schedule || []), effective_date: f.effective_date, source_name: f.source_name,
      note: f.note || null, review_status: 'approved', version: 'v1', published: 1 });
  }

  /* =========================================================== COUNTRIES */
  const C = [
    { name: 'United Kingdom', slug: 'uk', region: 'Europe', bloc: 'Non-Schengen', iso2: 'GB', flag: 'GB', currency: 'GBP', currency_symbol: '£',
      summary: 'World-ranked universities, MOI acceptance at partner institutions and a defined 28-day maintenance funds rule.',
      answer_summary: 'Studying in the UK for the 2027 intake at Kishaa partner universities costs roughly £11,300–£15,500 in tuition with scholarships up to £5,000 and MOI accepted with or without IELTS. Students must hold maintenance funds — currently £1,483 per month in London or £1,136 outside London, for up to nine months — continuously for 28 days before applying.',
      visa_purposes: J(['study', 'visit', 'work']), processing_time: 'Student route: 3–8 weeks', living_total: 1350, living_currency: 'GBP',
      requirements: J(['Confirmation of Acceptance for Studies (CAS)', 'Maintenance funds held 28 consecutive days', 'TB certificate where applicable', 'ATAS clearance for restricted subjects']),
      highlights: J(['25+ partner universities', 'MOI accepted at partner institutions', 'Scholarships up to £5,000', 'Post-study Graduate Route']),
      cost_note: 'London costs run roughly 35–50% above regional cities. University accommodation in regional cities is significantly cheaper.', featured: 1, sort_order: 1 },
    { name: 'Italy', slug: 'italy', region: 'Europe', bloc: 'EU & Schengen', iso2: 'IT', flag: 'IT', currency: 'EUR', currency_symbol: '€',
      summary: 'English-taught degrees with fully funded scholarship routes, free tuition options and regional DSU support.',
      answer_summary: 'Italy offers English-taught degrees where regional and merit scholarships can cover tuition entirely, with a partial-funding route charging €3,600 in year one. Applicants typically evidence PKR 4.5–5.5 million from the applicant or a blood relative, and free or subsidised accommodation is available in several university cities.',
      visa_purposes: J(['study', 'visit']), processing_time: 'Study visa: 3–6 weeks', living_total: 900, living_currency: 'EUR',
      requirements: J(['Pre-enrolment on the Universitaly portal', 'Declaration of Value or CIMEA statement', 'Proof of accommodation', 'Financial evidence from applicant or blood relative']),
      highlights: J(['Tuition free on funded scholarships', 'Free accommodation options', 'English-taught programs', 'DSU regional grants']),
      cost_note: 'Northern cities such as Milan run materially higher; southern and smaller university cities are far cheaper.', featured: 1, sort_order: 2 },
    { name: 'Finland', slug: 'finland', region: 'Europe', bloc: 'EU & Schengen', iso2: 'FI', flag: 'FI', currency: 'EUR', currency_symbol: '€',
      summary: 'Family-friendly study route with spouse work rights, free schooling for children and a permanent-residence pathway.',
      answer_summary: 'Finnish study programs at partner institutions cost around €6,500 per year, and the statutory funds requirement of €9,600 can cover the student together with dependants. Spouses receive work rights, children school free of charge, and graduates can progress towards permanent residence.',
      visa_purposes: J(['study', 'visit', 'work']), processing_time: 'Residence permit: 4–8 weeks', living_total: 900, living_currency: 'EUR',
      requirements: J(['Acceptance letter from a Finnish institution', '€9,600 in personal funds', 'Valid health insurance', 'Dependant documentation for family permits']),
      highlights: J(['€9,600 covers student + dependants', 'Spouse work rights', 'Free schooling for children', 'TRC and PR pathway']),
      cost_note: 'Helsinki is the most expensive city; Tampere, Turku and Oulu are noticeably cheaper for rent.', featured: 1, sort_order: 3 },
    { name: 'Georgia', slug: 'georgia', region: 'Middle East & Eurasia', bloc: 'Non-Schengen', iso2: 'GE', flag: 'GE', currency: 'USD', currency_symbol: '$',
      summary: 'Low-cost MBBS and technology degrees with study gaps accepted and no IELTS requirement for qualifying applicants.',
      answer_summary: 'Georgian universities offer MBBS and BDS programs from roughly $4,000–$5,000 per year with broader tuition of $2,000–$8,000, recognised by MCI and WHO listings. Study gaps are accepted, IELTS is not required for qualifying applicants, and monthly living costs are around $1,100.',
      visa_purposes: J(['study', 'visit']), processing_time: 'Study visa: 2–4 weeks', living_total: 1100, living_currency: 'USD',
      requirements: J(['Invitation letter from the university', 'Attested academic documents', 'Tuition payment receipts', 'Medical insurance']),
      highlights: J(['MBBS/BDS $4,000–$5,000 per year', 'MCI & WHO recognised options', 'No IELTS for qualifying applicants', 'Study gaps accepted']),
      cost_note: 'Tbilisi is pricier than Batumi or Kutaisi. Student hostels reduce monthly rent considerably.', featured: 1, sort_order: 4 },
    { name: 'Germany', slug: 'germany', region: 'Europe', bloc: 'EU & Schengen', iso2: 'DE', flag: 'DE', currency: 'EUR', currency_symbol: '€',
      summary: 'Low or zero public tuition with a mandatory blocked account for proof of funds.',
      answer_summary: 'German public universities charge little or no tuition, but applicants must fund a blocked account (Sperrkonto) of €11,904 for twelve months — a €992 monthly payout — under § 16b AufenthG. The amount tracks the BAföG support rate and rises periodically, so confirm the current figure before transferring.',
      visa_purposes: J(['study', 'work', 'visit']), processing_time: 'National visa: 6–12 weeks', living_total: 992, living_currency: 'EUR',
      requirements: J(['Blocked account (Sperrkonto) funding', 'University admission letter', 'APS certificate for applicants from certain countries', 'Proof of health insurance']),
      highlights: J(['Low or no tuition at public universities', 'Blocked account €11,904 for 12 months', '18-month post-study job-seeking permit', 'Strong engineering and research base']),
      cost_note: 'Munich and Frankfurt are the most expensive; Leipzig, Dresden and smaller university towns are significantly cheaper.', featured: 1, sort_order: 5 },
    { name: 'France', slug: 'france', region: 'Europe', bloc: 'EU & Schengen', iso2: 'FR', flag: 'FR', currency: 'EUR', currency_symbol: '€',
      summary: 'Campus France route with comparatively low public tuition and broad English-taught options.',
      answer_summary: 'France routes study applications through Campus France, with public university tuition far below UK levels and a growing catalogue of English-taught masters. Applicants must evidence monthly living costs and accommodation, and there are no work restrictions preventing part-time employment during study.',
      visa_purposes: J(['study', 'visit']), processing_time: 'Study visa: 3–8 weeks', living_total: 1100, living_currency: 'EUR',
      requirements: J(['Campus France procedure completed', 'Proof of accommodation', 'Financial guarantee or sponsor evidence', 'Language evidence per program']),
      highlights: J(['Low public tuition', 'English-taught masters', 'Campus France procedural support', 'Part-time work permitted']),
      cost_note: 'Paris costs roughly 40% more than Lyon, Toulouse or Lille. CROUS student housing is limited and oversubscribed.', sort_order: 6 },
    { name: 'Portugal', slug: 'portugal', region: 'Europe', bloc: 'EU & Schengen', iso2: 'PT', flag: 'PT', currency: 'EUR', currency_symbol: '€',
      summary: 'Affordable European study and residence options including the D8 digital-nomad route for remote professionals.',
      answer_summary: 'Portugal combines affordable university tuition with residence routes such as the D8 digital-nomad visa. Living costs sit well below northern Europe outside Lisbon and Porto, and the country offers a defined path from residence to permanent status.',
      visa_purposes: J(['study', 'work', 'visit']), processing_time: '4–12 weeks by route', living_total: 900, living_currency: 'EUR',
      requirements: J(['Proof of accommodation', 'Financial self-sufficiency evidence', 'Health insurance', 'Criminal record certificate']),
      highlights: J(['D8 digital-nomad residence route', 'Low living costs outside Lisbon', 'English-taught programs', 'Residence to permanent residence path']),
      cost_note: 'Lisbon and Porto have risen sharply; Braga, Coimbra and Covilhã remain inexpensive.', sort_order: 7 },
    { name: 'Serbia', slug: 'serbia', region: 'Europe', bloc: 'Non-Schengen', iso2: 'RS', flag: 'RS', currency: 'EUR', currency_symbol: '€',
      summary: 'Accessible work-permit and study pathways with realistic costs and a visa-free entry position for many passports.',
      answer_summary: 'Serbia offers work-permit and study pathways at a fraction of Western European costs. Many nationalities, including Pakistani and UAE-resident applicants, receive visa-free or simplified entry, and temporary residence permits can be converted to longer-stay status.',
      visa_purposes: J(['study', 'work', 'visit']), processing_time: '2–10 weeks by route', living_total: 650, living_currency: 'EUR',
      requirements: J(['Employer or institution documentation', 'Proof of accommodation', 'Health insurance', 'Registration within 24 hours of arrival']),
      highlights: J(['Low living costs', 'Simplified entry for many nationalities', 'Work-permit employer routes', 'Affordable university option']),
      cost_note: 'Belgrade is the most expensive city; Novi Sad and Niš are cheaper.', sort_order: 8 },
    { name: 'Romania', slug: 'romania', region: 'Europe', bloc: 'EU & Schengen (air/sea)', iso2: 'RO', flag: 'RO', currency: 'EUR', currency_symbol: '€',
      summary: 'EU membership with work-permit routes and a well-defined long-stay visa process for non-EU applicants.',
      answer_summary: 'Romania combines EU membership with comparatively low living costs and defined work-permit routes. Long-stay visa applicants must show employment approval, accommodation evidence and financial means; quotas for non-EU workers are released annually and fill quickly.',
      visa_purposes: J(['work', 'study', 'visit']), processing_time: '6–14 weeks', living_total: 700, living_currency: 'EUR',
      requirements: J(['Work permit approval from the immigration inspectorate', 'Accommodation evidence', 'Criminal record certificate', 'Financial means proof']),
      highlights: J(['EU member state', 'Annual work-permit quota', 'Low living costs', 'Family reunification possible']),
      cost_note: 'Bucharest and Cluj are the most expensive; smaller cities offer very low rents.', sort_order: 9 },
    { name: 'Canada', slug: 'canada', region: 'North America', bloc: '—', iso2: 'CA', flag: 'CA', currency: 'CAD', currency_symbol: 'C$',
      summary: 'Ten-year multiple-entry visit visas with business LOI support, plus study and family sponsorship routes.',
      answer_summary: 'Kishaa International prepares Canada ten-year multiple-entry visit visas including a business Invitation Letter and sponsor letter, with IRCC and VFS biometric fees included in an AED 7,500 package paid in three milestones. Processing typically takes 60–70 days and visitors may stay up to six months per visit. Study and family routes are supported separately.',
      visa_purposes: J(['visit', 'study', 'business']), processing_time: 'Visit visa: 60–70 days', living_total: 1600, living_currency: 'CAD',
      requirements: J(['Business Invitation Letter (for the LOI visit route)', 'Sponsor letter where applicable', 'Six-month bank statement evidence', 'Biometrics appointment at VFS']),
      highlights: J(['10-year multiple entry objective', 'Business LOI prepared', 'IRCC & VFS biometrics included', 'Up to 6 months per visit']),
      cost_note: 'Toronto and Vancouver run far above Montreal, Calgary and Winnipeg for rent.', featured: 1, sort_order: 10 },
    { name: 'United States', slug: 'usa', region: 'North America', bloc: '—', iso2: 'US', flag: 'US', currency: 'USD', currency_symbol: '$',
      summary: 'F-1 study and B1/B2 visit routes requiring documented funding and strong ties evidence.',
      answer_summary: 'United States study applications use the F-1 route with an I-20 and SEVIS payment, while visitor visas use B1/B2. Applicants must evidence funding for the first academic year and demonstrate strong ties to their home country; interview scheduling timelines vary significantly by consulate.',
      visa_purposes: J(['study', 'visit', 'business']), processing_time: 'Varies widely by consulate', living_total: 1800, living_currency: 'USD',
      requirements: J(['I-20 from a SEVP-certified institution', 'SEVIS fee payment', 'Financial evidence for year one', 'Strong ties documentation']),
      highlights: J(['F-1 study and B1/B2 visit routes', 'Scholarship and assistantship guidance', 'Visa interview preparation', 'OPT and CPT pathway briefing']),
      cost_note: 'Tuition varies enormously between public and private institutions; add 25–40% for major coastal cities.', sort_order: 11 },
    { name: 'Australia', slug: 'australia', region: 'Oceania', bloc: '—', iso2: 'AU', flag: 'AU', currency: 'AUD', currency_symbol: 'A$',
      summary: 'Subclass 500 student visa with defined financial capacity evidence and post-study work rights.',
      answer_summary: 'Australia uses the subclass 500 student visa, which requires evidence of financial capacity for living costs, tuition and travel. Post-study work rights follow the qualification level, and the financial capacity figure is adjusted periodically by the Department of Home Affairs — confirm the current amount before lodging.',
      visa_purposes: J(['study', 'visit', 'work']), processing_time: 'Student visa: 4–12 weeks', living_total: 2600, living_currency: 'AUD',
      requirements: J(['CoE from a CRICOS-registered provider', 'Genuine Student requirement evidence', 'OSHC health cover', 'English test results per provider']),
      highlights: J(['Subclass 500 student route', 'Post-study work rights', 'OSHC arranged with health cover', 'Skilled migration pathway planning']),
      cost_note: 'Sydney and Melbourne are the costliest; Adelaide, Perth and Brisbane are more affordable.', sort_order: 12 },
    { name: 'Turkey', slug: 'turkey', region: 'Middle East & Eurasia', bloc: 'Non-Schengen', iso2: 'TR', flag: 'TR', currency: 'USD', currency_symbol: '$',
      summary: 'Study, work and visit routes with specialist support for Afghan passport holders resident in the UAE.',
      answer_summary: 'Turkey offers study and work routes with relatively low tuition, and a specific entry route for Afghan passport holders legally resident in the UAE using Emirates ID. Requirements change frequently, so Kishaa International confirms the current position at enquiry stage rather than relying on cached guidance.',
      visa_purposes: J(['study', 'work', 'visit']), processing_time: '2–6 weeks by route', living_total: 800, living_currency: 'USD',
      requirements: J(['University acceptance or work permit', 'Valid residency evidence where applicable', 'Health insurance', 'Financial means proof']),
      highlights: J(['Afghan passport Emirates ID route', 'Low tuition universities', 'Istanbul and Ankara campuses', 'Regional travel hub']),
      cost_note: 'Istanbul is considerably more expensive than Ankara, Izmir or Antalya.', featured: 1, sort_order: 13 },
    { name: 'United Arab Emirates', slug: 'uae', region: 'Middle East & Eurasia', bloc: 'GCC', iso2: 'AE', flag: 'AE', currency: 'AED', currency_symbol: 'AED ',
      summary: 'Home base for Kishaa International with Golden, Freelance, Family and Visit visa categories through PRO and GDRFA routes.',
      answer_summary: 'The UAE hosts Kishaa International’s headquarters in Dubai. The team files Golden Visa, Freelance Permit, Family Sponsorship and Visit Visa applications through PRO services with GDRFA-approved processing, covering eligibility assessment, attestation, medical, Emirates ID and residency stamping.',
      visa_purposes: J(['work', 'visit', 'business']), processing_time: '5–20 working days', living_total: 4200, living_currency: 'AED',
      requirements: J(['Attested educational or professional documents', 'Passport valid 6+ months', 'Medical fitness test', 'Emirates ID enrolment']),
      highlights: J(['Golden Visa categories', 'Freelance permit route', 'Family sponsorship', 'PRO & GDRFA filings']),
      cost_note: 'Dubai rents vary sharply by community; Deira and Al Nahda are far cheaper than Downtown or Marina.', featured: 1, sort_order: 14 },
    { name: 'Russia', slug: 'russia', region: 'Middle East & Eurasia', bloc: 'Non-Schengen', iso2: 'RU', flag: 'RU', currency: 'USD', currency_symbol: '$',
      summary: 'Low-cost medical and engineering programs with government quota scholarship options.',
      answer_summary: 'Russia offers low-cost medical and engineering degrees, with a limited number of government quota scholarships available through competitive selection. Tuition at reputable medical universities is a fraction of Western levels and living costs outside Moscow and St Petersburg are low.',
      visa_purposes: J(['study', 'work', 'visit']), processing_time: '2–6 weeks', living_total: 700, living_currency: 'USD',
      requirements: J(['University invitation letter', 'Attested academic documents', 'Health certificate and HIV test', 'Financial evidence']),
      highlights: J(['Low-cost medical programs', 'Government quota scholarships', 'Invitation-based visa process', 'Low living costs outside major cities']),
      cost_note: 'Moscow and St Petersburg cost roughly double regional university cities.', sort_order: 15 },
    { name: 'Kazakhstan', slug: 'kazakhstan', region: 'Central Asia', bloc: 'EAEU', iso2: 'KZ', flag: 'KZ', currency: 'USD', currency_symbol: '$',
      summary: 'Cost-effective study and visit option with strong flight connectivity from Pakistan and the UAE.',
      answer_summary: 'Kazakhstan provides cost-effective study and visit options with good flight connectivity from Pakistan and the UAE. Entry rules are simplified for many nationalities, university tuition is low, and living costs in Almaty and Astana remain well below European levels.',
      visa_purposes: J(['study', 'visit']), processing_time: '1–4 weeks', living_total: 600, living_currency: 'USD',
      requirements: J(['Invitation or admission letter', 'Accommodation registration', 'Health insurance', 'Financial means evidence']),
      highlights: J(['Short flights from ISB/LHE/DXB', 'Low tuition options', 'Simplified entry for many nationalities', 'Growing university sector']),
      cost_note: 'Almaty is the most expensive city; Shymkent and Turkistan are considerably cheaper.', sort_order: 16 },
    { name: 'Kyrgyzstan', slug: 'kyrgyzstan', region: 'Central Asia', bloc: 'EAEU', iso2: 'KG', flag: 'KG', currency: 'USD', currency_symbol: '$',
      summary: 'Very low-cost study route popular for medical programs with a straightforward admission process.',
      answer_summary: 'Kyrgyzstan offers very low-cost university education, particularly in medicine, with a straightforward admission process and no entrance examination for many programs. Living costs are among the lowest in the region, and Bishkek hosts the majority of institutions.',
      visa_purposes: J(['study', 'visit']), processing_time: '1–3 weeks', living_total: 450, living_currency: 'USD',
      requirements: J(['University admission letter', 'Attested academic documents', 'Health certificate', 'Accommodation registration']),
      highlights: J(['Very low tuition and living costs', 'Medical program options', 'Simple admission process', 'Bishkek student community']),
      cost_note: 'Bishkek dominates the market; expect budget hostel accommodation under $200 per month.', sort_order: 17 },
    { name: 'Tajikistan', slug: 'tajikistan', region: 'Central Asia', bloc: 'CIS', iso2: 'TJ', flag: 'TJ', currency: 'USD', currency_symbol: '$',
      summary: 'Lowest-cost regional study and visit option with defined visa-on-arrival processes for many nationalities.',
      answer_summary: 'Tajikistan is the lowest-cost option in the Central Asian group, with visa-on-arrival facilities for many nationalities and low university fees. Infrastructure and program choice are more limited than Kazakhstan or Kyrgyzstan, so route selection should be matched carefully to career goals.',
      visa_purposes: J(['study', 'visit']), processing_time: '1–3 weeks', living_total: 400, living_currency: 'USD',
      requirements: J(['Invitation letter where required', 'Registration with OVIR within 10 days', 'Health insurance', 'Financial evidence']),
      highlights: J(['Lowest regional living costs', 'Simplified entry processes', 'Remote study options', 'Gateway to Central Asia']),
      cost_note: 'Dushanbe is the only major urban centre; costs elsewhere are very low.', sort_order: 18 },
  ];
  for (const c of C) ins('countries', { ...c, published: 1 });
  const cid = (slug) => db.prepare('SELECT id FROM countries WHERE slug = ?').get(slug).id;

  /* ----------------------------------------------------- LIVING COST PROFILES */
  const cost = (slug, city, tier, scenario, rent, food, transit, insurance, utilities, contingency, currency, source) =>
    ins('country_costs', { country_id: cid(slug), city, city_tier: tier, scenario,
      rent, food, transit, insurance, utilities, contingency,
      total: rent + food + transit + insurance + utilities + contingency,
      currency, source_name: source, source_url: source.includes('Numbeo') ? 'https://www.numbeo.com/cost-of-living/' : null,
      observed_at: '2026-08-15', review_status: 'approved' });

  const N = 'Numbeo city indices + national statistics (maintained semi-annually)';
  const O = 'National statistics office / university cost-of-living survey';
  // UK
  cost('uk','London','capital','budget',780,300,160,45,110,80,'GBP','UKVI guidance + Numbeo'); 
  cost('uk','London','capital','standard',1150,420,165,60,150,140,'GBP','UKVI guidance + Numbeo');
  cost('uk','London','capital','comfortable',1750,650,180,80,220,250,'GBP','UKVI guidance + Numbeo');
  cost('uk','Birmingham','major','standard',650,300,95,45,120,110,'GBP',N);
  cost('uk','Manchester','major','standard',700,310,100,45,125,115,'GBP',N);
  cost('uk','Glasgow','regional','budget',520,250,80,40,105,90,'GBP',N);
  // Italy
  cost('italy','Milan','major','standard',600,320,45,35,110,90,'EUR',N);
  cost('italy','Rome','capital','standard',550,330,40,35,120,90,'EUR',N);
  cost('italy','Bologna','regional','budget',380,260,38,30,95,70,'EUR',O);
  cost('italy','Naples','regional','budget',300,230,30,28,85,60,'EUR',O);
  // Finland
  cost('finland','Helsinki','capital','standard',520,300,60,45,110,85,'EUR',O);
  cost('finland','Tampere','major','budget',380,250,55,40,95,70,'EUR',O);
  cost('finland','Oulu','regional','budget',320,230,50,38,90,65,'EUR',O);
  // Georgia
  cost('georgia','Tbilisi','capital','standard',350,320,30,45,70,110,'USD','Georgian national statistics + Numbeo');
  cost('georgia','Tbilisi','capital','budget',200,240,25,40,60,80,'USD','Georgian national statistics + Numbeo');
  cost('georgia','Batumi','regional','budget',180,230,25,40,55,75,'USD',N);
  // Germany
  cost('germany','Berlin','capital','standard',650,350,63,110,150,90,'EUR','DAAD + Numbeo');
  cost('germany','Munich','major','standard',760,380,63,115,170,95,'EUR','DAAD + Numbeo');
  cost('germany','Leipzig','regional','budget',360,280,63,110,140,70,'EUR','DAAD + Numbeo');
  // France
  cost('france','Paris','capital','standard',850,400,75,45,140,120,'EUR',O);
  cost('france','Lyon','major','budget',520,320,60,40,115,90,'EUR',O);
  cost('france','Toulouse','regional','budget',460,300,55,38,110,85,'EUR',O);
  // Portugal
  cost('portugal','Lisbon','capital','standard',680,330,40,45,110,95,'EUR',N);
  cost('portugal','Coimbra','regional','budget',330,260,30,35,90,65,'EUR',O);
  // Serbia / Romania
  cost('serbia','Belgrade','capital','standard',380,280,35,35,90,70,'EUR',N);
  cost('romania','Bucharest','capital','standard',400,290,35,35,95,75,'EUR',N);
  cost('romania','Cluj-Napoca','major','standard',380,280,32,35,90,70,'EUR',N);
  // Canada
  cost('canada','Toronto','major','standard',1300,550,156,80,140,150,'CAD','IRCC 6-month funds guidance + Numbeo');
  cost('canada','Vancouver','major','standard',1400,570,120,80,145,160,'CAD','IRCC 6-month funds guidance + Numbeo');
  cost('canada','Montreal','regional','budget',800,420,95,70,120,110,'CAD',N);
  // USA / Australia
  cost('usa','New York','major','standard',1800,650,132,180,180,220,'USD',N);
  cost('usa','Boston','major','standard',1500,600,90,170,170,190,'USD',N);
  cost('usa','Austin','regional','budget',1050,480,45,160,160,150,'USD',N);
  cost('australia','Sydney','major','standard',1600,650,200,60,180,200,'AUD','Home Affairs financial capacity + Numbeo');
  cost('australia','Adelaide','regional','budget',950,500,120,55,150,140,'AUD',N);
  // Turkey / UAE / Russia
  cost('turkey','Istanbul','major','standard',450,280,30,45,90,90,'USD',N);
  cost('turkey','Ankara','capital','budget',320,240,25,40,80,70,'USD',N);
  cost('uae','Dubai','major','standard',2600,900,300,150,350,300,'AED','Dubai Statistics Centre + market data');
  cost('uae','Dubai','major','budget',1500,700,300,140,300,220,'AED','Dubai Statistics Centre + market data');
  cost('uae','Sharjah','regional','budget',1100,600,300,140,280,200,'AED',N);
  cost('russia','Moscow','capital','standard',500,300,25,50,90,90,'USD',N);
  cost('russia','Kazan','regional','budget',250,220,20,45,75,65,'USD',N);
  // Central Asia
  cost('kazakhstan','Almaty','major','standard',380,240,20,45,70,70,'USD',N);
  cost('kazakhstan','Shymkent','regional','budget',200,180,15,40,55,50,'USD',N);
  cost('kyrgyzstan','Bishkek','capital','standard',220,180,15,40,55,50,'USD',N);
  cost('kyrgyzstan','Bishkek','capital','budget',130,140,12,35,45,35,'USD',N);
  cost('tajikistan','Dushanbe','capital','standard',200,160,12,38,50,45,'USD',N);

  /* ------------------------------------------------------- STATUTORY FUNDS */
  const rule = (slug, o) => ins('funds_rules', { country_id: cid(slug), published: 1, version: 'v1', ...o });
  rule('uk', { route_name: 'Student route — maintenance (London)', visa_purpose: 'study', rule_type: 'maintenance',
    statutory_rate: 1483, rate_currency: 'GBP', months: 9, total_required: 13347, total_currency: 'GBP', pkr_equivalent: 4750000,
    holding_period: '28 consecutive days, ending no more than 31 days before application',
    tuition_component: 'First year tuition (or full course fee if under one year) is required in addition',
    dependents_note: '£845 per month per dependant in London, capped at 9 months',
    family_rule: 'Dependants permitted for research masters, PhD and government-sponsored courses.',
    source_name: 'UK Visas & Immigration — Appendix Student', source_url: 'https://www.gov.uk/student-visa/money',
    effective_date: '2025-01-02', review_status: 'approved', reviewed_at: '2026-08-15',
    note: 'A 2026 uplift to £1,529 (London) / £1,171 (outside London) has been reported and is queued for rule review as v2.' });
  rule('uk', { route_name: 'Student route — maintenance (outside London)', visa_purpose: 'study', rule_type: 'maintenance',
    statutory_rate: 1136, rate_currency: 'GBP', months: 9, total_required: 10224, total_currency: 'GBP', pkr_equivalent: 3640000,
    holding_period: '28 consecutive days', tuition_component: 'Tuition payable in addition',
    dependents_note: '£680 per month per dependant outside London, capped at 9 months',
    source_name: 'UK Visas & Immigration — Appendix Student', source_url: 'https://www.gov.uk/student-visa/money',
    effective_date: '2025-01-02', review_status: 'approved', reviewed_at: '2026-08-15' });
  rule('italy', { route_name: 'Study visa — financial self-sufficiency', visa_purpose: 'study', rule_type: 'held_funds',
    statutory_rate: null, months: 12, total_required: null, total_currency: 'PKR', pkr_equivalent: 5000000,
    holding_period: 'Held and documented at the time of application',
    tuition_component: 'Tuition may be zero on a fully funded scholarship; €3,600 in year 1 on the partial route.',
    family_rule: 'Funds may be provided by the applicant or a blood relative, with relationship evidence.',
    dependents_note: 'Additional documented funds required per dependant',
    source_name: 'Italian Ministry of Foreign Affairs / embassy financial requirements', source_url: 'https://vistoperitalia.esteri.it/',
    effective_date: '2026-03-01', review_status: 'approved', reviewed_at: '2026-09-01',
    note: 'Brief specifies PKR 4.5–5.5 million accepted; PKR 5,000,000 is used as the mid planning figure.' });
  rule('finland', { route_name: 'Residence permit — student funds (covers dependants)', visa_purpose: 'study', rule_type: 'maintenance',
    statutory_rate: 800, rate_currency: 'EUR', months: 12, total_required: 9600, total_currency: 'EUR', pkr_equivalent: 3100000,
    holding_period: 'Available in the applicant’s own account at application',
    tuition_component: 'Tuition approx. €6,500 per year is required in addition where applicable',
    dependents_note: '€9,600 covers the student and dependants — uniquely no separate dependant surcharge beyond documented family costs',
    family_rule: 'Spouse receives work rights; children receive free education.',
    source_name: 'Migri (Finnish Immigration Service)', source_url: 'https://migri.fi/en/studying',
    effective_date: '2025-01-01', review_status: 'approved', reviewed_at: '2026-08-20',
    note: 'Statutory figure raised from €6,720 to €9,600; covers student plus dependants per published Migri guidance.' });
  rule('germany', { route_name: 'Studienkolleg/Student visa — blocked account (Sperrkonto)', visa_purpose: 'study', rule_type: 'blocked_account',
    statutory_rate: 992, rate_currency: 'EUR', months: 12, total_required: 11904, total_currency: 'EUR', pkr_equivalent: 3850000,
    holding_period: 'Deposited into a blocked account before the visa is issued; released at €992 per month',
    tuition_component: 'Public university tuition is typically nil; semester contribution approx. €150–€400',
    dependents_note: 'Additional funds required per dependant spouse or child',
    family_rule: 'Dependant spouse requires proof of additional funds and health insurance.',
    source_name: 'German Federal Foreign Office / § 16b AufenthG (BAföG-linked rate)', source_url: 'https://www.auswaertiges-amt.de/en/visa-service',
    effective_date: '2025-09-01', review_status: 'approved', reviewed_at: '2026-08-18',
    note: 'Amount tracks the BAföG rate and rises periodically. Confirm the current figure before transferring.' });
  rule('australia', { route_name: 'Subclass 500 — financial capacity', visa_purpose: 'study', rule_type: 'maintenance',
    statutory_rate: 2475, rate_currency: 'AUD', months: 12, total_required: 29710, total_currency: 'AUD', pkr_equivalent: null,
    holding_period: 'Evidenced at application; genuine access required',
    tuition_component: 'Tuition for the first 12 months is required in addition',
    dependents_note: 'Additional amounts required for partner and each child',
    source_name: 'Australian Department of Home Affairs — student visa financial capacity',
    source_url: 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500',
    effective_date: '2024-05-10', review_status: 'needs_review', reviewed_at: '2026-08-15',
    note: 'Quarterly update expected. Held back from automatic calculation until the rule reviewer confirms the current indexed amount.' });
  rule('canada', { route_name: 'Visitor visa (10-year multiple entry) — funds evidence', visa_purpose: 'visit', rule_type: 'held_funds',
    statutory_rate: null, months: 6, total_required: null, total_currency: 'CAD',
    holding_period: 'Six months of statements showing stable, explainable balances',
    tuition_component: 'Not applicable to the visit route',
    family_rule: 'Sponsor letter and sponsor financial evidence strengthen the file where the applicant’s own funds are limited.',
    dependents_note: 'Additional funds per accompanying family member',
    source_name: 'IRCC visitor visa documentation guidance (Kishaa file standard: 6-month evidence)',
    source_url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada.html',
    effective_date: '2026-08-01', review_status: 'approved', reviewed_at: '2026-09-01',
    note: 'No fixed statutory minimum applies to visitors; Kishaa plans on six months of documented funds plus business LOI and sponsor letters.' });
  rule('uae', { route_name: 'Golden Visa / Freelance permit — financial criteria', visa_purpose: 'work', rule_type: 'held_funds',
    statutory_rate: null, months: 12, total_required: null, total_currency: 'AED',
    holding_period: 'Evidenced at application; categories differ',
    source_name: 'GDRFA / ICP published category criteria', source_url: 'https://icp.gov.ae/',
    effective_date: '2026-06-01', review_status: 'needs_review', reviewed_at: '2026-07-01',
    note: 'Category criteria are updated by ICP/GDRFA without a fixed cycle. A rule reviewer must confirm the current thresholds for the applicant’s category.' });
  rule('georgia', { route_name: 'Study — tuition and living evidence', visa_purpose: 'study', rule_type: 'held_funds',
    statutory_rate: 1100, rate_currency: 'USD', months: 12, total_required: 13200, total_currency: 'USD',
    holding_period: 'Evidenced at application', tuition_component: 'Tuition $2,000–$8,000 per year payable to the institution',
    dependents_note: 'Additional documented funds per dependant',
    source_name: 'Georgian university admission requirements + Kishaa maintained profile',
    source_url: 'https://www.mfa.gov.ge/', effective_date: '2026-06-01', review_status: 'approved', reviewed_at: '2026-08-15',
    note: 'Institutions specify tuition and reasonable living means; the $1,100/month living figure is a maintained estimate.' });

  /* --------------------------------------------------------- FLIGHT ROUTES */
  const R = [
    ['ISB','Islamabad'],['LHE','Lahore'],['KHI','Karachi'],['DXB','Dubai'],['PEW','Peshawar'],
  ];
  const D = [
    ['LHR','London','uk',76000,14000,9500,4200,'PKR'],['MAN','Manchester','uk',79000,14000,9500,4200,'PKR'],
    ['FCO','Rome','italy',71000,13000,8800,3900,'PKR'],['MXP','Milan','italy',69000,13000,8600,3900,'PKR'],
    ['HEL','Helsinki','finland',82000,15000,10500,4500,'PKR'],['TBS','Tbilisi','georgia',58000,11000,7200,3400,'PKR'],
    ['FRA','Frankfurt','germany',72000,13500,9000,4000,'PKR'],['CDG','Paris','france',74000,13500,9200,4000,'PKR'],
    ['LIS','Lisbon','portugal',78000,14000,9800,4200,'PKR'],['BEG','Belgrade','serbia',64000,12000,8000,3600,'PKR'],
    ['OTP','Bucharest','romania',66000,12500,8200,3700,'PKR'],['YYZ','Toronto','canada',118000,19500,14200,6000,'PKR'],
    ['JFK','New York','usa',132000,21000,16000,6500,'PKR'],['SYD','Sydney','australia',142000,23000,17500,7000,'PKR'],
    ['IST','Istanbul','turkey',52000,10000,6500,3000,'PKR'],['DXB','Dubai','uae',38000,7500,4800,2400,'PKR'],
    ['SVO','Moscow','russia',68000,12500,8500,3800,'PKR'],['ALA','Almaty','kazakhstan',48000,9000,6000,2800,'PKR'],
    ['FRU','Bishkek','kyrgyzstan',46000,8500,5800,2700,'PKR'],['DYU','Dushanbe','tajikistan',44000,8500,5600,2600,'PKR'],
  ];
  for (const [code, city] of R) {
    for (const [dcode, dcity, cslug, base, taxes, fuel, bag, cur] of D) {
      if (code === 'DXB' && cslug === 'uae') continue;
      // Dubai departures are priced in AED for a proportionate local market
      const isDxb = code === 'DXB';
      const factor = isDxb ? 0.055 : 1;
      const currency = isDxb ? 'AED' : cur;
      ins('flight_routes', {
        origin_code: code, origin_city: city, dest_code: dcode, dest_city: dcity,
        dest_country_id: cid(cslug),
        base_fare: Math.round(base * factor * 100) / 100, taxes: Math.round(taxes * factor * 100) / 100,
        fuel_surcharge: Math.round(fuel * factor * 100) / 100, baggage_allowance: Math.round(bag * factor * 100) / 100,
        currency, provider: 'route-matrix',
      });
    }
  }

  /* ============================================================== MENUS */
  const header = [['Home','/'],['Career Counseling','/career-counseling'],['Immigration Consultancy','/immigration-consultancy'],
    ['Cambridge Courses','/cambridge-courses'],['Destinations & Costs','/destinations'],['Meet Zeb Khan','/team/zeb-khan'],
    ['Reviews','/reviews'],['Contact','/contact']];
  header.forEach(([label, url], i) => ins('menus', { location: 'header', label, url, sort_order: i }));
  const utility = [['Cost Planner','/cost-planner'],['Resources','/resources'],['Bank Statement Rules','/bank-statements'],
    ['FAQs','/faq'],['About Us','/about-us'],['Sitemap','/sitemap']];
  utility.forEach(([label, url], i) => ins('menus', { location: 'utility', label, url, sort_order: i }));
  const destMenu = db.prepare('SELECT name, slug FROM countries WHERE published = 1 ORDER BY sort_order').all()
    .map((c, i) => ins('menus', { location: 'footer_destinations', label: c.name, url: '/destinations/' + c.slug, sort_order: i }));
  const svcMenu = [['Career Counseling','/career-counseling'],['Immigration Consultancy','/immigration-consultancy'],
    ['Cambridge Courses','/cambridge-courses'],['IELTS Preparation','/services/ielts-preparation'],
    ['UK Admissions 2027','/services/uk-admissions-2027'],['Canada 10-Yr Visit Visa','/services/canada-10-year-visit-visa'],
    ['UAE Golden & Freelance','/services/uae-visas-pro-gdrfa'],['Cost Planner','/cost-planner']];
  svcMenu.forEach(([label, url], i) => ins('menus', { location: 'footer_service', label, url, sort_order: i }));

  /* =========================================================== REDIRECTS */
  const redirects = [
    ['/exam-help/','/cambridge-courses','Legacy WordPress page — exam help mapped to Cambridge & IELTS hub'],
    ['/visa-consultancy/','/immigration-consultancy','Legacy WordPress page — mapped to Immigration Consultancy hub'],
    ['/courses/','/cambridge-courses','Legacy WordPress page — courses mapped to Cambridge Courses'],
    ['/news-and-events/','/resources','Legacy WordPress page — mapped to Resources hub'],
    ['/exam-help','/cambridge-courses','Legacy WordPress page (no trailing slash)'],
    ['/visa-consultancy','/immigration-consultancy','Legacy WordPress page (no trailing slash)'],
    ['/courses','/cambridge-courses','Legacy WordPress page (no trailing slash)'],
    ['/news-and-events','/resources','Legacy WordPress page (no trailing slash)'],
    ['/ielts/','/services/ielts-preparation','Legacy IELTS landing path'],
    ['/zeb-khan/','/team/zeb-khan','Legacy trainer path'],
    ['/cost-calculator/','/cost-planner','Legacy calculator path'],
    ['/?p=1','/','Legacy WordPress permalink form'],
    ['/wp-admin','/','Legacy admin path redirected — no WordPress runtime exists here'],
    ['/feed','/feed.xml','Legacy RSS path normalised to the new feed'],
  ];
  redirects.forEach(([from, to, note]) => ins('redirects', { from_path: from, to_path: to, note, type: 301 }));

  return { zebId: zeb, ayeshaId: ayesha, progId, cid, cats, ins };
};

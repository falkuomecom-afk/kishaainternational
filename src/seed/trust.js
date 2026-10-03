'use strict';
/** Trust layer seed: review cache, media-feed cache, testimonials, FAQs, integrations, events. */
module.exports = function seedTrust(db, ctx) {
  const ins = ctx.ins;
  const J = JSON.stringify;
  const cid = ctx.cid;
  const progId = ctx.progId;
  const zeb = ctx.zebId;

  /* -------------------------------------------------- REVIEW AGGREGATES */
  const aggs = [
    ['google', 4.9, 214, 'https://g.page/kishaainternational', 'Rated among the top career-counselling and immigration consultancies listed for Dubai on Google Business Profile.', 'connected'],
    ['facebook', 4.8, 96, 'https://www.facebook.com/kishaainternational', 'Recommendations from students, professionals and families across the UAE and Pakistan.', 'connected'],
    ['trustpilot', 4.7, 63, 'https://www.trustpilot.com/review/kishaainternational.com', 'TrustScore from verified reviewers; compliance badges displayed on the profile.', 'connected'],
  ];
  for (const [platform, score, count, url, note, status] of aggs) {
    ins('review_aggregates', { platform, score, review_count: count, profile_url: url, ranking_note: note,
      retrieved_at: new Date().toISOString().slice(0, 19).replace('T', ' '), token_status: status, mode: 'cache' });
  }

  /* --------------------------------------------------------- REVIEW CACHE */
  const reviews = [
    ['google', 5, 'Hamza R.', 'The UK 2027 admissions guidance was genuinely honest. They told me which two universities were unrealistic for my budget instead of taking my deposit and hoping. Fund planning for the 28-day rule was explained step by step.', 'uk'],
    ['google', 5, 'Nadia S.', 'Zeb Khan’s IELTS course got me from 6.5 to 7.5 in ten weeks. What made the difference was written feedback on every essay — I could see exactly where I was losing band.', null],
    ['google', 5, 'Bilal A.', 'Canada 10-year visit visa filed with the business LOI and sponsor letter. Clear milestones, nothing hidden, and they explained the refusal scenarios up front rather than promising a result.', 'canada'],
    ['google', 4, 'Fatima K.', 'Italy scholarship application was handled well and the bank statement was structured correctly the first time. Took a little longer than I hoped, but they were upfront about the timeline.', 'italy'],
    ['google', 5, 'Muhammad T.', 'Finland route for my whole family — spouse work rights and school for the kids explained clearly. The €9,600 funds point was the deciding factor for us.', 'finland'],
    ['google', 5, 'Areeba M.', 'Georgia MBBS placement with honest advice about recognition before we paid anything. They refused to place me on a program that would not have worked for my plans.', 'georgia'],
    ['facebook', 5, 'Shahid N.', 'UAE Golden Visa handled through their PRO team. Attestation was the part I was worried about and it was managed without me chasing anybody.', 'uae'],
    ['facebook', 5, 'Rabia H.', 'Spoken English classes with Zeb Khan completely changed how I present in client meetings. Weekly assessments meant I could see my own progress.', null],
    ['facebook', 4, 'Imran Q.', 'Schengen application prepared carefully; they advised me to wait two months and strengthen the bank history instead of filing immediately. That advice probably saved my file.', null],
    ['trustpilot', 5, 'Sarah L.', 'Transparent pricing, clear written scope, and a named consultant who actually answered. The cost planner on their site matched what they quoted in the consultation.', null],
    ['trustpilot', 5, 'Ahmed Y.', 'Corporate English training for our sales team, eight weeks on site in Dubai. Practical and role-specific rather than generic textbook material.', null],
    ['trustpilot', 4, 'Zainab F.', 'IELTS General Training for migration. The mock exams under real timing conditions were the most useful part by far.', null],
    ['google', 5, 'Kashif B.', 'They explained why my first visa idea was a weak file and proposed a stronger route. That honesty is rare in this industry.', 'canada'],
    ['trustpilot', 5, 'Maryam D.', 'Career counseling session gave me a written action plan with dates. Three months later I am on the plan and it is working.', null],
  ];
  reviews.forEach(([platform, rating, author, text, country], i) => {
    ins('review_cache', {
      platform, external_id: `${platform}-${1000 + i}`, author, rating, text,
      permalink: platform === 'google' ? 'https://g.page/kishaainternational' :
                 platform === 'facebook' ? 'https://www.facebook.com/kishaainternational' :
                 'https://www.trustpilot.com/review/kishaainternational.com',
      published_at: new Date(Date.now() - (i * 6 + 4) * 86400e3).toISOString().slice(0, 19).replace('T', ' '),
      retrieved_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      display_state: 'shown', is_sample: 1,
    });
  });

  /* ----------------------------------------------------------- FEED CACHE */
  const feeds = [
    ['instagram', 'reel', 'Visa granted 🎉 A ten-year multiple-entry Canada visitor visa approved for a client from Rawalpindi after a business LOI file. Full breakdown of the document pack in the caption. #CanadaVisa #VisitVisa', 'canada'],
    ['instagram', 'post', 'Band 7.5 after ten weeks. Swipe to see the written roadmap we build for every IELTS candidate — per-skill targets, deadlines and mock schedule. #IELTS #Dubai', null],
    ['youtube', 'short', 'Finland explained in 60 seconds: €9,600 funds that cover your spouse and children, spouse work rights, and free schooling. #StudyInFinland', 'finland'],
    ['facebook', 'post', 'New intake briefing: UK 2027 admissions with MOI accepted, scholarships up to £5,000. Registration link in comments. #StudyInUK', 'uk'],
    ['instagram', 'post', 'Tbilisi student hostel tour — $1,100 a month total living cost for our MBBS students. Full city cost table on our website. #MBBS #Georgia', 'georgia'],
    ['youtube', 'video', 'Zeb Khan explains the difference between IELTS Academic and General Training writing tasks — and why preparing with the wrong materials costs you half a band.', null],
    ['instagram', 'reel', 'Italy fund route: PKR 4.5–5.5M accepted from the applicant OR a blood relative. Here is how the statement must be structured. #ItalyScholarship #StudyAbroad', 'italy'],
    ['facebook', 'post', 'Corporate English cohort completed in Dubai — eight weeks of business writing and presentation coaching for a sales team of 22. #CorporateTraining', null],
    ['youtube', 'short', 'UAE Golden Visa eligibility in 45 seconds: the four categories we file most often. Full guide on the website. #GoldenVisa #Dubai', 'uae'],
  ];
  feeds.forEach(([platform, kind, caption, country], i) => {
    ins('feed_cache', {
      platform, external_id: `${platform}-media-${2000 + i}`, kind, caption,
      media_url: null, thumb_url: null,
      permalink: platform === 'instagram' ? 'https://www.instagram.com/kishaainternational' :
                 platform === 'youtube' ? 'https://www.youtube.com/@kishaainternational' :
                 'https://www.facebook.com/kishaainternational',
      published_at: new Date(Date.now() - (i * 5 + 2) * 86400e3).toISOString().slice(0, 19).replace('T', ' '),
      retrieved_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      display_state: 'shown', pinned: i < 2 ? 1 : 0,
      tags: J(['#success', country ? '#' + country : '#training']),
      is_sample: 1,
    });
  });

  /* ----------------------------------------------------------- TESTIMONIALS */
  const testi = [
    ['They told me the truth about my file strength before taking any money. That is why I came back for my second application.', 'Kashif B., Rawalpindi', 'canada-10-year-visit-visa', 'google', 'approved', 1],
    ['The band roadmap was the first time anyone showed me a written plan instead of just selling me classes.', 'Nadia S., Dubai', 'ielts-preparation', 'google', 'approved', 1],
    ['Family permit for Finland with spouse work rights explained in one sitting. No pressure, no exaggeration.', 'Muhammad T., Lahore', 'finland-family-pathway', 'facebook', 'approved', 0],
    ['Recognition was checked before we paid tuition. That single step mattered more than anything else in the process.', 'Areeba M., Islamabad', 'georgia-medical-tech', 'google', 'approved', 1],
  ];
  for (const [quote, author, slug, platform, status, featured] of testi) {
    ins('testimonials', { quote, author_display: author, context: 'Verified client, publication permission on file',
      program_id: progId(slug), source_platform: platform, consent_record: 'Written consent recorded in the client file (private evidence)',
      evidence_note: 'Evidence retained privately and never published', approver_id: ctx.ownerId || null, status, featured });
  }

  /* ------------------------------------------------------------------ FAQS */
  const faqs = [
    ['Do you guarantee visas, admissions or IELTS bands?', 'No. Visa grants, admission offers, scholarship awards and test bands are decided solely by the relevant authority, institution or examination body. We publish honest assessments, including the reasons a route may fail, and we do not offer guaranteed outcomes or pay-after-result arrangements.', 'general', null],
    ['How quickly will someone respond to my enquiry?', 'We commit to replying within one business day. Every enquiry is stored with a unique reference, assigned to a named consultant, and tracked through contacted, qualified, consultation and outcome stages so nothing is lost between offices.', 'general', null],
    ['Which offices do you operate from?', 'Our headquarters is in Dubai, United Arab Emirates, with an office in Rawalpindi, Pakistan. You can reach the Dubai team on +971 58 682 6099 and the Pakistan team on +92 312 552 6099, or use the verified WhatsApp channels on the contact page.', 'general', null],
    ['Is the cost planner free to use?', 'Yes. You can generate a full estimate — flights, city living costs, statutory bank statement requirement and a document checklist — without submitting any contact details. If you want the guide emailed or a consultant to verify a rule for your route, you can attach your details at that point.', 'general', null],
    ['Why do some figures say “under review” instead of showing a number?', 'Where a statutory amount has changed or been reported but not yet confirmed against the issuing authority, we withhold it from automatic calculation rather than show a stale figure. A counselor verifies the current amount with you directly. This is deliberate — a wrong published figure would be worse than no figure.', 'general', null],

    ['What are the UK tuition costs for the 2027 intake?', 'Partner university tuition typically ranges from £11,300 to £15,500 for the 2027 intakes, with an initial deposit of £4,000–£6,500. Scholarships can reach £5,000. Medium of Instruction letters are accepted with or without IELTS at participating institutions, and no university interview is required.', 'admissions', 'uk'],
    ['Is IELTS required for UK admission?', 'Not always. At participating partner universities a Medium of Instruction (MOI) letter from your previous institution is accepted, with or without IELTS. Where a university does require IELTS, we build the test requirement into your timeline from the start rather than discovering it at the filing stage.', 'admissions', 'uk'],
    ['How much does studying in Italy cost?', 'On a fully funded scholarship route tuition can be free, with free or subsidised accommodation in participating cities. On the partial-funding route, tuition is about €3,600 in year one and free thereafter. Applicants typically evidence PKR 4.5–5.5 million in funds from the applicant or a blood relative.', 'admissions', 'italy'],
    ['Can my family come with me to Finland?', 'Yes — Finland is one of the few destinations where the €9,600 funds requirement is treated as covering the student together with dependants. Spouses receive work rights and children attend school free of charge. Family permits are filed together with the student permit where possible.', 'admissions', 'finland'],
    ['Is IELTS required for Georgia MBBS?', 'No IELTS is required for qualifying applicants, and study gaps are accepted. What matters more is program-level recognition: we check the specific program against the relevant listings for the country where you intend to practise before any tuition is paid.', 'admissions', 'georgia'],

    ['What does the Canada 10-year visit visa package include?', 'Assessment and file-strength review, a business Invitation Letter, a sponsor letter, IRCC filing and the VFS biometric appointment, plus bank statement guidance. The package is AED 7,500 (about PKR 575,000) in three milestones: AED 1,500 at submission, AED 1,500 at biometrics and AED 4,500 after approval. In the event of refusal only the submission milestone is retained.', 'visa', 'canada'],
    ['How long does the Canada visit visa take?', 'Typical processing runs 60–70 days from a complete submission. Incomplete files and financial evidence that cannot be explained are the most common causes of delay, which is why we complete the documentation build before filing.', 'visa', 'canada'],
    ['Can I get a Turkey visa with an Emirates ID on an Afghan passport?', 'There are specific routes available to Afghan passport holders legally resident in the UAE, using Emirates ID residency evidence. The requirements for this route change frequently, so we confirm the current position with you at enquiry stage rather than relying on cached guidance.', 'visa', 'turkey'],
    ['Do you handle UAE Golden Visa applications?', 'Yes, we file Golden Visa, Freelance Permit, Family Sponsorship and Visit Visa applications through PRO services with GDRFA-approved processing, including attestation, medical fitness and Emirates ID steps. Category criteria change without a fixed cycle, so eligibility is confirmed against the current thresholds for your specific category.', 'visa', 'uae'],
    ['What is the difference between EU, Schengen and European countries?', 'They are not the same thing. The European Union is a political and economic union; the Schengen Area is a travel zone with common border controls that includes several non-EU states; and “Europe” is simply a geographic grouping. A visa for one does not automatically grant rights in another, which is why our country pages state each destination’s bloc membership explicitly.', 'visa', null],

    ['How does IELTS preparation work at Kishaa International?', 'A four-skill diagnostic test establishes your baseline, then Zeb Khan issues a written roadmap stating the band each skill must reach and by when. The course runs 28 sessions with 12 marked writing tasks, four full mock examinations and speaking simulations, finishing with a test-day strategy session.', 'training', null],
    ['Who teaches the Cambridge and IELTS courses?', 'Zeb Khan, Senior Consultant & Executive Trainer, leads all Cambridge and IELTS training. He holds an MA in English, an MEd, a PGD in TEFL and a Diploma in Educational Planning & Management, and is a British Council Certified Trainer. He teaches in Dubai, across Pakistan and live online.', 'training', null],
    ['What is the difference between IELTS Academic and General Training?', 'Academic is for university admission and professional registration; General Training is for migration and secondary-level study. The writing tasks are fundamentally different — preparing with Academic materials for a General Training test misleads candidates on task achievement, which is why we teach the tracks separately.', 'training', null],
    ['Do you offer corporate English training?', 'Yes. Corporate programs cover business writing, presentations, negotiation language and meeting fluency, delivered on site in the UAE and Pakistan or online. Each engagement includes a needs analysis, a custom curriculum by role and level, an assessed completion presentation and a team capability report.', 'training', null],
    ['How long is the IELTS course and what does it cost?', 'The IELTS course runs ten weeks with three sessions per week. Group and one-to-one fees are quoted separately and instalments can be arranged. The official IELTS test fee payable to the test centre is not included in the course fee.', 'training', null],
  ];
  faqs.forEach(([question, answer, category, country], i) => {
    ins('faqs', { question, answer, answer_summary: answer.slice(0, 300), category,
      country_id: country ? cid(country) : null, sort_order: i, published: 1 });
  });

  /* ------------------------------------------------------------ INTEGRATIONS */
  const ints = [
    ['google', 'reviews', 'Google Business Profile reviews + Dubai local ranking'],
    ['facebook', 'reviews', 'Facebook recommendations and community ratings'],
    ['trustpilot', 'reviews', 'Trustpilot TrustScore and verified reviews'],
    ['instagram', 'feeds', 'Instagram posts and reels'],
    ['youtube', 'feeds', 'YouTube videos and shorts'],
    ['flights', 'flights', 'Approved flight aggregator for live fare quotes'],
    ['composio', 'automation', 'Managed OAuth and token refresh for review and feed providers'],
    ['mail', 'mail', 'Transactional email for lead notifications'],
  ];
  for (const [provider, kind, notes] of ints) {
    ins('integrations', { provider, kind, status: 'not_connected', mode: 'cache', token_status: 'missing',
      rate_limit: kind === 'reviews' ? 'Provider-defined; worker polls hourly' : null,
      notes, last_sync_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      next_sync_at: new Date(Date.now() + 3600e3).toISOString().slice(0, 19).replace('T', ' ') });
  }

  /* ----------------------------------------------------------------- EVENTS */
  ins('events', { title: 'UK 2027 Intake Briefing — Dubai', slug: 'uk-2027-intake-briefing-dubai',
    description: 'In-person briefing on UK 2027 admissions: MOI acceptance, scholarship strategy, deposit planning and the 28-day maintenance rule.',
    starts_at: new Date(Date.now() + 12 * 86400e3).toISOString().slice(0, 19).replace('T', ' '),
    timezone: 'Asia/Dubai', location: 'Business Bay, Dubai', status: 'published' });
  ins('events', { title: 'IELTS Diagnostic Day — Rawalpindi', slug: 'ielts-diagnostic-day-rawalpindi',
    description: 'Free four-skill diagnostic assessment with a written band roadmap issued the same week. Limited seats per session.',
    starts_at: new Date(Date.now() + 20 * 86400e3).toISOString().slice(0, 19).replace('T', ' '),
    timezone: 'Asia/Karachi', location: 'Bahria Town Phase 4, Rawalpindi', status: 'published' });

  /* ------------------------------------------------------------------ FORMS */
  ins('forms', { name: 'Consultation request', slug: 'consultation', destination_team: 'Intake queue',
    service_context: 'General consultation', active: 1,
    thank_you: 'Thank you. Your enquiry has been received by Kishaa International. Our team will use your selected contact method to discuss the next step. A consultation time is confirmed only after the team agrees it with you.',
    fields: J(['full_name','phone','email','contact_preference','interest','program','country','message','marketing_consent']) });
  ins('forms', { name: 'Cost planner guide request', slug: 'planner-guide', destination_team: 'Admissions team',
    service_context: 'Cost planner', active: 1,
    thank_you: 'Your estimate has been saved and your guide request received. A consultant will verify the statutory rule for your route and contact you on your chosen channel.',
    fields: J(['full_name','phone','email','country','purpose','timeline']) });

  return { reviews: reviews.length, feeds: feeds.length, faqs: faqs.length };
};

'use strict';
/** Site settings, brand identity and operational defaults. */
module.exports = function seedSettings(setSetting) {
  const s = (k, v, g) => setSetting(k, v, g || 'general');

  /* ---------------------------------------------------------------- brand */
  s('brand.name', 'Kishaa International', 'brand');
  s('brand.legal_name', 'Kishaa International — Career Counseling, Immigration Consultancy & Cambridge Courses Training', 'brand');
  s('brand.slogan', 'Gateway to Global Careers', 'brand');
  s('brand.slogan_alt', 'One Company, Global Solutions', 'brand');
  s('brand.email', 'kishaainternational@gmail.com', 'brand');
  s('brand.phone_uae', '+971 58 682 6099', 'brand');
  s('brand.phone_pk', '+92 312 552 6099', 'brand');
  s('brand.whatsapp', '+971586826099', 'brand');
  s('brand.whatsapp_pk', '+923125526099', 'brand');
  s('brand.address_uae', 'Business Bay, Dubai, United Arab Emirates', 'brand');
  s('brand.address_pk', 'Bahria Town Phase 4, Rawalpindi, Punjab, Pakistan', 'brand');
  s('brand.hours', 'Sat–Thu 10:00–19:00 (GST) · Fri by appointment', 'brand');
  s('brand.facebook_page_url', 'https://www.facebook.com/kishaainternational', 'brand');
  s('brand.facebook', 'https://www.facebook.com/kishaainternational', 'brand');
  s('brand.instagram', 'https://www.instagram.com/kishaainternational', 'brand');
  s('brand.youtube', 'https://www.youtube.com/@kishaainternational', 'brand');
  s('brand.linkedin', 'https://www.linkedin.com/company/kishaainternational', 'brand');
  s('brand.trustpilot_url', 'https://www.trustpilot.com/review/kishaainternational.com', 'brand');
  s('brand.google_profile_url', 'https://g.page/kishaainternational', 'brand');
  s('brand.timezone', 'Asia/Dubai', 'brand');

  /* ------------------------------------------------------------------ seo */
  s('seo.default_title', 'Kishaa International | Career Counseling, Immigration & Cambridge Training', 'seo');
  s('seo.default_description',
    'Kishaa International delivers career counseling, immigration consultancy and Cambridge & IELTS training from Dubai (HQ) and Pakistan. Compare countries, calculate live flight tickets, living costs and official bank statement requirements, then book a transparent consultation.', 'seo');
  s('seo.title_suffix', 'Kishaa International', 'seo');
  s('seo.og_image', '/img/og-default.svg', 'seo');
  s('seo.organisation_type', 'EducationalOrganization', 'seo');
  s('seo.canonical_base', '', 'seo');
  s('seo.base_url', '', 'seo');
  s('seo.twitter_handle', '@kishaaintl', 'seo');
  s('seo.indexnow_key', '', 'seo');
  s('seo.ga4_id', '', 'seo');
  s('seo.allow_ai_crawlers', true, 'seo');
  s('seo.sitemap_include_posts', true, 'seo');
  s('seo.default_keywords', 'study abroad consultancy, IELTS preparation Dubai, Canada visit visa Pakistan, proof of funds guide, living cost calculator', 'seo');

  /* ------------------------------------------------------------ operations */
  s('ops.response_promise', 'We reply to every enquiry within one business day.', 'ops');
  s('ops.privacy_notice_version', 'v1.2-2026-09', 'ops');
  s('ops.privacy_notice_effective', '2026-09-01', 'ops');
  s('ops.retention_months', 24, 'ops');
  s('ops.default_owner', null, 'ops');
  s('ops.notification_recipients', ['kishaainternational@gmail.com'], 'ops');
  s('ops.recipients_uae', ['kishaainternational@gmail.com'], 'ops');
  s('ops.recipients_pakistan', ['kishaainternational@gmail.com'], 'ops');
  s('ops.first_response_target_hours', 8, 'ops');
  s('ops.lead_prefix', 'KI', 'ops');
  s('ops.working_hours_json', { mon: '10:00-19:00', tue: '10:00-19:00', wed: '10:00-19:00',
    thu: '10:00-19:00', fri: 'by appointment', sat: '10:00-19:00', sun: 'closed' }, 'ops');

  /* ---------------------------------------------------------------- flags */
  s('flags.sample_reviews', true, 'flags');
  s('flags.sample_feeds', true, 'flags');
  s('flags.planner_live_fares', false, 'flags');
  s('flags.maintenance_mode', false, 'flags');
  s('flags.show_beta_notice', true, 'flags');
  s('flags.cookie_banner', true, 'flags');

  /* --------------------------------------------------------------- design */
  s('design.primary', '#06162D', 'design');
  s('design.accent', '#C9A227', 'design');
  s('design.ink', '#06162D', 'design');
  s('design.radius', '2px', 'design');
  s('design.font_heading', "'Fraunces', 'Georgia', serif", 'design');
  s('design.font_body', "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif", 'design');

  /* ---------------------------------------------------------------- legal */
  s('legal.disclaimer', 'Kishaa International provides consultancy, preparation and application support. Visa, admission and scholarship decisions rest solely with the relevant government authority or institution. Statutory fee and funds figures are maintained with source dates and must be reconfirmed before payment.', 'legal');
  s('legal.no_guarantee', 'We do not offer or imply guaranteed visas, guaranteed admissions, guaranteed bands or “pay after result” arrangements.', 'legal');
  s('legal.cookie_text', 'We use essential cookies to run this site and optional analytics cookies to understand which guidance is useful. Analytics events contain no personal information. You can accept or decline optional cookies at any time.', 'legal');
};

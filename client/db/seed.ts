/**
 * Seed script — populates the CMS with launch content from the
 * Kishaa International Website & CMS specification (v1.2).
 * Run: npx tsx db/seed.ts
 */
import { getDb } from "../api/queries/connection";
import * as s from "./schema";

const db = getDb();

const programs = [
  // ---------------- Career Counseling ----------------
  {
    name: "UK 2027 University Admissions (MOI Accepted)",
    slug: "uk-2027-intake",
    pillar: "career" as const,
    summary:
      "Secure your UK 2027 intake with Medium of Instruction (MOI) acceptance — with or without IELTS — and no university interview.",
    description:
      "End-to-end admission support for the UK 2027 intakes. MOI is accepted by our partner universities, so many applicants can apply with or without IELTS and without a university interview. Scholarships of up to £5,000 are available across 25+ partner universities including Bolton, Greenwich, Anglia Ruskin and Kingston.",
    audience: "Students and graduates targeting UK Bachelor's and Master's degrees.",
    delivery: "In-person (Dubai & Pakistan) or online",
    duration: "Application to CAS: typically 6–10 weeks",
    fees: "Tuition £11,300–£15,500 per year; initial deposit £4,000–£6,500. Advisory fees quoted separately and transparently.",
    currency: "GBP",
    location: "Dubai, UAE & Pakistan",
    highlights:
      "MOI accepted — apply with or without IELTS\nNo university interview for partner institutions\nScholarships up to £5,000\n25+ partner universities (Bolton, Greenwich, Anglia Ruskin, Kingston and more)\nTuition £11,300–£15,500/year, deposit £4,000–£6,500",
    featured: true,
    sortOrder: 1,
  },
  {
    name: "Italy English-Taught Programs — Free Tuition Scholarships",
    slug: "italy-free-tuition",
    pillar: "career" as const,
    summary:
      "Study in Italy in English with fully funded scholarships — tuition FREE, with free accommodation options.",
    description:
      "English-taught Bachelor's and Master's degrees at Italian public universities. On fully funded scholarships tuition is free; on partial scholarships year one is approximately €3,600 and subsequent years free. Free accommodation schemes are available for eligible students. Bank statement requirement is approximately PKR 4.5–5.5 million, accepted from the applicant or blood relatives.",
    audience: "Students seeking low-cost European degrees in English.",
    delivery: "In-person (Dubai & Pakistan) or online",
    duration: "Regional scholarship windows apply — apply early",
    fees: "Tuition FREE on full scholarship; partial route approx. €3,600 (year 1 only). Advisory fees quoted separately.",
    currency: "EUR",
    location: "Dubai, UAE & Pakistan",
    highlights:
      "Tuition FREE on fully funded scholarships\nPartial route: approx. €3,600 year 1, then free\nFree accommodation for eligible students\nBank statement PKR 4.5–5.5M (applicant or blood relatives)",
    featured: true,
    sortOrder: 2,
  },
  {
    name: "Finland Bachelor's & Master's — Family & PR Pathway",
    slug: "finland-study-family-pr",
    pillar: "career" as const,
    summary:
      "Study in Finland at approx. €6,500/year with €9,600 bank funds that cover your spouse and children — spouse work rights and free education for kids.",
    description:
      "Finland offers one of Europe's most family-friendly study routes. Tuition from approximately €6,500 per year, with €9,600 in bank funds covering the student plus dependants. Spouses receive full work rights, children receive free education, and a TRC-to-PR pathway is available after graduation.",
    audience: "Students planning to relocate with family and build toward permanent residency.",
    delivery: "In-person (Dubai & Pakistan) or online",
    duration: "Processing typically 4–8 weeks",
    fees: "Tuition approx. €6,500/year. Advisory fees quoted separately.",
    currency: "EUR",
    location: "Dubai, UAE & Pakistan",
    highlights:
      "Tuition approx. €6,500/year\n€9,600 bank funds cover student + spouse + kids\nSpouse full work rights; free education for children\nTRC / PR pathway after studies\nProcessing typically 4–8 weeks",
    featured: true,
    sortOrder: 3,
  },
  {
    name: "Georgia MBBS, BDS & Tech Programs",
    slug: "georgia-mbbs-tech",
    pillar: "career" as const,
    summary:
      "MCI/WHO-recognised MBBS/BDS and technology degrees in Georgia from $2,000–$8,000/year — no IELTS, study gaps accepted.",
    description:
      "Affordable, recognised medical and technology education in Georgia. MBBS/BDS tuition runs $4,000–$5,000 per year at MCI/WHO-recognised universities; technology and business programs range $2,000–$8,000. Living costs average about $1,100 per month. No IELTS requirement and study gaps are accepted.",
    audience: "Medical aspirants and students with study gaps seeking recognised degrees.",
    delivery: "In-person (Dubai & Pakistan) or online",
    duration: "Rolling intakes",
    fees: "Tuition $2,000–$8,000/year (MBBS/BDS $4,000–$5,000). Living approx. $1,100/month.",
    currency: "USD",
    location: "Dubai, UAE & Pakistan",
    highlights:
      "MBBS/BDS at MCI/WHO-recognised universities ($4,000–$5,000/yr)\nTech & business programs $2,000–$8,000/yr\nLiving costs approx. $1,100/month\nNo IELTS required; study gaps accepted",
    featured: true,
    sortOrder: 4,
  },
  {
    name: "Career Counseling, CV & Interview Preparation",
    slug: "career-counseling-cv-interview",
    pillar: "career" as const,
    summary:
      "One-to-one educational pathway planning, CV enhancement and interview preparation with senior counselors.",
    description:
      "Structured career counseling for students and professionals: pathway planning across the UK, Turkey, Europe, Canada, USA and Australia; CV and personal statement development; and mock interviews with actionable feedback.",
    audience: "Students, graduates and professionals planning their next move abroad.",
    delivery: "In-person (Dubai & Pakistan) or online",
    duration: "1–4 sessions per plan",
    fees: "Quoted per counseling plan.",
    currency: "AED",
    location: "Dubai, UAE & Pakistan",
    highlights:
      "Educational pathway planning\nCV and personal statement enhancement\nMock interviews with feedback\nUniversity shortlisting across UK, Europe, Canada, USA, Australia",
    featured: false,
    sortOrder: 5,
  },
  // ---------------- Immigration Consultancy ----------------
  {
    name: "Canada 10-Year Multiple Entry Visit Visa (Business LOI)",
    slug: "canada-10-year-loi-visit-visa",
    pillar: "immigration" as const,
    summary:
      "Canada 10-year multiple entry visit visa with Business Invitation Letter (LOI) and Sponsor Letter — stay up to 6 months per visit.",
    description:
      "Our flagship Canada package includes a Business Invitation Letter (LOI), Sponsor Letter, and complete IRCC & VFS biometric processing. Total package AED 7,500 (approx. PKR 575k) payable in three milestones: AED 1,500 at submission, AED 1,500 at biometrics, and AED 4,500 after approval. In case of refusal only AED 1,500 is deducted. Official processing time is approximately 60–70 days.",
    audience: "Business visitors, tourists and family visitors seeking long-term Canada access.",
    delivery: "In-person (Dubai & Pakistan) or online",
    duration: "Approx. 60–70 days official processing",
    fees: "AED 7,500 total in 3 milestones (1,500 submission / 1,500 biometric / 4,500 after approval). Only AED 1,500 deducted if refused.",
    currency: "AED",
    location: "Dubai, UAE & Pakistan",
    highlights:
      "Stay up to 6 months per visit, valid up to 10 years\nBusiness Invitation Letter (LOI) + Sponsor Letter included\nIRCC & VFS biometric fees included\nMilestone payments — only AED 1,500 at risk before approval\nProcessing approx. 60–70 days",
    featured: true,
    sortOrder: 1,
  },
  {
    name: "UAE Golden, Freelance, Family & Visit Visas",
    slug: "uae-golden-freelance-visas",
    pillar: "immigration" as const,
    summary:
      "PRO & GDRFA-approved UAE visa services: Golden Visa, Freelance Permit, Family Sponsorship and Visit Visas.",
    description:
      "Transparent UAE immigration services handled by PRO & GDRFA-approved processes: 10-year Golden Visas for eligible professionals and investors, freelance permits, family sponsorship and visit visas — with clear government fee breakdowns.",
    audience: "Professionals, freelancers, families and visitors to the UAE.",
    delivery: "In-person (Dubai HQ)",
    duration: "Varies by category",
    fees: "Government + advisory fees itemised per category.",
    currency: "AED",
    location: "Dubai, UAE",
    highlights:
      "PRO & GDRFA approved processing\nGolden Visa (10-year) eligibility assessment\nFreelance permit & family sponsorship\nTransparent government fee breakdown",
    featured: true,
    sortOrder: 2,
  },
  {
    name: "Turkey Visa on Emirates ID (Afghan Passports)",
    slug: "turkey-visa-emirates-id",
    pillar: "immigration" as const,
    summary:
      "Special Turkey visa pathway for Afghan passport holders resident in the UAE — apply on Emirates ID.",
    description:
      "A dedicated pathway for Afghan passport holders legally resident in the UAE: Turkey visa applications supported on the basis of Emirates ID residence, with full documentation guidance.",
    audience: "Afghan passport holders with UAE residence (Emirates ID).",
    delivery: "In-person (Dubai & Pakistan) or online",
    duration: "Varies",
    fees: "Quoted per case.",
    currency: "AED",
    location: "Dubai, UAE & Pakistan",
    highlights:
      "Turkey visa on Emirates ID for Afghan passports\nSpecial passport pathways handled with care\nComplete documentation guidance",
    featured: true,
    sortOrder: 3,
  },
  {
    name: "Serbia & Romania Work Pathways",
    slug: "serbia-romania-work",
    pillar: "immigration" as const,
    summary:
      "European work pathways through Serbia and Romania with verified employers and transparent processing.",
    description:
      "Work permit and residency pathways in Serbia and Romania for skilled and semi-skilled workers, with employer verification and staged payments.",
    audience: "Workers seeking legal European employment routes.",
    delivery: "In-person (Dubai & Pakistan) or online",
    duration: "Varies by employer and role",
    fees: "Quoted per pathway with milestone payments.",
    currency: "EUR",
    location: "Dubai, UAE & Pakistan",
    highlights:
      "Verified employer pathways\nWork permit + residency support\nTransparent staged payments",
    featured: false,
    sortOrder: 4,
  },
  {
    name: "Schengen Tourist & Visit Visas",
    slug: "schengen-visit-visas",
    pillar: "immigration" as const,
    summary:
      "Schengen tourist and visit visa preparation with document checklists and itinerary support.",
    description:
      "Complete Schengen visit visa preparation: documentation checklists, financial evidence planning, travel itineraries and appointment guidance.",
    audience: "Tourists and family visitors travelling to the Schengen Area.",
    delivery: "In-person (Dubai & Pakistan) or online",
    duration: "Appointment lead times vary by consulate",
    fees: "Quoted per application.",
    currency: "EUR",
    location: "Dubai, UAE & Pakistan",
    highlights:
      "Document checklist & financial evidence planning\nItinerary and cover letter support\nAppointment guidance",
    featured: false,
    sortOrder: 5,
  },
  // ---------------- Cambridge Courses ----------------
  {
    name: "IELTS Preparation (Academic & General Training)",
    slug: "ielts-preparation",
    pillar: "cambridge" as const,
    summary:
      "Band-focused IELTS Academic & General Training with British Council Certified Trainer Zeb Khan — personalized band-improvement roadmaps.",
    description:
      "Structured IELTS preparation covering Listening, Reading, Writing and Speaking for both Academic and General Training. Every candidate receives a diagnostic assessment and a personalized band-improvement roadmap, with full mock tests under exam conditions.",
    audience: "IELTS candidates targeting study, migration or work requirements.",
    delivery: "In-person (Dubai & Pakistan) or online",
    duration: "4–8 week tracks",
    fees: "Quoted per track.",
    currency: "AED",
    location: "Dubai, UAE & Pakistan",
    highlights:
      "British Council Certified Trainer\nAcademic & General Training tracks\nPersonalized band-improvement roadmap\nFull mock tests under exam conditions",
    featured: true,
    sortOrder: 1,
  },
  {
    name: "Spoken English & Communication Skills",
    slug: "spoken-english",
    pillar: "cambridge" as const,
    summary:
      "Confidence-first spoken English for interviews, workplaces and everyday fluency.",
    description:
      "Practical spoken English training focused on fluency, pronunciation and real-world communication — from interviews to presentations.",
    audience: "Learners who want confident, functional spoken English.",
    delivery: "In-person (Dubai & Pakistan) or online",
    duration: "6–12 week tracks",
    fees: "Quoted per track.",
    currency: "AED",
    location: "Dubai, UAE & Pakistan",
    highlights:
      "Fluency & pronunciation focus\nInterview and presentation practice\nSmall groups and one-to-one options",
    featured: false,
    sortOrder: 2,
  },
  {
    name: "Cambridge English Courses",
    slug: "cambridge-english-courses",
    pillar: "cambridge" as const,
    summary:
      "Cambridge English curriculum courses from foundation to advanced levels.",
    description:
      "Cambridge-aligned English courses building from foundation to advanced proficiency, taught with authentic materials and continuous assessment.",
    audience: "Learners following the Cambridge English pathway.",
    delivery: "In-person (Dubai & Pakistan) or online",
    duration: "Level-based",
    fees: "Quoted per level.",
    currency: "AED",
    location: "Dubai, UAE & Pakistan",
    highlights:
      "Cambridge-aligned curriculum\nContinuous assessment\nAuthentic materials",
    featured: false,
    sortOrder: 3,
  },
  {
    name: "Corporate Professional English",
    slug: "corporate-english",
    pillar: "cambridge" as const,
    summary:
      "Executive and corporate English training for teams and professionals.",
    description:
      "Tailored corporate English programs: business writing, meetings, negotiations and executive communication, delivered on-site or online.",
    audience: "Companies and executives upgrading professional communication.",
    delivery: "On-site corporate delivery or online",
    duration: "Custom programs",
    fees: "Quoted per program.",
    currency: "AED",
    location: "Dubai, UAE & Pakistan",
    highlights:
      "Business writing & meetings\nExecutive communication coaching\nTailored corporate curriculum",
    featured: false,
    sortOrder: 4,
  },
];

const team = [
  {
    name: "Zeb Khan",
    slug: "zeb-khan",
    role: "Senior Consultant & Executive Trainer",
    bio: "Request guidance from Zeb Khan across Career Counseling, University Admissions, Immigration Consultancy, and Cambridge Courses Training. With advanced academic qualifications and British Council certification, Zeb Khan provides executive training and strategic immigration advice for students and professionals across Dubai, UAE and Pakistan.",
    credentials:
      "MA English\nMEd\nPGD TEFL\nDip EPM\nBritish Council Certified Trainer",
    expertise:
      "Career Counseling\nUK / Italy / Finland / Georgia admissions\nCanada 10-Yr LOI visit visas\nUAE PRO & GDRFA visas\nCambridge English & IELTS",
    languages: "English, Urdu",
    email: "kishaainternational@gmail.com",
    phone: "+971 58 682 6099",
    featured: true,
  },
];

const country = (
  name: string,
  slug: string,
  region: string,
  flag: string,
  summary: string,
  visaInfo: string,
  tuitionInfo: string,
  livingCosts: object,
  fundsRule: object,
  flightGuide: object[],
  featured = false,
  sortOrder = 0,
) => ({
  name,
  slug,
  region,
  flag,
  summary,
  visaInfo,
  tuitionInfo,
  livingCosts: JSON.stringify(livingCosts),
  fundsRule: JSON.stringify(fundsRule),
  flightGuide: JSON.stringify(flightGuide),
  featured,
  sortOrder,
});

const countries = [
  country(
    "United Kingdom", "united-kingdom", "Europe", "🇬🇧",
    "The UK remains the most popular study destination for Pakistani and UAE-based students, with the 2027 intakes accepting MOI at partner universities.",
    "Student Route visa with CAS; UKVI requires a 28-day continuous bank statement covering tuition balance plus 9 months maintenance.",
    "Partner university tuition £11,300–£15,500/year; scholarships up to £5,000; initial deposit £4,000–£6,500.",
    { currency: "GBP", budget: 1023, standard: 1180, comfortable: 1344, note: "UKVI maintenance bands: £1,023/mo outside London, £1,344/mo in London (9 months)." },
    { amount: 12006, currency: "GBP", months: 9, holderRule: "28-day continuous holding required by UKVI", note: "9 months maintenance (£1,334/mo London / £1,023/mo elsewhere) plus unpaid first-year tuition.", sourceUrl: "https://www.gov.uk/student-visa/money", effectiveDate: "2026-01" },
    [{ from: "LHE", priceMin: 550, priceMax: 900, currency: "USD" }, { from: "DXB", priceMin: 450, priceMax: 800, currency: "USD" }, { from: "ISB", priceMin: 600, priceMax: 950, currency: "USD" }, { from: "KHI", priceMin: 580, priceMax: 920, currency: "USD" }],
    true, 1,
  ),
  country(
    "Italy", "italy", "Europe", "🇮🇹",
    "Italy offers English-taught degrees with fully funded regional scholarships — tuition free, plus accommodation support.",
    "National study visa (type D) with university pre-enrolment via Universitaly; funds may be shown by applicant or blood relatives.",
    "Tuition FREE on full scholarship; partial route approx. €3,600 in year one only. Free accommodation schemes for eligible students.",
    { currency: "EUR", budget: 700, standard: 950, comfortable: 1300, note: "Milan/Rome higher; southern university towns lower." },
    { amount: 6500, currency: "EUR", months: 12, holderRule: "Applicant or blood relatives may show funds (approx. PKR 4.5–5.5M equivalent)", note: "Approx. €6,500/year (€467/month min. by Italian regulation) — typically evidenced as PKR 4.5–5.5M.", sourceUrl: "https://www.esteri.it/en/", effectiveDate: "2026-01" },
    [{ from: "LHE", priceMin: 420, priceMax: 750, currency: "USD" }, { from: "DXB", priceMin: 300, priceMax: 600, currency: "USD" }, { from: "ISB", priceMin: 450, priceMax: 780, currency: "USD" }, { from: "KHI", priceMin: 430, priceMax: 760, currency: "USD" }],
    true, 2,
  ),
  country(
    "Finland", "finland", "Europe", "🇫🇮",
    "Finland combines affordable tuition with the EU's most family-friendly student route — spouse work rights and free schooling for children.",
    "Residence permit for studies; €9,600/year funds requirement uniquely covers student plus dependants. TRC leads to PR pathway.",
    "Tuition from approx. €6,500/year for Bachelor's & Master's programs.",
    { currency: "EUR", budget: 800, standard: 1000, comfortable: 1400, note: "Helsinki higher; smaller cities lower. Student housing reduces costs significantly." },
    { amount: 9600, currency: "EUR", months: 12, holderRule: "Single sum may cover student + spouse + children", note: "€9,600/year (€800/month) statutory requirement; family coverage with spouse work rights.", sourceUrl: "https://migri.fi/en/", effectiveDate: "2026-01" },
    [{ from: "LHE", priceMin: 500, priceMax: 850, currency: "USD" }, { from: "DXB", priceMin: 380, priceMax: 680, currency: "USD" }, { from: "ISB", priceMin: 520, priceMax: 880, currency: "USD" }, { from: "KHI", priceMin: 510, priceMax: 860, currency: "USD" }],
    true, 3,
  ),
  country(
    "Georgia", "georgia", "Eurasia", "🇬🇪",
    "Georgia is the value leader for MCI/WHO-recognised MBBS/BDS and tech degrees — no IELTS and study gaps accepted.",
    "Straightforward student visa / e-visa routes; minimal financial evidence compared to the EU.",
    "Tuition $2,000–$8,000/year; MBBS/BDS $4,000–$5,000 at MCI/WHO-recognised universities.",
    { currency: "USD", budget: 800, standard: 1100, comfortable: 1500, note: "Tbilisi average approx. $1,100/month including rent." },
    { amount: 5000, currency: "USD", months: 12, holderRule: "Applicant or sponsor statement", note: "Indicative $4,000–$6,000 evidence; requirements lighter than EU states.", sourceUrl: "https://www.geoconsul.gov.ge/", effectiveDate: "2026-01" },
    [{ from: "LHE", priceMin: 350, priceMax: 600, currency: "USD" }, { from: "DXB", priceMin: 250, priceMax: 450, currency: "USD" }, { from: "ISB", priceMin: 380, priceMax: 630, currency: "USD" }, { from: "KHI", priceMin: 360, priceMax: 610, currency: "USD" }],
    true, 4,
  ),
  country(
    "Germany", "germany", "Europe", "🇩🇪",
    "Germany offers near-zero tuition at public universities with the famous blocked account (Sperrkonto) system.",
    "National student visa; funds proven via blocked account (Sperrkonto) of €11,208/year.",
    "Public universities charge little to no tuition; semester fees €150–€350.",
    { currency: "EUR", budget: 850, standard: 992, comfortable: 1250, note: "Blocked account releases €934/month; Munich and Frankfurt higher." },
    { amount: 11208, currency: "EUR", months: 12, holderRule: "Blocked account (Sperrkonto) in applicant's name", note: "€11,208 statutory blocked amount (€934/month).", sourceUrl: "https://www.germany.info/", effectiveDate: "2026-01" },
    [{ from: "LHE", priceMin: 450, priceMax: 780, currency: "USD" }, { from: "DXB", priceMin: 320, priceMax: 620, currency: "USD" }, { from: "ISB", priceMin: 470, priceMax: 800, currency: "USD" }, { from: "KHI", priceMin: 460, priceMax: 790, currency: "USD" }],
    false, 5,
  ),
  country(
    "France", "france", "Europe", "🇫🇷",
    "France combines low public-university tuition with rich scholarship programs and post-study work options.",
    "Long-stay student visa (VLS-TS) via Campus France; approx. €615/month funds evidence.",
    "Public tuition approx. €2,770 (Bachelor) / €3,770 (Master) per year for non-EU students.",
    { currency: "EUR", budget: 800, standard: 1050, comfortable: 1450, note: "Paris significantly higher; regional cities more affordable." },
    { amount: 7380, currency: "EUR", months: 12, holderRule: "Applicant or sponsor with guarantor documents", note: "Approx. €615/month statutory minimum.", sourceUrl: "https://www.campusfrance.org/", effectiveDate: "2026-01" },
    [{ from: "LHE", priceMin: 430, priceMax: 760, currency: "USD" }, { from: "DXB", priceMin: 300, priceMax: 590, currency: "USD" }, { from: "ISB", priceMin: 460, priceMax: 790, currency: "USD" }, { from: "KHI", priceMin: 440, priceMax: 770, currency: "USD" }],
    false, 6,
  ),
  country(
    "Portugal", "portugal", "Europe", "🇵🇹",
    "Portugal offers affordable degrees, mild climate and popular residency routes including the D7/D8 visas.",
    "Student and D8 digital nomad routes; modest funds thresholds compared to northern Europe.",
    "Public tuition approx. €3,000–€7,000/year.",
    { currency: "EUR", budget: 700, standard: 900, comfortable: 1250, note: "Lisbon higher; Porto and Coimbra more affordable." },
    { amount: 9120, currency: "EUR", months: 12, holderRule: "Applicant funds or sponsor", note: "Linked to Portuguese minimum wage; approx. €760/month.", sourceUrl: "https://aima.gov.pt/", effectiveDate: "2026-01" },
    [{ from: "LHE", priceMin: 480, priceMax: 820, currency: "USD" }, { from: "DXB", priceMin: 340, priceMax: 650, currency: "USD" }, { from: "ISB", priceMin: 500, priceMax: 850, currency: "USD" }, { from: "KHI", priceMin: 490, priceMax: 830, currency: "USD" }],
    false, 7,
  ),
  country(
    "Serbia", "serbia", "Europe", "🇷🇸",
    "Serbia is an emerging European work and study pathway with low living costs.",
    "Work permits tied to verified employers; student visas with university invitation.",
    "Tuition approx. €2,000–€5,000/year.",
    { currency: "EUR", budget: 450, standard: 650, comfortable: 900, note: "Belgrade average; among Europe's most affordable capitals." },
    { amount: 3600, currency: "EUR", months: 12, holderRule: "Applicant or employer support letter", note: "Approx. €300/month evidence.", sourceUrl: "https://www.mfa.gov.rs/", effectiveDate: "2026-01" },
    [{ from: "LHE", priceMin: 380, priceMax: 650, currency: "USD" }, { from: "DXB", priceMin: 280, priceMax: 500, currency: "USD" }, { from: "ISB", priceMin: 400, priceMax: 680, currency: "USD" }, { from: "KHI", priceMin: 390, priceMax: 660, currency: "USD" }],
    false, 8,
  ),
  country(
    "Romania", "romania", "Europe", "🇷🇴",
    "Romania offers EU-recognised degrees and growing work permit routes at low cost.",
    "Student visa with letter of acceptance; work permits via employer sponsorship.",
    "Tuition approx. €2,500–€6,000/year; medicine higher.",
    { currency: "EUR", budget: 500, standard: 700, comfortable: 1000, note: "Bucharest and Cluj averages." },
    { amount: 4200, currency: "EUR", months: 12, holderRule: "Applicant funds", note: "Approx. €350/month evidence.", sourceUrl: "https://www.mae.ro/", effectiveDate: "2026-01" },
    [{ from: "LHE", priceMin: 400, priceMax: 680, currency: "USD" }, { from: "DXB", priceMin: 290, priceMax: 520, currency: "USD" }, { from: "ISB", priceMin: 420, priceMax: 700, currency: "USD" }, { from: "KHI", priceMin: 410, priceMax: 690, currency: "USD" }],
    false, 9,
  ),
  country(
    "Canada", "canada", "North America", "🇨🇦",
    "Canada's 10-year multiple entry visit visa with Business LOI is our flagship immigration package; study permits remain a top study route.",
    "Visitor visa (TRV) with 6-month bank statement backing LOI/sponsor letters; study permit requires GIC plus tuition.",
    "Study tuition approx. CAD 18,000–35,000/year; visit visa package AED 7,500 with milestone payments.",
    { currency: "CAD", budget: 1400, standard: 1900, comfortable: 2600, note: "Toronto/Vancouver higher; smaller cities lower." },
    { amount: 10000, currency: "CAD", months: 6, holderRule: "6-month statement backing Business LOI / sponsor letters (visit); GIC CAD 20,635 (study)", note: "Visit route: consistent 6-month funds history. Study route: GIC plus first-year tuition.", sourceUrl: "https://www.canada.ca/en/immigration-refugees-citizenship.html", effectiveDate: "2026-01" },
    [{ from: "LHE", priceMin: 900, priceMax: 1500, currency: "USD" }, { from: "DXB", priceMin: 800, priceMax: 1400, currency: "USD" }, { from: "ISB", priceMin: 950, priceMax: 1550, currency: "USD" }, { from: "KHI", priceMin: 920, priceMax: 1520, currency: "USD" }],
    true, 10,
  ),
  country(
    "United States", "usa", "North America", "🇺🇸",
    "The USA offers unmatched university choice; strong documentation and interview preparation are decisive.",
    "F-1 student visa with I-20; B1/B2 visit visas require strong ties and funds evidence.",
    "Tuition varies widely: $15,000–$55,000/year.",
    { currency: "USD", budget: 1300, standard: 1800, comfortable: 2600, note: "Varies sharply by state and city." },
    { amount: 25000, currency: "USD", months: 12, holderRule: "Applicant or sponsor affidavits", note: "Evidence must cover I-20 first-year total.", sourceUrl: "https://travel.state.gov/", effectiveDate: "2026-01" },
    [{ from: "LHE", priceMin: 850, priceMax: 1450, currency: "USD" }, { from: "DXB", priceMin: 750, priceMax: 1300, currency: "USD" }, { from: "ISB", priceMin: 900, priceMax: 1500, currency: "USD" }, { from: "KHI", priceMin: 870, priceMax: 1480, currency: "USD" }],
    false, 11,
  ),
  country(
    "Australia", "australia", "Oceania", "🇦🇺",
    "Australia's subclass 500 student visa now carries a higher financial capacity requirement — plan early.",
    "Subclass 500 student visa; financial capacity AUD 29,710/year plus tuition and travel.",
    "Tuition approx. AUD 25,000–45,000/year.",
    { currency: "AUD", budget: 1700, standard: 2300, comfortable: 3200, note: "Sydney/Melbourne highest." },
    { amount: 29710, currency: "AUD", months: 12, holderRule: "Applicant or eligible sponsor", note: "AUD 29,710 annual living cost capacity plus tuition and travel.", sourceUrl: "https://immi.homeaffairs.gov.au/", effectiveDate: "2026-01" },
    [{ from: "LHE", priceMin: 800, priceMax: 1300, currency: "USD" }, { from: "DXB", priceMin: 700, priceMax: 1200, currency: "USD" }, { from: "ISB", priceMin: 850, priceMax: 1350, currency: "USD" }, { from: "KHI", priceMin: 820, priceMax: 1320, currency: "USD" }],
    false, 12,
  ),
  country(
    "Turkey", "turkey", "Eurasia", "🇹🇷",
    "Turkey bridges East and West with affordable universities and a special Emirates ID route for Afghan passport holders.",
    "E-visa for many nationalities; Afghan passport holders in the UAE may apply on Emirates ID residence.",
    "Tuition approx. $2,000–$8,000/year at private universities; public lower.",
    { currency: "USD", budget: 500, standard: 750, comfortable: 1100, note: "Istanbul higher; Ankara/Izmir lower." },
    { amount: 6000, currency: "USD", months: 12, holderRule: "Applicant or sponsor", note: "Approx. $500/month evidence.", sourceUrl: "https://www.mfa.gov.tr/", effectiveDate: "2026-01" },
    [{ from: "LHE", priceMin: 300, priceMax: 550, currency: "USD" }, { from: "DXB", priceMin: 220, priceMax: 420, currency: "USD" }, { from: "ISB", priceMin: 330, priceMax: 580, currency: "USD" }, { from: "KHI", priceMin: 310, priceMax: 560, currency: "USD" }],
    true, 13,
  ),
  country(
    "United Arab Emirates", "uae", "Middle East", "🇦🇪",
    "The UAE — our home base — offers Golden Visas, freelance permits and world-class universities across Dubai and Abu Dhabi.",
    "Golden (10-year), Freelance, Family and Visit visas via PRO & GDRFA-approved processing.",
    "Tuition approx. AED 40,000–90,000/year at international branch campuses.",
    { currency: "AED", budget: 3500, standard: 5000, comfortable: 7500, note: "Dubai Marina/Downtown higher; Sharjah and northern emirates lower." },
    { amount: 15000, currency: "AED", months: 6, holderRule: "Varies by visa category", note: "Golden Visa criteria are salary/investment based rather than fixed bank funds.", sourceUrl: "https://gdrfad.gov.ae/", effectiveDate: "2026-01" },
    [{ from: "LHE", priceMin: 150, priceMax: 350, currency: "USD" }, { from: "ISB", priceMin: 160, priceMax: 380, currency: "USD" }, { from: "KHI", priceMin: 140, priceMax: 330, currency: "USD" }, { from: "DXB", priceMin: 0, priceMax: 0, currency: "USD" }],
    false, 14,
  ),
  country(
    "Russia", "russia", "Eurasia", "🇷🇺",
    "Russia offers low-tuition medical and engineering degrees with government scholarship quotas.",
    "Student visa via university invitation; modest funds evidence.",
    "Tuition approx. $2,500–$7,000/year; medicine popular with Pakistani students.",
    { currency: "USD", budget: 450, standard: 650, comfortable: 950, note: "Moscow/St. Petersburg higher; regional cities very affordable." },
    { amount: 4000, currency: "USD", months: 12, holderRule: "Applicant or sponsor", note: "Modest evidence relative to Western destinations.", sourceUrl: "https://mid.ru/", effectiveDate: "2026-01" },
    [{ from: "LHE", priceMin: 400, priceMax: 700, currency: "USD" }, { from: "DXB", priceMin: 300, priceMax: 550, currency: "USD" }, { from: "ISB", priceMin: 420, priceMax: 720, currency: "USD" }, { from: "KHI", priceMin: 410, priceMax: 710, currency: "USD" }],
    false, 15,
  ),
  country(
    "Kazakhstan", "kazakhstan", "Central Asia", "🇰🇿",
    "Kazakhstan is a rising Central Asian hub for affordable medical and technical education.",
    "Student visa with university invitation; simple entry rules for many nationalities.",
    "Tuition approx. $2,000–$5,000/year.",
    { currency: "USD", budget: 400, standard: 600, comfortable: 900, note: "Almaty and Astana averages." },
    { amount: 3500, currency: "USD", months: 12, holderRule: "Applicant or sponsor", note: "Light funds evidence requirements.", sourceUrl: "https://www.gov.kz/", effectiveDate: "2026-01" },
    [{ from: "LHE", priceMin: 250, priceMax: 480, currency: "USD" }, { from: "DXB", priceMin: 280, priceMax: 500, currency: "USD" }, { from: "ISB", priceMin: 220, priceMax: 450, currency: "USD" }, { from: "KHI", priceMin: 260, priceMax: 490, currency: "USD" }],
    false, 16,
  ),
  country(
    "Kyrgyzstan", "kyrgyzstan", "Central Asia", "🇰🇬",
    "Kyrgyzstan is a budget-friendly MBBS destination with straightforward admissions.",
    "Student visa / e-visa routes; minimal financial evidence.",
    "MBBS tuition approx. $3,000–$4,500/year.",
    { currency: "USD", budget: 350, standard: 500, comfortable: 750, note: "Bishkek average; very affordable." },
    { amount: 3000, currency: "USD", months: 12, holderRule: "Applicant or sponsor", note: "Minimal funds evidence.", sourceUrl: "https://mfa.gov.kg/", effectiveDate: "2026-01" },
    [{ from: "LHE", priceMin: 280, priceMax: 500, currency: "USD" }, { from: "DXB", priceMin: 300, priceMax: 520, currency: "USD" }, { from: "ISB", priceMin: 250, priceMax: 470, currency: "USD" }, { from: "KHI", priceMin: 270, priceMax: 490, currency: "USD" }],
    false, 17,
  ),
  country(
    "Tajikistan", "tajikistan", "Central Asia", "🇹🇯",
    "Tajikistan offers very low-cost medical education with simple entry procedures.",
    "Student visa with invitation; e-visa available for many nationalities.",
    "Tuition approx. $2,000–$4,000/year.",
    { currency: "USD", budget: 300, standard: 450, comfortable: 700, note: "Dushanbe average." },
    { amount: 2500, currency: "USD", months: 12, holderRule: "Applicant or sponsor", note: "Minimal funds evidence.", sourceUrl: "https://mfa.tj/", effectiveDate: "2026-01" },
    [{ from: "LHE", priceMin: 260, priceMax: 480, currency: "USD" }, { from: "DXB", priceMin: 290, priceMax: 510, currency: "USD" }, { from: "ISB", priceMin: 230, priceMax: 440, currency: "USD" }, { from: "KHI", priceMin: 250, priceMax: 470, currency: "USD" }],
    false, 18,
  ),
];

const faqs = [
  { category: "Admissions", sortOrder: 1, question: "Can I get UK admission without IELTS?", answer: "Yes. For the UK 2027 intakes, our partner universities accept Medium of Instruction (MOI) letters, so many applicants can apply with or without IELTS and without a university interview. Eligibility depends on your prior education being English-medium." },
  { category: "Admissions", sortOrder: 2, question: "Is tuition really free in Italy?", answer: "On fully funded regional scholarships, tuition at Italian public universities is free, and eligible students can also receive free accommodation. On the partial scholarship route, year one costs approximately €3,600 and subsequent years are free. A bank statement of approximately PKR 4.5–5.5 million is required, which blood relatives may also provide." },
  { category: "Admissions", sortOrder: 3, question: "Can my family join me in Finland?", answer: "Yes. Finland's €9,600/year funds requirement uniquely covers the student plus spouse and children. Spouses receive full work rights, children receive free education, and there is a clear TRC-to-PR pathway after graduation." },
  { category: "Admissions", sortOrder: 4, question: "Is Georgia MBBS recognised?", answer: "The Georgian medical universities we work with are MCI/NMC and WHO recognised. Tuition is approximately $4,000–$5,000 per year, no IELTS is required, and study gaps are accepted." },
  { category: "Immigration", sortOrder: 1, question: "How does the Canada 10-Year LOI visit visa payment work?", answer: "The total package is AED 7,500 (approx. PKR 575k) paid in three milestones: AED 1,500 at submission, AED 1,500 at biometrics, and AED 4,500 after approval. If the application is refused, only the initial AED 1,500 is deducted. Processing takes approximately 60–70 days." },
  { category: "Immigration", sortOrder: 2, question: "What UAE visas do you handle?", answer: "We process UAE Visit, Freelance, Family and Golden Visas through PRO & GDRFA-approved channels, with government and advisory fees always itemised separately." },
  { category: "Immigration", sortOrder: 3, question: "Can Afghan passport holders get a Turkey visa?", answer: "Afghan passport holders legally resident in the UAE can apply for a Turkey visa on the basis of their Emirates ID residence through our special pathway service." },
  { category: "Training", sortOrder: 1, question: "Who teaches the IELTS courses?", answer: "All Cambridge and IELTS training is led by Zeb Khan, Senior Consultant & Executive Trainer — MA English, MEd, PGD TEFL, Dip EPM, and British Council Certified Trainer." },
  { category: "Training", sortOrder: 2, question: "Do you offer online classes?", answer: "Yes. All Cambridge and IELTS tracks are available in person (Dubai and Pakistan) or online, with the same diagnostic assessment and band-improvement roadmap." },
  { category: "General", sortOrder: 1, question: "Where are your offices?", answer: "Our headquarters is in Dubai, UAE (+971 58 682 6099) and we operate in Pakistan (+92 312 552 6099). Consultations are available in person and online." },
];

const posts = [
  {
    title: "UKVI 28-Day Bank Statement Rule: The Complete 2026 Guide",
    slug: "ukvi-28-day-bank-statement-rule",
    category: "Bank Statement Guides",
    tags: "UK, student visa, bank statement, UKVI",
    excerpt: "Exactly how much money you must show, for how long, and the mistakes that get UK student visas refused.",
    body: `## What the 28-day rule means\n\nUK Visas & Immigration (UKVI) requires Student Route applicants to hold their maintenance funds for **28 consecutive days** before applying. The balance must never drop below the required amount during that period, and the statement date must be within 31 days of the application.\n\n## How much you must show\n\n- **London:** £1,344 per month × 9 months = **£12,096**\n- **Outside London:** £1,023 per month × 9 months = **£9,207**\n- **Plus** any unpaid first-year tuition fees shown on your CAS.\n\n## Common refusal triggers\n\n1. Balance dipping below the threshold for even one day.\n2. Statements older than 31 days at application.\n3. Large, unexplained recent deposits.\n4. Using a non-permitted account holder (only you or a parent/legal guardian for personal funds).\n\n## Plan your timeline\n\nStart seasoning funds **at least 6 weeks** before your intended application date. Our admissions team maps your CAS issuance, statement window and application date so the three align — request a consultation to build your timeline.`,
  },
  {
    title: "Germany Blocked Account (Sperrkonto) Amount 2026",
    slug: "germany-blocked-account-2026",
    category: "Bank Statement Guides",
    tags: "Germany, Sperrkonto, student visa",
    excerpt: "The €11,208 blocked account explained — how it works, which providers to use, and how the monthly payout functions.",
    body: `## What is a Sperrkonto?\n\nA blocked account is a special German bank account that proves you can support yourself. You deposit the statutory annual amount — **€11,208** — and the bank releases **€934 per month** to you after arrival.\n\n## Key facts for 2026\n\n- Deposit: **€11,208** (12 × €934)\n- Monthly release: €934\n- The account must be opened **before** your visa application; the confirmation letter is part of your visa file.\n\n## Process\n\n1. Open the blocked account with an approved provider.\n2. Transfer the full amount plus provider fees.\n3. Receive the blocking confirmation for your visa appointment.\n4. Activate the account after arrival with your German registration.\n\nPair the blocked account with your admission letter and health insurance for a complete file. Our counselors verify your documents before submission.`,
  },
  {
    title: "IELTS Academic vs General Training: Which Do You Need?",
    slug: "ielts-academic-vs-general",
    category: "IELTS Preparation",
    tags: "IELTS, Academic, General Training",
    excerpt: "Academic for university admission, General Training for migration and work — how to choose and how the scoring differs.",
    body: `## The core difference\n\n**IELTS Academic** is for university admission and professional registration. **IELTS General Training** is for migration (Canada, UK, Australia) and most work visas.\n\n## What changes between them\n\n- **Reading:** Academic uses journal-style texts; General uses workplace and everyday texts.\n- **Writing Task 1:** Academic describes charts/graphs; General writes a letter.\n- **Listening & Speaking:** identical in both.\n\n## Choosing the right test\n\n- Applying to university? → Academic (or check MOI acceptance — you may not need IELTS at all for our UK partner universities).\n- Migrating or working abroad? → General Training.\n\nEvery Kishaa candidate starts with a diagnostic assessment under British Council Certified Trainer Zeb Khan, then follows a personalized band-improvement roadmap. Book a consultation to plan your target band.`,
  },
  {
    title: "Canada 10-Year Multiple Entry Visit Visa with Business LOI",
    slug: "canada-10-year-loi-visit-visa-guide",
    category: "Visa Guides",
    tags: "Canada, visit visa, LOI",
    excerpt: "How the 10-year multiple entry visa works, what the Business Invitation Letter adds, and the milestone payment structure.",
    body: `## What the visa gives you\n\nA Canada multiple entry visitor visa can be valid for **up to 10 years**, allowing stays of **up to 6 months per visit**.\n\n## The Kishaa package\n\n- Business Invitation Letter (LOI)\n- Sponsor Letter\n- IRCC and VFS biometric fees\n- Complete application preparation\n\n**Total: AED 7,500 (approx. PKR 575k)** in three milestones — AED 1,500 at submission, AED 1,500 at biometrics, AED 4,500 after approval. Only AED 1,500 is deducted in case of refusal. Official processing takes approximately 60–70 days.\n\n## Financial evidence\n\nIRCC expects a consistent **6-month bank statement** backing your LOI and sponsor letters. Start organising statements early — our team reviews them against current officer expectations before submission.`,
  },
];

const testimonials = [
  { quote: "My UK admission was handled end to end — MOI route, no IELTS, and a £3,000 scholarship. The team was transparent about every fee from day one.", authorName: "Ayesha R.", context: "UK Master's admission, 2026 intake", program: "UK 2027 Intake", country: "United Kingdom", rating: 5, source: "direct" as const },
  { quote: "The Canada visit visa came through in about two months. The milestone payment plan meant I only paid the final amount after approval — that built real trust.", authorName: "Bilal H.", context: "Canada 10-Yr LOI visit visa", program: "Canada 10-Year LOI Visit Visa", country: "Canada", rating: 5, source: "direct" as const },
  { quote: "I moved from band 5.5 to 7.0 in eight weeks. Zeb Khan's writing feedback was precise — every essay came back with a clear roadmap.", authorName: "Fatima N.", context: "IELTS Academic, Band 7.0", program: "IELTS Preparation", country: "UAE", rating: 5, source: "direct" as const },
  { quote: "Italy full scholarship with free accommodation — I paid almost nothing for tuition. The bank statement guidance for my father's account was spot on.", authorName: "Usman T.", context: "Italy English-taught Bachelor's", program: "Italy Free Tuition", country: "Italy", rating: 5, source: "direct" as const },
  { quote: "My wife received work rights and our daughter started free school in Helsinki. The Finland family route was explained clearly before we paid anything.", authorName: "Imran S.", context: "Finland Master's with family", program: "Finland Study & PR", country: "Finland", rating: 5, source: "direct" as const },
  { quote: "Professional and honest. They told me straight away that my profile suited Georgia MBBS better than the UK — no overselling.", authorName: "Mahnoor A.", context: "Georgia MBBS admission", program: "Georgia MBBS & Tech", country: "Georgia", rating: 5, source: "direct" as const },
];

const redirects = [
  { oldPath: "/courses", newPath: "/cambridge-courses", type: 301 },
  { oldPath: "/exam-help", newPath: "/cambridge-courses", type: 301 },
  { oldPath: "/visa-consultancy", newPath: "/immigration-consultancy", type: 301 },
  { oldPath: "/news-and-events", newPath: "/resources", type: 301 },
  { oldPath: "/about", newPath: "/about-us", type: 301 },
];

const settings = [
  {
    key: "site",
    value: JSON.stringify({
      name: "Kishaa International",
      tagline: "Gateway to Global Careers",
      slogan: "One Company, Global Solutions",
      phoneUAE: "+971 58 682 6099",
      phonePK: "+92 312 552 6099",
      email: "kishaainternational@gmail.com",
      domain: "www.kishaainternational.com",
      whatsappUAE: "971586826099",
      whatsappPK: "923125526099",
      addressUAE: "Dubai, UAE (Headquarters)",
      addressPK: "Pakistan",
    }),
  },
];

async function main() {
  console.log("Seeding Kishaa International CMS…");
  for (const p of programs) await db.insert(s.programs).values(p);
  for (const t of team) await db.insert(s.teamMembers).values(t);
  for (const c of countries) await db.insert(s.countries).values(c);
  for (const f of faqs) await db.insert(s.faqs).values(f);
  for (const p of posts)
    await db.insert(s.posts).values({ ...p, status: "published", publishedAt: new Date() });
  for (const t of testimonials) await db.insert(s.testimonials).values(t);
  for (const r of redirects) await db.insert(s.redirects).values(r);
  for (const st of settings) await db.insert(s.settings).values(st);
  console.log("Seed complete:",
    `${programs.length} programs, ${countries.length} countries, ${faqs.length} FAQs, ${posts.length} posts, ${testimonials.length} testimonials, ${redirects.length} redirects.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

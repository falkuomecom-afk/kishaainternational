import { useState } from "react";
import { Link } from "react-router";
import {
  ArrowRight,
  GraduationCap,
  Globe2,
  BookOpenCheck,
  Calculator,
  Plane,
  Wallet,
  Landmark,
  Star,
  Check,
  BadgeCheck,
  HelpCircle,
  FileCheck2,
  Compass,
  Building2,
  Sparkles,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { trpc } from "@/providers/trpc";
import { Seo, orgJsonLd, zebJsonLd, faqJsonLd } from "@/lib/seo";
import { useReveal } from "@/lib/reveal";
import { SITE, waLink } from "@/lib/site";
import { ProgramCard, TestimonialCard, FaqAccordion } from "@/components/site/blocks";
import { EnquiryForm } from "@/components/site/EnquiryForm";
import type { Program, Testimonial, Faq } from "@/types";

const TRIAD = [
  {
    icon: GraduationCap,
    title: "Career Counseling & Admissions",
    text: "Educational pathway planning, university admissions across the UK, Italy, Finland, Georgia, Canada and beyond — with CV and interview preparation.",
    to: "/career-counseling",
  },
  {
    icon: Globe2,
    title: "Immigration Consultancy",
    text: "Transparent visa consultancy: Canada 10-Yr LOI visit visas, UAE Golden & Freelance visas (PRO & GDRFA approved), Turkey, Serbia, Romania and Schengen.",
    to: "/immigration-consultancy",
  },
  {
    icon: BookOpenCheck,
    title: "Cambridge Courses Training",
    text: "Spoken English, IELTS Academic & General, and Cambridge English tracks — led by British Council Certified Trainer Zeb Khan.",
    to: "/cambridge-courses",
  },
];

const DEFAULT_COUNTRIES_PREVIEW = [
  { name: "United Kingdom", slug: "united-kingdom", flag: "🇬🇧", region: "Europe", fundsRule: '{"currency":"GBP","amount":13347,"note":"London £1,483/mo · Outside London £1,136/mo (up to 9 months)"}', livingCosts: '{"currency":"GBP","budget":1100,"standard":1350,"comfortable":1800,"note":"London average £1,400–1,800/mo; regional UK £900–1,200/mo"}' },
  { name: "Italy", slug: "italy", flag: "🇮🇹", region: "Europe", fundsRule: '{"currency":"EUR","amount":6000,"note":"PKR 4.5–5.5M in personal/parent bank account"}', livingCosts: '{"currency":"EUR","budget":700,"standard":900,"comfortable":1200,"note":"Regional Italian university cities average €700–900/mo"}' },
  { name: "Finland", slug: "finland", flag: "🇫🇮", region: "Europe", fundsRule: '{"currency":"EUR","amount":9600,"note":"€9,600/yr (covers applicant + spouse/dependants)"}', livingCosts: '{"currency":"EUR","budget":750,"standard":900,"comfortable":1250,"note":"Helsinki higher; Tampere/Oulu €750–900/mo"}' },
  { name: "Georgia", slug: "georgia", flag: "🇬🇪", region: "Eurasia", fundsRule: '{"currency":"USD","amount":5000,"note":"Proof of tuition deposit + living support"}', livingCosts: '{"currency":"USD","budget":500,"standard":700,"comfortable":1100,"note":"Tbilisi student housing & living ~USD 500–700/mo"}' },
  { name: "Germany", slug: "germany", flag: "🇩🇪", region: "Europe", fundsRule: '{"currency":"EUR","amount":11904,"note":"€11,904 in blocked account (Sperrkonto)"}', livingCosts: '{"currency":"EUR","budget":850,"standard":992,"comfortable":1300,"note":"Monthly statutory cap €992/mo"}' },
  { name: "Canada", slug: "canada", flag: "🇨🇦", region: "North America", fundsRule: '{"currency":"CAD","amount":20635,"note":"IRCC cost-of-living financial threshold"}', livingCosts: '{"currency":"CAD","budget":1300,"standard":1600,"comfortable":2200,"note":"Toronto/Vancouver higher; other provinces CAD 1,400/mo"}' },
  { name: "United States", slug: "united-states", flag: "🇺🇸", region: "North America", fundsRule: '{"currency":"USD","amount":25000,"note":"Form I-20 financial declaration requirement"}', livingCosts: '{"currency":"USD","budget":1200,"standard":1800,"comfortable":2500,"note":"Varies by university and state location"}' },
  { name: "Australia", slug: "australia", flag: "🇦🇺", region: "Oceania", fundsRule: '{"currency":"AUD","amount":29710,"note":"Department of Home Affairs annual living index"}', livingCosts: '{"currency":"AUD","budget":1800,"standard":2400,"comfortable":3200,"note":"Sydney/Melbourne AUD 2,200–2,600/mo"}' },
  { name: "United Arab Emirates", slug: "united-arab-emirates", flag: "🇦🇪", region: "Middle East", fundsRule: '{"currency":"AED","amount":10000,"note":"Entry permit and security deposit requirement"}', livingCosts: '{"currency":"AED","budget":2800,"standard":4200,"comfortable":6500,"note":"Dubai shared/studio living AED 3,500–4,500/mo"}' },
];

const DEFAULT_PROGRAMS: Program[] = [
  {
    id: 1,
    name: "UK 2027 Admissions (MOI Accepted)",
    slug: "uk-university-admissions",
    pillar: "career",
    type: "service",
    summary: "25+ partner universities across the UK. Medium of Instruction letters accepted with or without IELTS, no university interview required, and scholarships up to £5,000.",
    fees: "GBP 11,300–15,500 (Initial deposit £4,000–£6,500)",
  },
  {
    id: 2,
    name: "Italy Free Tuition & Regional Scholarships",
    slug: "italy-study-scholarships",
    pillar: "career",
    type: "service",
    summary: "Fully funded scholarship routes where tuition can be 100% free, with subsidised accommodation and PKR 4.5–5.5M bank statement requirement.",
    fees: "EUR 0–3,600 (Free on regional DSU scholarship)",
  },
  {
    id: 3,
    name: "Finland Study & Family Relocation Route",
    slug: "finland-study-family-residence",
    pillar: "career",
    type: "service",
    summary: "€9,600 statutory personal funds requirement covering applicant plus dependants. Spouses receive work rights and children attend public schools free.",
    fees: "EUR 6,500/year (Statutory funds €9,600)",
  },
  {
    id: 4,
    name: "Georgia MBBS & Medical University Admissions",
    slug: "georgia-mbbs-admissions",
    pillar: "career",
    type: "service",
    summary: "MCI and WHO listed medical degrees from $4,000/yr. Study gaps accepted, no IELTS requirement for qualifying applicants, and low living costs.",
    fees: "USD 4,000–5,000/year",
  },
  {
    id: 5,
    name: "Canada 10-Year Multiple-Entry Visit Visa",
    slug: "canada-10-year-visit-visa",
    pillar: "immigration",
    type: "service",
    summary: "Comprehensive file preparation with a verified business Invitation Letter (LOI), sponsor letter, IRCC submission and biometric appointment guidance.",
    fees: "AED 7,500 (Phased milestones)",
  },
  {
    id: 6,
    name: "UAE Golden & Freelance Visas (PRO & GDRFA)",
    slug: "uae-golden-freelance-visas",
    pillar: "immigration",
    type: "service",
    summary: "10-year Golden residency and Freelance permits filed through official PRO services and GDRFA channels, including document attestation and Emirates ID.",
    fees: "AED 4,500–12,000 depending on category",
  },
  {
    id: 7,
    name: "Turkey Visa via Emirates ID for Afghan Passports",
    slug: "turkey-emirates-id-afghan-passports",
    pillar: "immigration",
    type: "service",
    summary: "Route guidance for Afghan passport holders legally resident in the UAE. Verified checklist, appointment booking, and honest eligibility screening.",
    fees: "Consultation assessment based",
  },
  {
    id: 8,
    name: "IELTS Academic & General Training Masterclass",
    slug: "ielts-preparation-masterclass",
    pillar: "cambridge",
    type: "course",
    summary: "10-week intensive band-improvement roadmap led by British Council Certified Trainer Zeb Khan. Diagnostic test, 12 marked writings and 4 mock exams.",
    fees: "Course packages with group & 1-on-1 options",
  },
  {
    id: 9,
    name: "Spoken English & Cambridge Fluency Track",
    slug: "spoken-english-cambridge-track",
    pillar: "cambridge",
    type: "course",
    summary: "Pronunciation, professional vocabulary, meeting fluency and presentation skills for ambitious students and corporate executives.",
    fees: "Flexible batches (online & in-person)",
  },
];

const DEFAULT_TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    authorName: "Hamza R.",
    context: "UK MSc Student · University of Greenwich",
    quote: "Kishaa International handled my UK 2027 application with an MOI letter when others told me IELTS was compulsory. CAS and visa both came through smoothly without delays.",
    rating: 5,
  },
  {
    id: 2,
    authorName: "Tariq M.",
    context: "Canada 10-Yr Visit Visa Holder · Dubai",
    quote: "The Canada visit visa with business LOI was processed within 65 days. Transparent milestones, itemised fees, and no unrealistic promises.",
    rating: 5,
  },
  {
    id: 3,
    authorName: "Ayesha K.",
    context: "Finland Family Relocation · Helsinki",
    quote: "Finland student permit with spouse and child was approved in 5 weeks. Having the €9,600 funds rule and family rights explained clearly made all the difference.",
    rating: 5,
  },
];

const DEFAULT_FAQS: Faq[] = [
  {
    id: 1,
    question: "Do you guarantee visas, admissions or IELTS bands?",
    answer: "No. Visa grants, admission offers and test bands are decided solely by the relevant embassy, university or examination board. We publish honest assessments, verify every document, and never make false promises.",
  },
  {
    id: 2,
    question: "What are the UK tuition and deposit costs for 2027?",
    answer: "Partner university tuition typically ranges from £11,300 to £15,500 with an initial deposit of £4,000–£6,500. Medium of Instruction letters are accepted with or without IELTS at participating universities, and scholarships can reach up to £5,000.",
  },
  {
    id: 3,
    question: "Can my family accompany me to Finland on a student permit?",
    answer: "Yes. Finland's €9,600 statutory personal funds requirement covers the student together with dependants. Spouses receive full work rights and children attend public schools free of charge.",
  },
  {
    id: 4,
    question: "What does the Canada 10-year visit visa package include?",
    answer: "The package includes profile evaluation, a business Invitation Letter (LOI), sponsor documentation, IRCC portal filing, and VFS biometric appointment booking with bank statement guidance.",
  },
  {
    id: 5,
    question: "Is the Cost Planner free to use?",
    answer: "Yes. You can calculate airfare, city living expenses and statutory embassy bank statement rules for any destination without submitting your contact details.",
  },
  {
    id: 6,
    question: "Who teaches the Cambridge & IELTS courses?",
    answer: "Zeb Khan, Senior Consultant & Executive Trainer, leads all Cambridge and IELTS tracks. He holds an MA in English, MEd, PGD TEFL, Dip EPM, and is a British Council Certified Trainer.",
  },
];

const PROCESS_STEPS = [
  {
    step: "01",
    title: "Discover",
    detail: "Share your goal — study abroad, visa pathway, or English training — and your preferred destinations.",
  },
  {
    step: "02",
    title: "Calculate",
    detail: "We model tuition, flight estimates, city living costs and the statutory bank statement rule with real dates.",
  },
  {
    step: "03",
    title: "Verify",
    detail: "Inspect credentialed authorities, official embassy requirements, and transparent milestone fee structures.",
  },
  {
    step: "04",
    title: "Convert",
    detail: "Choose phone, WhatsApp or email — a named senior consultant responds within one business day.",
  },
];

const SOURCES_LIST = [
  { authority: "UK Visas & Immigration", rule: "Appendix Student Maintenance Requirement", effective: "2025-01-02", url: "https://www.gov.uk/student-visa/money" },
  { authority: "Migri (Finnish Immigration)", rule: "Student Residence Permit Maintenance", effective: "2025-01-01", url: "https://migri.fi/en/studying" },
  { authority: "German Foreign Office", rule: "§ 16b AufenthG Blocked Account Rate", effective: "2025-09-01", url: "https://www.auswaertiges-amt.de/en/visa-service" },
  { authority: "IRCC Canada", rule: "Visitor Visa Documentation & Financial Guidelines", effective: "2026-08-01", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada.html" },
  { authority: "Australian Home Affairs", rule: "Subclass 500 Financial Capacity Index", effective: "2024-05-10", url: "https://immi.homeaffairs.gov.au/" },
  { authority: "Numbeo & National Statistics", rule: "City Living-Cost Indices & Housing Profiles", effective: "2026-08-15", url: "https://www.numbeo.com/cost-of-living/" },
];

export default function Home() {
  const { data: featuredData } = trpc.content.programs.featured.useQuery();
  const { data: countriesData } = trpc.content.countries.list.useQuery();
  const { data: testimonialsData } = trpc.content.testimonials.list.useQuery();
  const { data: faqsData } = trpc.content.faqs.list.useQuery();
  const { data: zeb } = trpc.content.team.bySlug.useQuery({ slug: "zeb-khan" });

  const [teaserCountry, setTeaserCountry] = useState("united-kingdom");

  const programsList = (featuredData && featuredData.length > 0) ? featuredData : DEFAULT_PROGRAMS;
  const countryList = (countriesData && countriesData.length > 0) ? countriesData : DEFAULT_COUNTRIES_PREVIEW;
  const testimonialsList = (testimonialsData && testimonialsData.length > 0) ? testimonialsData : DEFAULT_TESTIMONIALS;
  const faqsList = (faqsData && faqsData.length > 0) ? faqsData : DEFAULT_FAQS;

  useReveal(programsList);

  const career = programsList.filter((p: Program) => p.pillar === "career").slice(0, 4);
  const immigrationRaw = programsList.filter((p: Program) => p.pillar === "immigration");
  const immigration: Program[] = [...immigrationRaw.slice(0, 3)];
  if (immigration.length < 3) {
    const defaultImm = DEFAULT_PROGRAMS.filter((p: Program) => p.pillar === "immigration");
    const existingSlugs = new Set(immigration.map((p) => p.slug));
    for (const item of defaultImm) {
      if (!existingSlugs.has(item.slug) && immigration.length < 3) {
        immigration.push(item);
      }
    }
  }
  const cambridge = programsList.filter((p: Program) => p.pillar === "cambridge").slice(0, 2);

  const selected = countryList.find((c) => c.slug === teaserCountry) || countryList[0];
  let selectedFunds: { currency?: string; amount?: number; note?: string } | null = null;
  let selectedLiving: { currency?: string; budget?: number; standard?: number; comfortable?: number; note?: string } | null = null;

  try {
    if (selected?.fundsRule) {
      selectedFunds = typeof selected.fundsRule === "string" ? JSON.parse(selected.fundsRule) : selected.fundsRule;
    }
  } catch {
    selectedFunds = null;
  }
  try {
    if (selected?.livingCosts) {
      selectedLiving = typeof selected.livingCosts === "string" ? JSON.parse(selected.livingCosts) : selected.livingCosts;
    }
  } catch {
    selectedLiving = null;
  }

  return (
    <>
      <Seo
        title="Kishaa International — Career Counseling, Immigration Consultancy & Cambridge Training"
        description="Gateway to Global Careers. UK 2027 MOI admissions, Italy free tuition, Finland family/PR, Georgia MBBS, Canada 10-Yr LOI visit visas, UAE Golden visas and IELTS training with Zeb Khan. Dubai, UAE (HQ) & Pakistan."
        path="/"
        jsonLd={[orgJsonLd, zebJsonLd, ...(faqsList?.length ? [faqJsonLd(faqsList.slice(0, 6))] : [])]}
      />

      {/* 01 — Triad Hero */}
      <section className="relative overflow-hidden bg-navy text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, #c9a227 0, transparent 40%), radial-gradient(circle at 85% 75%, #c9a227 0, transparent 35%)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 md:py-32">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-gold">
            <Sparkles className="h-3.5 w-3.5" /> Gateway to Global Careers · One Company, Global Solutions
          </div>
          <h1 className="mt-6 max-w-4xl font-serif text-5xl font-medium leading-[1.05] md:text-7xl">
            Your global career,
            <br />
            <span className="text-gold">engineered with precision.</span>
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-white/70">
            Explore expert career counseling, immigration consultancy, and Cambridge courses
            training with Kishaa International — from 10-year Canada visit visas with business LOI
            letters to UK, Italy, Finland and Georgia admissions, and English mastery under British
            Council Certified Trainer Zeb Khan.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link to="/contact" className="btn-gold">
              Request a Visa & Admissions Consultation
            </Link>
            <Link to="/cambridge-courses" className="btn-frame-light">
              Explore Cambridge & IELTS Courses
            </Link>
          </div>

          {/* Trust badges */}
          <div className="mt-12 flex flex-wrap items-center gap-3 text-[13px] text-white/80">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-white/5 px-3 py-1.5">
              <BadgeCheck className="h-4 w-4 text-gold" /> British Council Certified Trainer
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-white/5 px-3 py-1.5">
              <ShieldCheck className="h-4 w-4 text-gold" /> PRO & GDRFA Approved Channels
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-white/5 px-3 py-1.5">
              <FileCheck2 className="h-4 w-4 text-gold" /> Statutory Sources Dated & Versioned
            </span>
          </div>

          {/* Stats Bar */}
          <div className="mt-16 grid grid-cols-2 gap-4 border-t border-white/10 pt-10 sm:grid-cols-4">
            <div>
              <p className="font-serif text-3xl font-medium text-gold md:text-4xl">26</p>
              <p className="mt-1 text-[13px] text-white/60">Countries with sourced cost data</p>
            </div>
            <div>
              <p className="font-serif text-3xl font-medium text-gold md:text-4xl">60–70</p>
              <p className="mt-1 text-[13px] text-white/60">Days typical Canada visit processing</p>
            </div>
            <div>
              <p className="font-serif text-3xl font-medium text-gold md:text-4xl">2</p>
              <p className="mt-1 text-[13px] text-white/60">Offices — Dubai HQ & Pakistan</p>
            </div>
            <div>
              <p className="font-serif text-3xl font-medium text-gold md:text-4xl">4.9 ★</p>
              <p className="mt-1 text-[13px] text-white/60">Average rating across 200+ reviews</p>
            </div>
          </div>

          {/* Triad cards */}
          <div className="mt-16 grid gap-px bg-white/10 md:grid-cols-3">
            {TRIAD.map((t) => (
              <Link
                key={t.title}
                to={t.to}
                className="group bg-navy p-8 transition-colors hover:bg-navy-light"
              >
                <t.icon className="h-8 w-8 text-gold" strokeWidth={1.5} />
                <h2 className="mt-5 font-serif text-2xl font-medium">{t.title}</h2>
                <p className="mt-3 text-[14px] leading-relaxed text-white/60">{t.text}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-gold">
                  Explore <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 02 — Answer-First Section (AEO / GEO Authority Card) */}
      <section className="border-b border-navy/10 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="rounded-2xl border border-gold/30 bg-[#FAF9F5] p-8 md:p-12 shadow-sm">
            <div className="flex items-center gap-2 text-gold-dark">
              <HelpCircle className="h-5 w-5" />
              <span className="eyebrow !text-gold-dark !mb-0">Direct Answer</span>
            </div>
            <h2 className="mt-3 font-serif text-2xl font-medium text-navy md:text-3xl">
              What does Kishaa International actually do?
            </h2>
            <p className="mt-4 text-[16px] leading-relaxed text-navy/80 md:text-[17px]">
              Kishaa International is a Dubai-headquartered consultancy with a Pakistan office that
              delivers three integrated services: <strong>career counseling & university admissions</strong>,{" "}
              <strong>immigration & visa consultancy</strong>, and <strong>Cambridge & IELTS training</strong>.
              You can compare destinations, calculate flight, city living and statutory proof-of-funds costs on
              this site for free, then book a consultation with a named advisor — with transparent fees,
              no guaranteed-outcome promises, and no payment until scope is confirmed in writing.
            </p>
            <div className="mt-6 flex flex-wrap gap-4 text-[13px] font-semibold uppercase tracking-[0.1em]">
              <Link to="/about" className="inline-flex items-center gap-1.5 text-navy hover:text-gold-dark">
                About our firm <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <span className="text-navy/20">·</span>
              <Link to="/cost-planner" className="inline-flex items-center gap-1.5 text-navy hover:text-gold-dark">
                Free Cost Intelligence <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <span className="text-navy/20">·</span>
              <Link to="/team/zeb-khan" className="inline-flex items-center gap-1.5 text-navy hover:text-gold-dark">
                Senior Consultant Profile <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 03 — Cost planner teaser */}
      <section className="border-b border-navy/10 bg-paper">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center">
          <div className="reveal">
            <p className="eyebrow">Live ticket & cost calculator</p>
            <h2 className="mt-4 font-serif text-4xl font-medium text-navy md:text-5xl">
              Know your budget before you commit.
            </h2>
            <p className="mt-5 text-[16px] leading-relaxed text-navy/70">
              Airfare, monthly living costs and the official embassy bank statement — calculated
              separately, sourced transparently, and tailored to your destination and visa purpose.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                { icon: Plane, label: "Flight tickets" },
                { icon: Wallet, label: "Living costs" },
                { icon: Landmark, label: "Bank statements" },
              ].map((x) => (
                <div key={x.label} className="border border-navy/10 bg-white p-4 text-center">
                  <x.icon className="mx-auto h-6 w-6 text-gold-dark" strokeWidth={1.5} />
                  <p className="mt-2 text-[12px] font-semibold uppercase tracking-[0.1em] text-navy/70">
                    {x.label}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/cost-planner" className="btn-fill">
                <Calculator className="h-4 w-4" /> Open the Cost Planner
              </Link>
              <Link to="/bank-statements" className="btn-frame">
                Bank Statement Guide
              </Link>
            </div>
          </div>

          <div className="reveal border border-navy/10 bg-white p-8 rounded-xl shadow-sm">
            <label htmlFor="teaser-country" className="eyebrow">
              Quick preview — choose a destination
            </label>
            <select
              id="teaser-country"
              value={teaserCountry}
              onChange={(e) => setTeaserCountry(e.target.value)}
              className="mt-3 w-full border border-navy/20 px-4 py-3 text-[15px] text-navy outline-none focus:border-gold bg-white rounded"
            >
              {countryList.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.flag} {c.name}
                </option>
              ))}
            </select>
            {selected && (
              <div className="mt-6 space-y-4">
                <div className="flex items-baseline justify-between border-b border-navy/10 pb-3">
                  <span className="text-[14px] text-navy/60">Living cost / month</span>
                  <span className="font-serif text-2xl text-navy">
                    {selectedLiving && selectedLiving.standard != null
                      ? `${selectedLiving.currency || ""} ${Number(selectedLiving.standard).toLocaleString()}`
                      : "—"}
                  </span>
                </div>
                <div className="flex items-baseline justify-between border-b border-navy/10 pb-3">
                  <span className="text-[14px] text-navy/60">Embassy funds rule</span>
                  <span className="font-serif text-2xl text-navy">
                    {selectedFunds && selectedFunds.amount != null
                      ? `${selectedFunds.currency || ""} ${Number(selectedFunds.amount).toLocaleString()}`
                      : "—"}
                  </span>
                </div>
                <p className="text-[12px] leading-relaxed text-navy/50">
                  {selectedFunds?.note ?? "Select a destination to preview verified figures."}
                </p>
                <Link
                  to={`/cost-planner?country=${selected.slug}`}
                  className="btn-frame w-full text-center block"
                >
                  Calculate my full estimate
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 04 — How a Kishaa Consultation Works (Process) */}
      <section className="border-b border-navy/10 bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="reveal text-center">
            <p className="eyebrow">How we work</p>
            <h2 className="mt-3 font-serif text-4xl font-medium text-navy md:text-5xl">
              Transparent consultation, from intake to outcome.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[16px] leading-relaxed text-navy/70">
              Every applicant receives a structured four-stage process designed to eliminate guesswork,
              unrealistic promises, and avoidable refusals.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PROCESS_STEPS.map((p) => (
              <div
                key={p.step}
                className="reveal flex flex-col rounded-xl border border-navy/10 bg-[#FAF9F5] p-7 transition-all hover:border-gold hover:shadow-md"
              >
                <span className="font-serif text-4xl font-medium text-gold">{p.step}</span>
                <h3 className="mt-4 font-serif text-xl font-medium text-navy">{p.title}</h3>
                <p className="mt-3 text-[14px] leading-relaxed text-navy/65">{p.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 05 — Flagship visa pathways */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="reveal flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow">Flagship pathways</p>
            <h2 className="mt-3 font-serif text-4xl font-medium text-navy md:text-5xl">
              Immigration, done transparently.
            </h2>
          </div>
          <Link to="/immigration-consultancy" className="btn-frame">
            All visa routes <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {immigration.map((p: Program, i: number) => (
            <div key={p.id} className="reveal">
              <ProgramCard program={p} index={i} />
            </div>
          ))}
        </div>
      </section>

      {/* 06 — Meet Zeb Khan */}
      <section className="bg-ink text-white">
        <div className="mx-auto grid max-w-7xl gap-14 px-4 py-24 sm:px-6 lg:grid-cols-12 lg:items-center">
          <div className="reveal lg:col-span-5">
            <div className="relative overflow-hidden rounded-2xl border border-gold/30 bg-[#021226]/80 p-6 sm:p-8 text-center shadow-2xl">
              <div className="relative mx-auto mb-6 h-64 w-52 sm:h-72 sm:w-60 overflow-hidden rounded-2xl border-2 border-gold/40 shadow-[0_4px_30px_rgba(201,162,39,0.3)]">
                <img
                  src="/img/zeb-khan.png"
                  alt="Zeb Khan - Senior Consultant & Executive Trainer"
                  className="h-full w-full object-cover object-top"
                />
              </div>
              <h3 className="font-serif text-3xl font-medium text-white">Zeb Khan</h3>
              <p className="mt-2 text-[13px] uppercase tracking-[0.18em] text-[#ECC248] font-semibold">
                Senior Consultant & Executive Trainer
              </p>
              <div className="mx-auto mt-6 flex flex-wrap justify-center gap-2">
                {["MA English", "MEd", "PGD TEFL", "Dip EPM", "British Council Certified"].map(
                  (c) => (
                    <span
                      key={c}
                      className="rounded-md border border-gold/40 bg-gold/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-gold"
                    >
                      {c}
                    </span>
                  ),
                )}
              </div>
            </div>
          </div>
          <div className="reveal lg:col-span-7">
            <p className="eyebrow-light">Meet your trainer & consultant</p>
            <h2 className="mt-4 font-serif text-4xl font-medium md:text-5xl">
              Trained by a British Council Certified Trainer.
            </h2>
            <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-white/70">
              {zeb?.bio ??
                "With advanced academic qualifications and British Council certification, Zeb Khan provides executive training and strategic immigration advice for students and professionals across Dubai, UAE and Pakistan."}
            </p>
            <ul className="mt-6 grid max-w-xl gap-2.5 sm:grid-cols-2">
              {(zeb?.expertise?.split("\n") ??
                ["Career Counseling", "Canada 10-Yr LOI visas", "IELTS & Cambridge", "UAE PRO visas"]).map(
                (e) => (
                  <li key={e} className="flex items-start gap-2 text-[14px] text-white/75">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" /> {e}
                  </li>
                ),
              )}
            </ul>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/team/zeb-khan" className="btn-gold">
                Meet Zeb Khan
              </Link>
              <a
                href={waLink("Hello — I'd like to enquire about counseling & training with Zeb Khan.")}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-frame-light"
              >
                Consult with Zeb Khan
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 07 — Destination Intelligence Hub */}
      <section className="border-b border-navy/10 bg-paper py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="reveal flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow">Destination Intelligence Hub</p>
              <h2 className="mt-3 font-serif text-4xl font-medium text-navy md:text-5xl">
                Global destinations with verified costs.
              </h2>
              <p className="mt-3 max-w-xl text-[15px] text-navy/65">
                Accurate statutory embassy maintenance funds and city living expenses for 18+ study and migration destinations.
              </p>
            </div>
            <Link to="/destinations" className="btn-frame">
              All 18 destinations <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {countryList.slice(0, 8).map((c) => {
              let living = null;
              try {
                if (c.livingCosts) living = typeof c.livingCosts === "string" ? JSON.parse(c.livingCosts) : c.livingCosts;
              } catch {}
              return (
                <Link
                  key={c.slug}
                  to={`/destinations/${c.slug}`}
                  className="reveal group flex flex-col justify-between rounded-xl border border-navy/10 bg-white p-6 transition-all duration-300 hover:border-gold hover:shadow-lg"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-3xl">{c.flag}</span>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-navy/40">
                        {c.region || "Destination"}
                      </span>
                    </div>
                    <h3 className="mt-4 font-serif text-xl font-medium text-navy group-hover:text-gold-dark transition-colors">
                      {c.name}
                    </h3>
                    <p className="mt-2 text-[13px] text-navy/60 line-clamp-2">
                      {c.summary || "Complete visa guidelines, living costs and university admission routes."}
                    </p>
                  </div>
                  <div className="mt-6 border-t border-navy/10 pt-4 flex items-center justify-between text-[13px]">
                    <span className="font-semibold text-navy">
                      {living?.standard ? `${living.currency || ""} ${Number(living.standard).toLocaleString()}/mo` : "Cost data inside"}
                    </span>
                    <span className="text-gold-dark font-medium inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      View Guide <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 08 — Cambridge & IELTS strip */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="reveal grid gap-10 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-5">
            <p className="eyebrow">Cambridge Courses & IELTS</p>
            <h2 className="mt-3 font-serif text-4xl font-medium text-navy md:text-5xl">
              English mastery with a band-improvement roadmap.
            </h2>
            <p className="mt-5 text-[16px] leading-relaxed text-navy/70">
              Spoken English, IELTS Academic & General Training, Cambridge English courses and
              corporate professional English — every candidate receives a diagnostic assessment and
              a personalized roadmap.
            </p>
            <Link to="/cambridge-courses" className="btn-fill mt-8">
              Choose your English course
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:col-span-7">
            {cambridge.map((p: Program) => (
              <ProgramCard key={p.id} program={p} />
            ))}
          </div>
        </div>
      </section>

      {/* 09 — Verified trust & reviews */}
      <section className="border-y border-navy/10 bg-paper">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="reveal flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow">Verified trust</p>
              <h2 className="mt-3 font-serif text-4xl font-medium text-navy md:text-5xl">
                Real outcomes. Real people.
              </h2>
            </div>
            <div className="flex items-center gap-2 border border-navy/10 bg-white px-5 py-3 rounded-lg shadow-sm">
              <Star className="h-5 w-5 fill-gold text-gold" />
              <span className="text-[14px] font-semibold text-navy">
                4.9/5 average across 200+ verified client outcomes
              </span>
            </div>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {testimonialsList.slice(0, 3).map((t) => (
              <div key={t.id} className="reveal">
                <TestimonialCard t={t} />
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link to="/reviews" className="btn-frame">
              Inspect all reviews & student stories <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 10 — University admissions hub */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="reveal flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow">University admissions hub</p>
            <h2 className="mt-3 font-serif text-4xl font-medium text-navy md:text-5xl">
              Admissions that fit your profile.
            </h2>
          </div>
          <Link to="/career-counseling" className="btn-frame">
            All study programs <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {career.map((p: Program, i: number) => (
            <div key={p.id} className="reveal">
              <ProgramCard program={p} index={i} />
            </div>
          ))}
        </div>
      </section>

      {/* 11 — Frequently Asked Questions */}
      <section className="border-t border-navy/10 bg-[#FAF9F5] py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="reveal text-center">
            <p className="eyebrow">Clear Answers</p>
            <h2 className="mt-3 font-serif text-4xl font-medium text-navy md:text-5xl">
              Questions we are asked before every engagement.
            </h2>
            <p className="mt-4 text-[16px] text-navy/70">
              Clear, transparent information about admissions, visas, fees, and test requirements.
            </p>
          </div>

          <div className="mt-12 rounded-2xl border border-navy/10 bg-white p-6 sm:p-10 shadow-sm">
            <FaqAccordion faqs={faqsList.slice(0, 6)} />
          </div>

          <div className="mt-8 text-center">
            <Link to="/faq" className="btn-frame">
              View all 20+ Frequently Asked Questions <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 12 — Statutory Sources & Citations */}
      <section className="border-t border-navy/10 bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="reveal flex items-center justify-between border-b border-navy/10 pb-6">
            <div>
              <p className="eyebrow !mb-1">Authoritative Citations</p>
              <h2 className="font-serif text-2xl font-medium text-navy">
                Where our figures come from
              </h2>
            </div>
            <span className="text-[12px] font-semibold uppercase tracking-wider text-navy/40 hidden sm:inline-block">
              Government Verified
            </span>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SOURCES_LIST.map((s) => (
              <a
                key={s.authority}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col justify-between rounded-lg border border-navy/10 p-4 transition-colors hover:border-gold hover:bg-[#FAF9F5]"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] font-semibold text-navy group-hover:text-gold-dark transition-colors">
                      {s.authority}
                    </span>
                    <ExternalLink className="h-3.5 w-3.5 text-navy/40 group-hover:text-gold-dark" />
                  </div>
                  <p className="mt-1 text-[13px] text-navy/60">{s.rule}</p>
                </div>
                <div className="mt-3 border-t border-navy/5 pt-2 text-[11px] font-medium text-navy/40">
                  Effective: {s.effective} · Verified
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* 13 — Enquiry */}
      <section className="bg-navy text-white">
        <div className="mx-auto grid max-w-7xl gap-14 px-4 py-24 sm:px-6 lg:grid-cols-2">
          <div className="reveal">
            <p className="eyebrow-light">Start the conversation</p>
            <h2 className="mt-4 font-serif text-4xl font-medium md:text-5xl">
              One form. The right specialist.
            </h2>
            <p className="mt-6 max-w-md text-[16px] leading-relaxed text-white/70">
              Your enquiry is routed to the admissions, visa or training team best placed to help —
              across Dubai and Pakistan. We respond on your preferred channel.
            </p>
            <ul className="mt-8 space-y-3">
              {[
                "Stored privately and reviewed by a named owner",
                "No spam — marketing only if you opt in",
                "Transparent fees, separated from official charges",
              ].map((x) => (
                <li key={x} className="flex items-start gap-2.5 text-[15px] text-white/75">
                  <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-gold" /> {x}
                </li>
              ))}
            </ul>
            <div className="mt-10 border-t border-white/10 pt-6 text-[14px] text-white/60">
              <p>
                Dubai HQ: <a href={`tel:${SITE.phoneUAE.replace(/\s/g, "")}`} className="text-gold">{SITE.phoneUAE}</a>
              </p>
              <p className="mt-1">
                Pakistan: <a href={`tel:${SITE.phonePK.replace(/\s/g, "")}`} className="text-gold">{SITE.phonePK}</a>
              </p>
            </div>
          </div>
          <div className="reveal">
            <EnquiryForm dark source="Homepage" title="Request your consultation" />
          </div>
        </div>
      </section>
    </>
  );
}

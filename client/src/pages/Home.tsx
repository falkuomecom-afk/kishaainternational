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
  Clock,
  Award,
} from "lucide-react";
import { trpc } from "@/providers/trpc";
import { Seo, orgJsonLd, zebJsonLd, faqJsonLd } from "@/lib/seo";
import { useReveal } from "@/lib/reveal";
import { SITE, waLink } from "@/lib/site";
import { ProgramCard, TestimonialCard, FaqAccordion } from "@/components/site/blocks";
import { EnquiryForm } from "@/components/site/EnquiryForm";
import { AnimatedCounter } from "@/components/site/AnimatedCounter";
import type { Program, Testimonial, Faq } from "@/types";

const TRIAD = [
  {
    icon: GraduationCap,
    title: "Career Counseling & Admissions",
    badge: "2027 Intakes Open",
    pulseColor: "bg-emerald-400",
    statusText: "Active Intakes",
    highlights: ["UK (MOI Accepted)", "Italy Full Scholarships", "Finland Family Route"],
    text: "Educational pathway planning, university admissions across the UK, Italy, Finland, Georgia, Canada and beyond — with CV and interview preparation.",
    to: "/career-counseling",
  },
  {
    icon: Globe2,
    title: "Immigration Consultancy",
    badge: "Official PRO & GDRFA",
    pulseColor: "bg-[#ECC248]",
    statusText: "Verified Channels",
    highlights: ["Canada 10-Yr LOI", "UAE Golden & Green", "Schengen 4-Pillar"],
    text: "Transparent visa consultancy: Canada 10-Yr LOI visit visas, UAE Golden & Freelance visas (PRO & GDRFA approved), Turkey, Serbia, Romania and Schengen.",
    to: "/immigration-consultancy",
  },
  {
    icon: BookOpenCheck,
    title: "Cambridge Courses Training",
    badge: "British Council Certified",
    pulseColor: "bg-cyan-400",
    statusText: "Zeb Khan Masterclass",
    highlights: ["Band 6.5 to 7.5 Plan", "Spoken English Track", "Executive Coaching"],
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
    badge: "Intake & Profile",
    detail: "Share your goal — study abroad, visa pathway, or English training — and your preferred destinations.",
  },
  {
    step: "02",
    title: "Calculate",
    badge: "Statutory Modeling",
    detail: "We model tuition, flight estimates, city living costs and the statutory bank statement rule with real dates.",
  },
  {
    step: "03",
    title: "Verify",
    badge: "Official Gazettes",
    detail: "Inspect credentialed authorities, official embassy requirements, and transparent milestone fee structures.",
  },
  {
    step: "04",
    title: "Convert",
    badge: "Direct Execution",
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
      <section className="relative overflow-hidden bg-[#00142e] text-white flex flex-col justify-center min-h-[540px] lg:min-h-[580px]">
        {/* Background photo - Mobile portrait (.webp) */}
        <div
          className="absolute inset-0 bg-cover bg-no-repeat bg-[position:center_top] sm:hidden pointer-events-none"
          style={{
            backgroundImage: "url('/img/hero-global-career-mobile.webp')",
          }}
          role="img"
          aria-label="Global traveler overlooking international destination skyline"
        />
        {/* Soft mobile overlay: keeps image vibrant while guaranteeing text contrast */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-[#00142e]/85 via-[#00142e]/45 to-[#00142e]/90 sm:hidden pointer-events-none"
        />

        {/* Background photo - Desktop landscape (.webp) */}
        <div
          className="absolute inset-0 bg-cover bg-no-repeat bg-right hidden sm:block pointer-events-none"
          style={{
            backgroundImage: "url('/img/hero-global-career.webp')",
          }}
          role="img"
          aria-label="Global traveler overlooking international destination skyline"
        />
        {/* Subtle desktop left-edge gradient to ensure seamless dark navy behind text across all screen widths */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-[#00142e] via-[#00142e]/60 to-transparent w-full md:w-[55%] hidden sm:block pointer-events-none"
        />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-20 lg:py-24 w-full">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-navy/80 backdrop-blur-sm px-4 py-1.5 text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.16em] text-gold">
              <Sparkles className="h-3.5 w-3.5 text-gold shrink-0" /> GATEWAY TO GLOBAL CAREERS · ONE COMPANY, GLOBAL SOLUTIONS
            </div>
            <h1 className="mt-6 font-serif text-3xl sm:text-5xl md:text-6xl font-medium leading-[1.08] tracking-tight">
              Your global career,
              <br />
              <span className="text-[#ECC248] drop-shadow-[0_2px_12px_rgba(201,162,39,0.3)]">engineered with precision.</span>
            </h1>
            <p className="mt-5 text-sm sm:text-base md:text-lg leading-relaxed text-white/80">
              Explore expert career counseling, immigration consultancy, and Cambridge courses
              training with Kishaa International — from 10-year Canada visit visas with business LOI
              letters to UK, Italy, Finland and Georgia admissions, and English mastery under British
              Council Certified Trainer Zeb Khan.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/contact" className="btn-gold uppercase tracking-wider text-xs sm:text-sm font-semibold">
                Request a Visa & Admissions Consultation →
              </Link>
              <Link to="/cambridge-courses" className="btn-frame-light uppercase tracking-wider text-xs sm:text-sm font-semibold">
                Explore Cambridge & IELTS Courses
              </Link>
            </div>

            {/* Trust badges */}
            <div className="mt-8 flex flex-wrap items-center gap-3 text-[12px] sm:text-[13px] text-white/90">
              <span className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-navy/70 backdrop-blur-sm px-3.5 py-2">
                <BadgeCheck className="h-4 w-4 text-gold shrink-0" /> British Council Certified Trainer
              </span>
              <span className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-navy/70 backdrop-blur-sm px-3.5 py-2">
                <ShieldCheck className="h-4 w-4 text-gold shrink-0" /> PRO & GDRFA Approved Channels
              </span>
              <span className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-navy/70 backdrop-blur-sm px-3.5 py-2">
                <FileCheck2 className="h-4 w-4 text-gold shrink-0" /> Statutory Sources Dated & Versioned
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 01b — Stats Bar & Service Pillars */}
      <section className="relative bg-gradient-to-b from-[#00142e] via-[#021327] to-[#041021] text-white border-y border-white/10 overflow-hidden z-10 py-12 sm:py-16">
        {/* Subtle ambient gradient mesh in background */}
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-gradient-to-br from-[#ECC248]/15 via-gold/5 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-gradient-to-tl from-[#1e4a7a]/20 via-transparent to-transparent blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 w-full">
          {/* Top Live Verification Strip */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 text-[12px] text-white/70">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-white/5 backdrop-blur-md px-3.5 py-1 text-gold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ECC248] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ECC248]"></span>
              </span>
              <span className="font-semibold uppercase tracking-[0.16em] text-[11px]">Real-Time Statutory Registry · 2026/2027 Active</span>
            </div>
            <span className="text-[11.5px] text-white/60 hidden sm:inline-block">
              Verified against official embassy gazettes (IRCC, UKVI, BAföG, GDRFA)
            </span>
          </div>

          {/* 4 Separate luxury Cards: 2 in one row on mobile (grid-cols-2), 4 on desktop (lg:grid-cols-4) */}
          <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
            {/* Card 1: Countries */}
            <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br from-[#0c284d]/90 via-[#071d38]/85 to-[#030e1d]/95 p-3.5 sm:p-6 backdrop-blur-md transition-all duration-300 ease-out hover:-translate-y-2 hover:border-[#ECC248] hover:shadow-[0_16px_40px_rgba(201,162,39,0.25)]">
              <div className="absolute inset-0 bg-gradient-to-br from-[#ECC248]/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#ECC248]/40 to-transparent group-hover:via-[#ECC248] transition-all duration-500" />
              <div>
                <div className="flex items-center justify-between gap-1">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[9.5px] sm:text-[10.5px] font-semibold uppercase tracking-wider text-emerald-400">
                    <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-emerald-400"></span>
                    </span>
                    <span className="truncate">Live Data</span>
                  </span>
                  <Globe2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white/30 group-hover:text-gold transition-colors duration-300 shrink-0" />
                </div>
                <div className="mt-3 sm:mt-4 font-serif text-2xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-[#ECC248] via-[#FFF3C4] to-[#C9A227] bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300 origin-left inline-block">
                  <AnimatedCounter end={countryList.length || 18} duration={1200} />
                </div>
                <p className="mt-1.5 sm:mt-2 text-[12px] sm:text-[14px] font-medium leading-tight sm:leading-normal text-white/85 group-hover:text-white transition-colors">
                  Countries with sourced cost data
                </p>
              </div>
              <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-white/10 flex items-center justify-between text-[10px] sm:text-[11px]">
                <span className="text-gold/80 font-mono truncate">
                  Live calculators
                </span>
                <span className="uppercase tracking-wider text-emerald-400/80 font-semibold shrink-0 ml-1">Active</span>
              </div>
            </div>

            {/* Card 2: Processing Days */}
            <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br from-[#0c284d]/90 via-[#071d38]/85 to-[#030e1d]/95 p-3.5 sm:p-6 backdrop-blur-md transition-all duration-300 ease-out hover:-translate-y-2 hover:border-[#ECC248] hover:shadow-[0_16px_40px_rgba(201,162,39,0.25)]">
              <div className="absolute inset-0 bg-gradient-to-br from-[#ECC248]/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#ECC248]/40 to-transparent group-hover:via-[#ECC248] transition-all duration-500" />
              <div>
                <div className="flex items-center justify-between gap-1">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[9.5px] sm:text-[10.5px] font-semibold uppercase tracking-wider text-[#ECC248]">
                    <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ECC248] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-[#ECC248]"></span>
                    </span>
                    <span className="truncate">IRCC Sync</span>
                  </span>
                  <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white/30 group-hover:text-gold transition-colors duration-300 shrink-0" />
                </div>
                <div className="mt-3 sm:mt-4 font-serif text-2xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-[#ECC248] via-[#FFF3C4] to-[#C9A227] bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300 origin-left inline-block">
                  <AnimatedCounter range={[60, 70]} duration={1400} />
                </div>
                <p className="mt-1.5 sm:mt-2 text-[12px] sm:text-[14px] font-medium leading-tight sm:leading-normal text-white/85 group-hover:text-white transition-colors">
                  Days typical Canada visit processing
                </p>
              </div>
              <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-white/10 flex items-center justify-between text-[10px] sm:text-[11px]">
                <span className="text-gold/80 font-mono truncate">
                  IRCC portal
                </span>
                <span className="uppercase tracking-wider text-amber-300/80 font-semibold shrink-0 ml-1">Fast-track</span>
              </div>
            </div>

            {/* Card 3: Dual Offices */}
            <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br from-[#0c284d]/90 via-[#071d38]/85 to-[#030e1d]/95 p-3.5 sm:p-6 backdrop-blur-md transition-all duration-300 ease-out hover:-translate-y-2 hover:border-[#ECC248] hover:shadow-[0_16px_40px_rgba(201,162,39,0.25)]">
              <div className="absolute inset-0 bg-gradient-to-br from-[#ECC248]/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#ECC248]/40 to-transparent group-hover:via-[#ECC248] transition-all duration-500" />
              <div>
                <div className="flex items-center justify-between gap-1">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 text-[9.5px] sm:text-[10.5px] font-semibold uppercase tracking-wider text-cyan-400">
                    <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-cyan-400"></span>
                    </span>
                    <span className="truncate">Dual Hub HQ</span>
                  </span>
                  <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white/30 group-hover:text-gold transition-colors duration-300 shrink-0" />
                </div>
                <div className="mt-3 sm:mt-4 font-serif text-2xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-[#ECC248] via-[#FFF3C4] to-[#C9A227] bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300 origin-left inline-block">
                  <AnimatedCounter end={2} duration={1000} />
                </div>
                <p className="mt-1.5 sm:mt-2 text-[12px] sm:text-[14px] font-medium leading-tight sm:leading-normal text-white/85 group-hover:text-white transition-colors">
                  Offices — Dubai HQ &amp; Pakistan
                </p>
              </div>
              <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-white/10 flex items-center justify-between text-[10px] sm:text-[11px]">
                <span className="text-gold/80 font-mono truncate">
                  PRO registered
                </span>
                <span className="uppercase tracking-wider text-cyan-300/80 font-semibold shrink-0 ml-1">Registered</span>
              </div>
            </div>

            {/* Card 4: Reviews Rating */}
            <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br from-[#0c284d]/90 via-[#071d38]/85 to-[#030e1d]/95 p-3.5 sm:p-6 backdrop-blur-md transition-all duration-300 ease-out hover:-translate-y-2 hover:border-[#ECC248] hover:shadow-[0_16px_40px_rgba(201,162,39,0.25)]">
              <div className="absolute inset-0 bg-gradient-to-br from-[#ECC248]/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#ECC248]/40 to-transparent group-hover:via-[#ECC248] transition-all duration-500" />
              <div>
                <div className="flex items-center justify-between gap-1">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/15 border border-gold/30 px-2 py-0.5 text-[9.5px] sm:text-[10.5px] font-semibold uppercase tracking-wider text-gold">
                    <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ECC248] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-[#ECC248]"></span>
                    </span>
                    <span className="truncate">200+ Verified</span>
                  </span>
                  <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gold fill-gold/30 group-hover:fill-gold transition-colors duration-300 shrink-0" />
                </div>
                <div className="mt-3 sm:mt-4 font-serif text-2xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-[#ECC248] via-[#FFF3C4] to-[#C9A227] bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300 origin-left inline-block">
                  <AnimatedCounter end={4.9} decimals={1} suffix=" ★" duration={1400} />
                </div>
                <p className="mt-1.5 sm:mt-2 text-[12px] sm:text-[14px] font-medium leading-tight sm:leading-normal text-white/85 group-hover:text-white transition-colors">
                  Average rating across 200+ reviews
                </p>
              </div>
              <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-white/10 flex items-center justify-between text-[10px] sm:text-[11px]">
                <span className="text-gold/80 font-mono truncate">
                  Trustpilot
                </span>
                <span className="uppercase tracking-wider text-gold font-semibold shrink-0 ml-1">100% Legit</span>
              </div>
            </div>
          </div>

          {/* Triad cards: 2 in row 1 on mobile, 3rd in the mid (centered), 3 in one row on desktop */}
          <div className="mt-8 sm:mt-10 grid grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6">
            {TRIAD.map((t, idx) => (
              <Link
                key={t.title}
                to={t.to}
                className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-gold/30 bg-gradient-to-br from-[#0c284d] via-[#071d38] to-[#030e1d] p-4 sm:p-7 sm:p-8 transition-all duration-300 ease-out hover:-translate-y-2 hover:border-[#ECC248] hover:shadow-[0_20px_50px_rgba(201,162,39,0.25)] ${
                  idx === 2
                    ? "col-span-2 lg:col-span-1 max-w-sm sm:max-w-md lg:max-w-none mx-auto w-full"
                    : "col-span-1"
                }`}
              >
                {/* Decorative radial card glow */}
                <div className="absolute top-0 right-0 h-40 w-40 bg-gradient-to-bl from-gold/15 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#ECC248]/40 to-transparent group-hover:via-[#ECC248] transition-all duration-500" />

                <div>
                  <div className="flex items-center justify-between gap-1">
                    <div className="inline-flex h-9 w-9 sm:h-13 sm:w-13 items-center justify-center rounded-xl bg-gradient-to-br from-gold/25 via-gold/10 to-transparent border border-gold/40 text-[#ECC248] shadow-[0_4px_20px_rgba(201,162,39,0.2)] group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shrink-0">
                      <t.icon className="h-4 w-4 sm:h-6 sm:w-6" strokeWidth={1.75} />
                    </div>
                    {t.badge && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-2 py-0.5 sm:px-3 sm:py-1 text-[9px] sm:text-[10.5px] font-bold uppercase tracking-wider text-gold border border-gold/30">
                        <span className="relative flex h-1.5 w-1.5 shrink-0">
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${t.pulseColor || 'bg-gold'} opacity-75`}></span>
                          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${t.pulseColor || 'bg-gold'}`}></span>
                        </span>
                        <span className="truncate">{t.badge}</span>
                      </span>
                    )}
                  </div>

                  <h2 className="mt-3.5 sm:mt-6 font-serif text-base sm:text-2xl font-medium text-white group-hover:text-[#ECC248] transition-colors leading-snug">
                    {t.title}
                  </h2>

                  <p className="mt-2 sm:mt-3 text-[12px] sm:text-[14px] leading-relaxed text-white/70 line-clamp-3 sm:line-clamp-none">
                    {t.text}
                  </p>

                  {/* Highlights list */}
                  {t.highlights && (
                    <div className="mt-3 sm:mt-4 flex flex-wrap gap-1 sm:gap-1.5">
                      {t.highlights.map((h: string) => (
                        <span key={h} className="rounded-md bg-white/5 px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-[11px] font-medium text-white/80 border border-white/10 group-hover:border-gold/30 group-hover:text-gold transition-colors">
                          {h}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-5 sm:mt-8 pt-3 sm:pt-5 border-t border-white/10 flex items-center justify-between text-[11px] sm:text-[12px]">
                  <span className="inline-flex items-center gap-1.5 font-semibold uppercase tracking-[0.14em] text-[#ECC248]">
                    Explore <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform group-hover:translate-x-1.5 text-gold shrink-0" />
                  </span>
                  <span className="text-[9.5px] sm:text-[10.5px] font-semibold uppercase tracking-wider text-white/40 flex items-center gap-1 shrink-0">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                    <span className="hidden sm:inline">Official advisory</span>
                    <span className="sm:hidden">Advisory</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 02 — Answer-First Section (AEO / GEO Authority Card) */}
      <section className="border-b border-navy/10 bg-gradient-to-b from-white to-[#FDFBF7] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl border-2 border-[#C9A227]/40 bg-gradient-to-br from-[#FFFDF9] via-[#FAF5EA] to-[#F1E6CE] p-8 md:p-12 shadow-[0_16px_50px_rgba(201,162,39,0.14)] transition-all duration-300 hover:shadow-[0_24px_60px_rgba(201,162,39,0.22)]">
            {/* Ambient decorative gradient meshes */}
            <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-gradient-to-br from-[#ECC248]/25 via-gold/10 to-transparent blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-gradient-to-tr from-navy/10 via-transparent to-transparent blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-gold/20 backdrop-blur-sm px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-gold-dark border border-gold/40">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-dark opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-gold-dark"></span>
                </span>
                DIRECT ANSWER · 2026/2027 EXECUTIVE REGULATORY ADVISORY
              </div>

              <h2 className="mt-4 font-serif text-2xl font-medium text-navy sm:text-3xl md:text-4xl leading-tight">
                What does Kishaa International <span className="bg-gradient-to-r from-navy via-navy to-gold-dark bg-clip-text">actually do?</span>
              </h2>

              <p className="mt-4 text-[16px] leading-relaxed text-navy/85 md:text-[17.5px]">
                Kishaa International is a Dubai-headquartered consultancy with a Pakistan office that
                delivers three integrated services:
              </p>

              {/* Dynamic 3-Pillar Highlight Chips */}
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <Link
                  to="/career-counseling"
                  className="group rounded-xl border border-gold/30 bg-white/80 backdrop-blur-xs p-4 shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:border-gold hover:shadow-md hover:bg-white"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-gold-dark font-serif text-lg font-semibold flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-gold-dark group-hover:scale-110 transition-transform" />
                      01 · Admissions
                    </div>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  </div>
                  <div className="text-[13px] font-medium text-navy/80 mt-2 group-hover:text-navy transition-colors">
                    Career counseling &amp; university admissions across UK, Italy, Finland &amp; Georgia
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-gold-dark uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                    Explore Admissions <ArrowRight className="h-3 w-3" />
                  </div>
                </Link>

                <Link
                  to="/immigration-consultancy"
                  className="group rounded-xl border border-gold/30 bg-white/80 backdrop-blur-xs p-4 shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:border-gold hover:shadow-md hover:bg-white"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-gold-dark font-serif text-lg font-semibold flex items-center gap-2">
                      <Globe2 className="h-5 w-5 text-gold-dark group-hover:scale-110 transition-transform" />
                      02 · Immigration
                    </div>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C9A227] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C9A227]"></span>
                    </span>
                  </div>
                  <div className="text-[13px] font-medium text-navy/80 mt-2 group-hover:text-navy transition-colors">
                    Canada 10-Yr LOI visit visas, UAE Golden/Green visas &amp; Schengen routes
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-gold-dark uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                    Explore Visas <ArrowRight className="h-3 w-3" />
                  </div>
                </Link>

                <Link
                  to="/cambridge-courses"
                  className="group rounded-xl border border-gold/30 bg-white/80 backdrop-blur-xs p-4 shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:border-gold hover:shadow-md hover:bg-white"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-gold-dark font-serif text-lg font-semibold flex items-center gap-2">
                      <BookOpenCheck className="h-5 w-5 text-gold-dark group-hover:scale-110 transition-transform" />
                      03 · Cambridge
                    </div>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                    </span>
                  </div>
                  <div className="text-[13px] font-medium text-navy/80 mt-2 group-hover:text-navy transition-colors">
                    IELTS Academic/General band 7.5 prep &amp; Cambridge training with Zeb Khan
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-gold-dark uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                    Explore Courses <ArrowRight className="h-3 w-3" />
                  </div>
                </Link>
              </div>

              <p className="mt-5 text-[15px] leading-relaxed text-navy/80">
                You can compare destinations, calculate flight, city living and statutory proof-of-funds costs on
                this site for free, then book a consultation with a named advisor — with transparent fees,
                no guaranteed-outcome promises, and no payment until scope is confirmed in writing.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  to="/about"
                  className="group inline-flex items-center gap-2 rounded-xl border border-navy/15 bg-white/90 backdrop-blur-sm px-5 py-2.5 text-[12.5px] font-bold uppercase tracking-wider text-navy shadow-xs transition-all duration-200 hover:border-gold hover:text-gold-dark hover:bg-white hover:shadow-md hover:-translate-y-0.5"
                >
                  About our firm <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1.5 text-gold-dark" />
                </Link>
                <Link
                  to="/cost-planner"
                  className="group inline-flex items-center gap-2 rounded-xl border border-navy/15 bg-white/90 backdrop-blur-sm px-5 py-2.5 text-[12.5px] font-bold uppercase tracking-wider text-navy shadow-xs transition-all duration-200 hover:border-gold hover:text-gold-dark hover:bg-white hover:shadow-md hover:-translate-y-0.5"
                >
                  Free Cost Intelligence <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1.5 text-gold-dark" />
                </Link>
                <Link
                  to="/team/zeb-khan"
                  className="group inline-flex items-center gap-2 rounded-xl border border-navy/15 bg-white/90 backdrop-blur-sm px-5 py-2.5 text-[12.5px] font-bold uppercase tracking-wider text-navy shadow-xs transition-all duration-200 hover:border-gold hover:text-gold-dark hover:bg-white hover:shadow-md hover:-translate-y-0.5"
                >
                  Senior Consultant Profile <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1.5 text-gold-dark" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 03 — Cost planner teaser */}
      <section className="border-b border-navy/10 bg-paper py-16 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center">
          <div className="reveal">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-gold-dark">
              <Sparkles className="h-3 w-3 text-gold-dark" /> Live ticket &amp; cost calculator
            </div>
            <h2 className="mt-4 font-serif text-3xl sm:text-4xl font-medium text-navy md:text-5xl">
              Know your budget before you commit.
            </h2>
            <p className="mt-5 text-[16px] leading-relaxed text-navy/70">
              Airfare, monthly living costs and the official embassy bank statement — calculated
              separately, sourced transparently, and tailored to your destination and visa purpose.
            </p>
            {/* Mobile Zigzag Timeline */}
            <div className="relative mt-8 sm:hidden">
              {/* Connecting Zigzag SVG Line */}
              <svg className="absolute inset-0 h-full w-full pointer-events-none z-0" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="budgetZigzagGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C9A227" stopOpacity="0.85" />
                    <stop offset="50%" stopColor="#ECC248" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#C9A227" stopOpacity="0.85" />
                  </linearGradient>
                </defs>
                <path
                  d="M 16,18 L 84,50 L 16,82"
                  fill="none"
                  stroke="url(#budgetZigzagGrad)"
                  strokeWidth="2"
                  strokeDasharray="4,3"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>

              <div className="space-y-4 relative z-10">
                {[
                  { icon: Plane, label: "Flight tickets", desc: "Live IATA route estimates", num: "01" },
                  { icon: Wallet, label: "Living costs", desc: "City rent & utility indexes", num: "02" },
                  { icon: Landmark, label: "Bank statements", desc: "Statutory embassy rules", num: "03" },
                ].map((x, idx) => {
                  const isRight = idx % 2 === 0; // 0: right, 1: left, 2: right
                  return (
                    <div
                      key={x.label}
                      className={`relative w-[84%] ${isRight ? "ml-auto" : "mr-auto"}`}
                    >
                      {/* Timeline Node */}
                      <div
                        className={`absolute top-1/2 -translate-y-1/2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-navy text-gold text-[10.5px] font-bold border-2 border-gold shadow-[0_0_12px_rgba(201,162,39,0.4)] ${
                          isRight ? "-left-3.5 -translate-x-1/2" : "-right-3.5 translate-x-1/2"
                        }`}
                      >
                        {x.num}
                      </div>

                      <div className="group relative overflow-hidden rounded-xl border border-navy/10 bg-white/95 p-4 text-left shadow-xs backdrop-blur-xs transition-all duration-300 hover:border-gold hover:shadow-md">
                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gold/40 to-transparent group-hover:via-gold transition-all" />
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold/10 border border-gold/30 text-gold-dark group-hover:scale-105 group-hover:bg-gold/20 transition-all duration-300">
                            <x.icon className="h-5 w-5" strokeWidth={1.75} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[12.5px] font-semibold uppercase tracking-[0.08em] text-navy group-hover:text-gold-dark transition-colors">
                              {x.label}
                            </p>
                            <p className="mt-0.5 text-[11px] text-navy/65 line-clamp-1">
                              {x.desc}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Desktop 3-column Grid */}
            <div className="mt-8 hidden sm:grid sm:grid-cols-3 sm:gap-4">
              {[
                { icon: Plane, label: "Flight tickets", desc: "Live IATA route estimates" },
                { icon: Wallet, label: "Living costs", desc: "City rent & utility indexes" },
                { icon: Landmark, label: "Bank statements", desc: "Statutory embassy rules" },
              ].map((x) => (
                <div
                  key={x.label}
                  className="group relative overflow-hidden rounded-xl border border-navy/10 bg-white p-5 text-center transition-all duration-300 hover:-translate-y-1.5 hover:border-gold hover:shadow-lg"
                >
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10 border border-gold/30 text-gold-dark group-hover:scale-110 group-hover:bg-gold/20 transition-all duration-300">
                    <x.icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <p className="mt-3 text-[13px] font-semibold uppercase tracking-[0.1em] text-navy group-hover:text-gold-dark transition-colors">
                    {x.label}
                  </p>
                  <p className="mt-1 text-[11px] text-navy/60">
                    {x.desc}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/cost-planner" className="btn-fill group">
                <Calculator className="h-4 w-4 text-gold group-hover:scale-110 transition-transform" /> Open the Cost Planner
              </Link>
              <Link to="/bank-statements" className="btn-frame">
                Bank Statement Guide
              </Link>
            </div>
          </div>

          <div className="reveal border border-navy/10 bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <label htmlFor="teaser-country" className="eyebrow flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Quick preview — choose destination
              </label>
              <span className="text-[11px] font-mono uppercase text-gold-dark font-semibold">2026/27 Live</span>
            </div>
            <select
              id="teaser-country"
              value={teaserCountry}
              onChange={(e) => setTeaserCountry(e.target.value)}
              className="w-full border border-navy/20 px-4 py-3 text-[15px] text-navy outline-none focus:border-gold bg-white rounded-xl transition-colors cursor-pointer"
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
                <p className="text-[12px] leading-relaxed text-navy/70">
                  {selectedFunds?.note ?? "Select a destination to preview verified figures."}
                </p>
                <Link
                  to={`/cost-planner?country=${selected.slug}`}
                  className="btn-frame w-full text-center block rounded-xl hover:border-gold"
                >
                  Calculate my full estimate →
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 04 — How a Kishaa Consultation Works (Process) */}
      <section className="border-b border-navy/10 bg-gradient-to-b from-white via-[#FCFBF8] to-[#F7F4EC] py-20 relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 relative">
          <div className="reveal text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-gold-dark">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-dark opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-gold-dark"></span>
              </span>
              Standard Operating Procedure
            </div>
            <h2 className="mt-3 font-serif text-3xl sm:text-4xl font-medium text-navy md:text-5xl">
              Transparent consultation, from intake to outcome.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[16px] leading-relaxed text-navy/70">
              Every applicant receives a structured four-stage process designed to eliminate guesswork,
              unrealistic promises, and avoidable refusals.
            </p>
          </div>

          <div className="mt-10 sm:mt-14 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 relative">
            {/* Desktop connector line */}
            <div className="hidden lg:block absolute top-1/2 left-8 right-8 h-0.5 bg-gradient-to-r from-gold/30 via-gold/60 to-gold/30 -translate-y-8 z-0 pointer-events-none" />

            {PROCESS_STEPS.map((p, idx) => (
              <div
                key={p.step}
                className="reveal group relative z-10 flex flex-col justify-between rounded-xl sm:rounded-2xl border border-navy/10 bg-white/95 p-3.5 sm:p-7 shadow-xs backdrop-blur-xs transition-all duration-300 ease-out hover:-translate-y-2 hover:border-[#C9A227] hover:shadow-[0_16px_40px_rgba(201,162,39,0.18)]"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#C9A227]/30 to-transparent group-hover:via-[#C9A227] transition-all duration-300" />
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-serif text-2xl sm:text-4xl font-bold bg-gradient-to-br from-gold-dark via-gold to-[#ECC248] bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300 origin-left inline-block">
                      {p.step}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 border border-gold/30 px-1.5 sm:px-2.5 py-0.5 text-[9px] sm:text-[10.5px] font-semibold uppercase tracking-wider text-gold-dark truncate">
                      <span className="h-1.5 w-1.5 rounded-full bg-gold-dark shrink-0"></span>
                      {p.badge}
                    </span>
                  </div>
                  <h3 className="mt-2.5 sm:mt-4 font-serif text-base sm:text-xl font-medium text-navy group-hover:text-gold-dark transition-colors">{p.title}</h3>
                  <p className="mt-1.5 sm:mt-3 text-[12px] sm:text-[14px] leading-snug sm:leading-relaxed text-navy/70 line-clamp-3 sm:line-clamp-none">{p.detail}</p>
                </div>
                <div className="mt-3 sm:mt-6 pt-2.5 sm:pt-4 border-t border-navy/5 flex items-center justify-between text-[10px] sm:text-[11px] font-mono text-navy/50">
                  <span>STAGE 0{idx + 1}</span>
                  <span className="group-hover:text-gold-dark transition-colors font-sans font-semibold">Step →</span>
                </div>
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
      <section className="relative overflow-hidden bg-gradient-to-b from-[#00142e] via-[#021327] to-[#041021] text-white py-24 border-y border-white/10">
        <div className="absolute -top-32 -left-32 h-80 w-80 rounded-full bg-gold/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-[#1e4a7a]/20 blur-3xl pointer-events-none" />

        <div className="relative mx-auto grid max-w-7xl gap-14 px-4 sm:px-6 lg:grid-cols-12 lg:items-center">
          <div className="reveal lg:col-span-5">
            <div className="group relative overflow-hidden rounded-3xl border border-gold/40 bg-gradient-to-br from-[#0c284d]/90 via-[#071d38]/90 to-[#030e1d]/95 p-7 sm:p-9 text-center shadow-2xl backdrop-blur-md transition-all duration-300 hover:border-[#ECC248] hover:shadow-[0_20px_60px_rgba(201,162,39,0.25)] hover:-translate-y-1.5">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#ECC248]/50 to-transparent group-hover:via-[#ECC248] transition-all duration-500" />
              
              <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/15 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-gold mb-5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ECC248] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ECC248]"></span>
                </span>
                Active 2026/2027 Admissions &amp; LOI Advisory
              </div>

              <div className="relative mx-auto mb-6 h-64 w-52 sm:h-72 sm:w-60 overflow-hidden rounded-2xl border-2 border-gold/40 shadow-[0_4px_30px_rgba(201,162,39,0.3)]">
                <img
                  src="/img/zeb-khan.png"
                  alt="Zeb Khan - Senior Consultant & Executive Trainer"
                  className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <h3 className="font-serif text-3xl font-medium text-white group-hover:text-[#ECC248] transition-colors">Zeb Khan</h3>
              <p className="mt-2 text-[13px] uppercase tracking-[0.18em] text-[#ECC248] font-semibold">
                Senior Consultant & Executive Trainer
              </p>
              <div className="mx-auto mt-6 flex flex-wrap justify-center gap-2">
                {["MA English", "MEd", "PGD TEFL", "Dip EPM", "British Council Certified"].map(
                  (c) => (
                    <span
                      key={c}
                      className="rounded-md border border-gold/40 bg-gold/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-gold transition-colors hover:bg-gold/25"
                    >
                      {c}
                    </span>
                  ),
                )}
              </div>
            </div>
          </div>
          <div className="reveal lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-gold mb-4">
              <Sparkles className="h-3 w-3 text-gold" /> Meet your trainer &amp; consultant
            </div>
            <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-medium md:text-5xl leading-tight">
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
                  <li key={e} className="flex items-start gap-2 text-[14px] text-white/80">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" /> {e}
                  </li>
                ),
              )}
            </ul>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/team/zeb-khan" className="btn-gold uppercase tracking-wider text-xs sm:text-sm font-semibold">
                Meet Zeb Khan
              </Link>
              <a
                href={waLink("Hello — I'd like to enquire about counseling & training with Zeb Khan.")}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-frame-light uppercase tracking-wider text-xs sm:text-sm font-semibold"
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
              <h2 className="mt-3 font-serif text-3xl sm:text-4xl font-medium text-navy md:text-5xl">
                Global destinations with verified costs.
              </h2>
              <p className="mt-3 max-w-xl text-[15px] text-navy/65">
                Accurate statutory embassy maintenance funds and city living expenses for 18+ study and migration destinations.
              </p>
            </div>
            <Link to="/destinations" className="btn-frame group">
              All 18 destinations <ArrowRight className="h-4 w-4 group-hover:translate-x-1.5 transition-transform" />
            </Link>
          </div>

          {(() => {
            const renderCountryCard = (c: any, isCompact = false) => {
              let living = null;
              try {
                if (c.livingCosts) living = typeof c.livingCosts === "string" ? JSON.parse(c.livingCosts) : c.livingCosts;
              } catch {}
              return (
                <Link
                  key={c.slug}
                  to={`/destinations/${c.slug}`}
                  className={`group relative flex flex-col justify-between rounded-xl sm:rounded-2xl border border-navy/10 bg-white transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-[#C9A227] hover:shadow-[0_16px_36px_rgba(201,162,39,0.18)] ${
                    isCompact ? "p-3.5 sm:p-5" : "reveal p-6"
                  }`}
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#C9A227]/30 to-transparent group-hover:via-[#C9A227] transition-all duration-300" />
                  <div>
                    <div className="flex items-center justify-between gap-1.5">
                      <span className={`${isCompact ? "text-2xl" : "text-3xl"} group-hover:scale-110 transition-transform duration-300 origin-left inline-block shrink-0`}>
                        {c.flag}
                      </span>
                      <span className="text-[9.5px] sm:text-[11px] font-semibold uppercase tracking-wider text-navy/60 bg-paper px-2 py-0.5 rounded-full border border-navy/10 truncate">
                        {c.region || "Destination"}
                      </span>
                    </div>
                    <h3 className={`mt-2.5 sm:mt-4 font-serif ${isCompact ? "text-base sm:text-lg" : "text-xl"} font-medium text-navy group-hover:text-gold-dark transition-colors`}>
                      {c.name}
                    </h3>
                    <p className={`mt-1 sm:mt-2 ${isCompact ? "text-[11.5px]" : "text-[13px]"} text-navy/60 line-clamp-2`}>
                      {c.summary || "Complete visa guidelines, living costs and university admission routes."}
                    </p>
                  </div>
                  <div className={`mt-3.5 sm:mt-6 border-t border-navy/10 pt-3 sm:pt-4 flex items-center justify-between gap-1 ${isCompact ? "text-[11px] sm:text-[12px]" : "text-[13px]"}`}>
                    <span className="font-semibold text-navy bg-gold/10 px-2 py-0.5 rounded text-[10.5px] sm:text-[12px] text-gold-dark border border-gold/20 truncate max-w-[110px]">
                      {living?.standard ? `${living.currency || ""} ${Number(living.standard).toLocaleString()}/mo` : "Cost data inside"}
                    </span>
                    <span className="text-gold-dark font-medium inline-flex items-center gap-0.5 group-hover:translate-x-1.5 transition-transform text-[11px] sm:text-[12.5px] shrink-0">
                      Guide <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    </span>
                  </div>
                </Link>
              );
            };

            const topEight = countryList.slice(0, 8);

            return (
              <>
                {/* Mobile Hybrid Layout: Top 2 in Grid -> Timeline starts left -> Middle 4 in Zigzag -> Bottom 2 in Grid */}
                <div className="mt-8 space-y-4 sm:hidden">
                  {/* 1. First two countries in 2-column grid */}
                  <div className="grid grid-cols-2 gap-3 relative z-10">
                    {topEight.slice(0, 2).map((c) => renderCountryCard(c, true))}
                  </div>

                  {/* 2. Timeline connector & Middle 4 Countries in Zigzag */}
                  <div className="relative py-2">
                    {/* Connecting Zigzag SVG Line starting from left side (under UK) */}
                    <svg className="absolute inset-0 h-full w-full pointer-events-none z-0" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="flagZigzagGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#C9A227" stopOpacity="0.85" />
                          <stop offset="50%" stopColor="#ECC248" stopOpacity="0.95" />
                          <stop offset="100%" stopColor="#C9A227" stopOpacity="0.85" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M 25,0 L 16,13 L 84,38 L 16,63 L 84,88 L 25,100"
                        fill="none"
                        stroke="url(#flagZigzagGrad)"
                        strokeWidth="2"
                        strokeDasharray="4,3"
                        vectorEffect="non-scaling-stroke"
                      />
                    </svg>

                    <div className="space-y-4 relative z-10">
                      {topEight.slice(2, 6).map((c, idx) => {
                        // idx 0 (3rd flag - Finland): right side
                        // idx 1 (4th flag - Georgia): left side
                        // idx 2 (5th flag - Germany): right side
                        // idx 3 (6th flag - Canada): left side
                        const isRight = idx % 2 === 0;
                        return (
                          <div
                            key={c.slug}
                            className={`relative w-[85%] ${isRight ? "ml-auto" : "mr-auto"}`}
                          >
                            {/* Timeline Node */}
                            <div
                              className={`absolute top-1/2 -translate-y-1/2 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-navy text-gold text-[10px] font-bold border-2 border-gold shadow-[0_0_10px_rgba(201,162,39,0.35)] ${
                                isRight ? "-left-3 -translate-x-1/2" : "-right-3 translate-x-1/2"
                              }`}
                            >
                              <div className="h-2 w-2 rounded-full bg-gold animate-pulse" />
                            </div>

                            {renderCountryCard(c, true)}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Last two countries in 2-column grid */}
                  <div className="grid grid-cols-2 gap-3 relative z-10">
                    {topEight.slice(6, 8).map((c) => renderCountryCard(c, true))}
                  </div>
                </div>

                {/* Desktop 4-column Grid */}
                <div className="mt-12 hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {topEight.map((c) => renderCountryCard(c, false))}
                </div>
              </>
            );
          })()}
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
            <span className="text-[12px] font-semibold uppercase tracking-wider text-navy/70 hidden sm:inline-block">
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
                    <ExternalLink className="h-3.5 w-3.5 text-navy/70 group-hover:text-gold-dark" />
                  </div>
                  <p className="mt-1 text-[13px] text-navy/75">{s.rule}</p>
                </div>
                <div className="mt-3 border-t border-navy/5 pt-2 text-[11px] font-medium text-navy/70">
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

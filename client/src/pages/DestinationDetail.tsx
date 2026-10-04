import { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import {
  ArrowLeft,
  ArrowRight,
  Plane,
  Wallet,
  Landmark,
  ExternalLink,
  Briefcase,
  Clock,
  GraduationCap,
  ShieldCheck,
  Users,
  Calendar,
  Building,
  Sparkles,
  FileText,
  CheckCircle2,
  Phone,
  MessageCircle,
} from "lucide-react";
import { trpc } from "@/providers/trpc";
import { Seo, breadcrumbJsonLd } from "@/lib/seo";
import { useReveal } from "@/lib/reveal";
import { waLink, SITE } from "@/lib/site";
import NotFound from "./NotFound";

export default function DestinationDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [fallbackData, setFallbackData] = useState<any>(null);
  const [isFetchingFallback, setIsFetchingFallback] = useState(false);

  const { data: trpcData, isLoading, isError } = trpc.content.countries.bySlug.useQuery(
    { slug: slug ?? "" },
    { retry: 1 }
  );

  useEffect(() => {
    if ((isError || (!isLoading && !trpcData)) && slug && !fallbackData) {
      setIsFetchingFallback(true);
      fetch(`/api/content/countries/${encodeURIComponent(slug)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.ok && data?.country) {
            setFallbackData(data.country);
          }
        })
        .catch(() => {})
        .finally(() => setIsFetchingFallback(false));
    }
  }, [isError, isLoading, trpcData, slug, fallbackData]);

  const active = trpcData || fallbackData;
  useReveal(active);

  const [liveCosts, setLiveCosts] = useState<any>(null);

  useEffect(() => {
    if (active?.name) {
      fetch('/api/content/countries/live-costs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country: active.name }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d?.ok && d?.data) setLiveCosts(d.data);
        })
        .catch(() => {});
    }
  }, [active?.name]);

  if (isLoading || isFetchingFallback) {
    return <div className="mx-auto max-w-7xl px-4 py-24 text-navy/50">Loading destination…</div>;
  }
  if (!active) return <NotFound />;

  const c = active;

  let living: any = null;
  let funds: any = null;
  try {
    living = c.livingCosts ? (typeof c.livingCosts === "string" ? JSON.parse(c.livingCosts) : c.livingCosts) : null;
  } catch {
    living = null;
  }
  try {
    funds = c.fundsRule ? (typeof c.fundsRule === "string" ? JSON.parse(c.fundsRule) : c.fundsRule) : null;
  } catch {
    funds = null;
  }
  let rawFlights: any[] = [];
  try {
    rawFlights = c.flightGuide ? (typeof c.flightGuide === "string" ? JSON.parse(c.flightGuide) : c.flightGuide) : [];
  } catch {
    rawFlights = [];
  }
  const flights = rawFlights.filter(
    (f: any, idx: number, arr: any[]) =>
      f.priceMax > 0 && arr.findIndex((item: any) => item.from === f.from) === idx
  );

  return (
    <>
      <Seo
        title={c.seoTitle ?? `${c.name} — Study, Visa, Living Costs & Bank Statement Guide`}
        description={c.seoDescription ?? (c.summary ?? `${c.name} destination guide`)}
        path={`/destinations/${c.slug}`}
        jsonLd={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Destinations", path: "/destinations" },
            { name: c.name, path: `/destinations/${c.slug}` },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: `${c.name} — Study, Visa & Cost Guide`,
            about: { "@type": "Country", name: c.name },
            author: { "@id": "https://www.kishaainternational.com/#organization" },
          },
        ]}
      />

      <section className="bg-navy text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-20">
          <Link
            to="/destinations"
            className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-white/60 hover:text-gold"
          >
            <ArrowLeft className="h-4 w-4" /> All destinations
          </Link>
          <div className="mt-6 flex items-center gap-4">
            <span className="text-5xl">{c.flag}</span>
            <div>
              <p className="eyebrow-light">{c.region}</p>
              <h1 className="mt-1 font-serif text-4xl font-medium md:text-6xl">{c.name}</h1>
            </div>
          </div>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/70">{c.summary}</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-3 items-start">
          {/* Visa & tuition */}
          <div className="space-y-8 lg:col-span-2">
            <div className="reveal">
              <h2 className="border-b-2 border-gold pb-3 font-serif text-2xl font-medium text-navy">
                Visa pathway
              </h2>
              <p className="mt-4 text-[16px] leading-relaxed text-navy/75">{c.visaInfo}</p>
            </div>
            <div className="reveal">
              <h2 className="border-b-2 border-gold pb-3 font-serif text-2xl font-medium text-navy">
                Tuition & fees
              </h2>
              <p className="mt-4 text-[16px] leading-relaxed text-navy/75">{c.tuitionInfo}</p>
            </div>
            {living && (
              <div className="reveal">
                <h2 className="border-b-2 border-gold pb-3 font-serif text-2xl font-medium text-navy">
                  Monthly living costs
                </h2>
                <div className="mt-5 grid gap-px bg-navy/10 sm:grid-cols-3">
                  {(["budget", "standard", "comfortable"] as const).map((tier) => (
                    <div key={tier} className="bg-white p-6 text-center">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/50">
                        {tier}
                      </p>
                      <p className="mt-2 font-serif text-3xl text-navy">
                        {living.currency || ""} {living[tier] != null ? Number(living[tier]).toLocaleString() : "—"}
                      </p>
                    </div>
                  ))}
                </div>
                {living.note && (
                  <p className="mt-3 text-[13px] text-navy/50">
                    Indicative statistical estimate — {living.note}
                  </p>
                )}
              </div>
            )}

            {/* Post-Study Work & Employment Rights */}
            <div className="reveal">
              <h2 className="border-b-2 border-gold pb-3 font-serif text-2xl font-medium text-navy flex items-center gap-2.5">
                <Briefcase className="h-6 w-6 text-gold-dark" />
                Work Rights & Post-Study Career Pathway
              </h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-navy/10 bg-white p-5 shadow-xs transition-all hover:border-gold hover:shadow-sm">
                  <div className="flex items-center gap-2 text-gold-dark">
                    <Clock className="h-5 w-5" />
                    <span className="text-[12px] font-bold uppercase tracking-wider">During Studies</span>
                  </div>
                  <h3 className="mt-2 text-base font-semibold text-navy">20 Hours / Week Part-Time</h3>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-navy/70">
                    International students are permitted to work up to 20 hours per week during term-time and full-time (40 hrs/week) during scheduled university vacations and holidays.
                  </p>
                </div>

                <div className="rounded-xl border border-navy/10 bg-white p-5 shadow-xs transition-all hover:border-gold hover:shadow-sm">
                  <div className="flex items-center gap-2 text-gold-dark">
                    <GraduationCap className="h-5 w-5" />
                    <span className="text-[12px] font-bold uppercase tracking-wider">After Graduation</span>
                  </div>
                  <h3 className="mt-2 text-base font-semibold text-navy">2 to 3-Year Post-Study Visa</h3>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-navy/70">
                    Graduates qualify for the post-study work route (2 years for Bachelor’s/Master’s degrees, 3 years for Doctoral/PhD programs) without mandatory employer sponsorship.
                  </p>
                </div>

                <div className="rounded-xl border border-navy/10 bg-white p-5 shadow-xs transition-all hover:border-gold hover:shadow-sm">
                  <div className="flex items-center gap-2 text-gold-dark">
                    <Users className="h-5 w-5" />
                    <span className="text-[12px] font-bold uppercase tracking-wider">Spouse & Family</span>
                  </div>
                  <h3 className="mt-2 text-base font-semibold text-navy">Dependants & Healthcare</h3>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-navy/70">
                    Postgraduate research candidates and eligible routes permit spouses with full-time open work permits and access to statutory national healthcare coverage.
                  </p>
                </div>

                <div className="rounded-xl border border-navy/10 bg-white p-5 shadow-xs transition-all hover:border-gold hover:shadow-sm">
                  <div className="flex items-center gap-2 text-gold-dark">
                    <ShieldCheck className="h-5 w-5" />
                    <span className="text-[12px] font-bold uppercase tracking-wider">Permanent Residency</span>
                  </div>
                  <h3 className="mt-2 text-base font-semibold text-navy">Long-Term Settlement</h3>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-navy/70">
                    Direct conversion route into Skilled Worker status or regional migration permits upon receiving a qualifying employer offer, building seniority toward PR.
                  </p>
                </div>
              </div>
            </div>

            {/* 5-Stage Admissions & Visa Roadmap */}
            <div className="reveal">
              <h2 className="border-b-2 border-gold pb-3 font-serif text-2xl font-medium text-navy flex items-center gap-2.5">
                <Calendar className="h-6 w-6 text-gold-dark" />
                Intake & Visa Application Roadmap
              </h2>
              <div className="mt-6 space-y-4">
                {[
                  {
                    step: "01",
                    title: "Program Selection & Document Audit",
                    desc: "Review academic transcripts, gap explanations, English language proficiency (IELTS/MOI letter), and verify eligibility for partner institutions.",
                  },
                  {
                    step: "02",
                    title: "Conditional Offer & Scholarship Review",
                    desc: "Submission of admission dossiers, securing university conditional offer letter, and applying for institutional tuition fee grants up to £5,000 / €4,000.",
                  },
                  {
                    step: "03",
                    title: "Maintenance Funds & Bank Statement Maturation",
                    desc: "Structuring the statutory proof-of-funds in personal/parent bank account with exact 28-day / 30-day holding rules verified by our advisors.",
                  },
                  {
                    step: "04",
                    title: "CAS / Visa Letter & Biometrics Filing",
                    desc: "Issuance of Confirmation of Acceptance for Studies (CAS) or acceptance certificate, appointment booking at VFS/Gedex, and digital visa file preparation.",
                  },
                  {
                    step: "05",
                    title: "Decision, Travel Briefing & Settlement Support",
                    desc: "Visa decision receipt, flight itinerary confirmation, university student housing arrangements, and pre-departure orientation with Zeb Khan.",
                  },
                ].map((item) => (
                  <div
                    key={item.step}
                    className="flex items-start gap-4 rounded-xl border border-navy/10 bg-white p-4.5 transition-all hover:border-gold hover:shadow-xs"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold-dark font-serif text-lg font-bold border border-gold/30">
                      {item.step}
                    </span>
                    <div>
                      <h3 className="font-serif text-[16px] font-medium text-navy">{item.title}</h3>
                      <p className="mt-1 text-[13.5px] leading-relaxed text-navy/70">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Living Essentials & Ancillary Costs Breakdown */}
            <div className="reveal">
              <h2 className="border-b-2 border-gold pb-3 font-serif text-2xl font-medium text-navy flex items-center gap-2.5">
                <Building className="h-6 w-6 text-gold-dark" />
                Living Essentials & Student Housing Breakdown
              </h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-navy/10 bg-white p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gold-dark">Accommodation</p>
                  <p className="mt-2 text-base font-semibold text-navy">University Halls / Flats</p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-navy/65">
                    On-campus student rooms or private student halls including high-speed internet, water and heating.
                  </p>
                </div>
                <div className="rounded-xl border border-navy/10 bg-white p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gold-dark">Healthcare & Cover</p>
                  <p className="mt-2 text-base font-semibold text-navy">Statutory Health Access</p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-navy/65">
                    Official health surcharge (IHS / OSHC / National Insurance) granting full public medical access.
                  </p>
                </div>
                <div className="rounded-xl border border-navy/10 bg-white p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gold-dark">Transport & Food</p>
                  <p className="mt-2 text-base font-semibold text-navy">Monthly Passes & Living</p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-navy/65">
                    Subsidised student transit passes, campus meal plans, groceries, and telecom mobile SIM contracts.
                  </p>
                </div>
              </div>
            </div>

            {/* Consultation Banner for this specific country */}
            <div className="reveal rounded-2xl bg-gradient-to-br from-navy via-[#021327] to-[#041021] p-7 text-white shadow-md border border-gold/30">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-gold">
                    <Sparkles className="h-3 w-3 text-gold" /> Personalized {c.name} Advisory
                  </div>
                  <h3 className="mt-3 font-serif text-2xl font-medium text-white">
                    Need end-to-end guidance for {c.name}?
                  </h3>
                  <p className="mt-2 max-w-lg text-[14px] leading-relaxed text-white/70">
                    Get your academic profile evaluated, admission requirements confirmed, and proof-of-funds roadmap structured with our British Council Certified Trainer Zeb Khan.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                  <a
                    href={waLink(`Hello — I would like an advisory consultation for ${c.name} admissions and visa requirements.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-gold text-center whitespace-nowrap"
                  >
                    WhatsApp Advisor
                  </a>
                  <Link
                    to={`/cost-planner?country=${c.slug}`}
                    className="btn-frame-light text-center whitespace-nowrap"
                  >
                    Cost Planner →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Sidebar: Stays pinned as the left side content scrolls */}
          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            {/* 1. Official Bank Statement Rule (with Live Verification badge & tip) */}
            {(funds || liveCosts?.proofOfFunds) && (
              <div className="reveal border border-gold/40 bg-paper p-6 sm:p-7 rounded-2xl shadow-xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-gold-dark">
                    <Landmark className="h-5 w-5" />
                    <h3 className="text-[12px] font-semibold uppercase tracking-[0.16em]">
                      Official bank statement rule
                    </h3>
                  </div>
                  {liveCosts && (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 shrink-0">
                      Verified 2026/27
                    </span>
                  )}
                </div>

                <p className="mt-4 font-serif text-3xl sm:text-4xl font-bold text-navy">
                  {(funds?.currency || liveCosts?.currency || "")}{" "}
                  {funds?.amount != null
                    ? Number(funds.amount).toLocaleString()
                    : liveCosts?.proofOfFunds?.displayAmount || (liveCosts?.proofOfFunds?.amount ? Number(liveCosts.proofOfFunds.amount).toLocaleString() : "—")}
                </p>

                {(funds?.months || liveCosts?.proofOfFunds?.authority) && (
                  <p className="mt-1 text-[13px] text-navy/60 font-medium">
                    {funds?.months ? `${funds.months}-month requirement` : `${liveCosts?.proofOfFunds?.authority} requirement`}
                  </p>
                )}

                <p className="mt-3.5 border-t border-navy/10 pt-3.5 text-[13.5px] leading-relaxed text-navy/75">
                  {funds?.note || liveCosts?.proofOfFunds?.summary}
                </p>

                {funds?.holderRule && (
                  <p className="mt-2.5 text-[13px] font-medium text-navy">
                    Holder: {funds.holderRule}
                  </p>
                )}

                {liveCosts?.keyAdvice && (
                  <p className="mt-3 rounded-lg bg-gold/10 border border-gold/20 p-2.5 text-[12px] leading-relaxed text-navy/80">
                    💡 <strong className="text-navy">Advisory Tip:</strong> {liveCosts.keyAdvice}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-navy/10 pt-3 text-[11px] text-navy/40">
                  <span className="uppercase tracking-[0.1em]">
                    Effective {funds?.effectiveDate || "2026"}
                  </span>
                  {(funds?.sourceUrl || liveCosts?.proofOfFunds?.sourceUrl) && (
                    <a
                      href={funds?.sourceUrl || liveCosts?.proofOfFunds?.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-gold-dark hover:underline"
                    >
                      Government source <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* 2. Indicative Flight Ranges */}
            {flights.length > 0 && (
              <div className="reveal border border-navy/10 bg-white p-6 sm:p-7 rounded-2xl shadow-xs">
                <div className="flex items-center gap-2 text-gold-dark">
                  <Plane className="h-5 w-5" />
                  <h3 className="text-[12px] font-semibold uppercase tracking-[0.16em]">
                    Indicative flight ranges
                  </h3>
                </div>
                <ul className="mt-4 space-y-2.5">
                  {flights.map((f: any) => (
                    <li
                      key={f.from}
                      className="flex items-center justify-between text-[13.5px] text-navy/80 border-b border-navy/5 pb-2 last:border-0 last:pb-0"
                    >
                      <span className="text-navy/70">From {f.from}</span>
                      <span className="font-semibold text-navy">
                        {f.currency} {f.priceMin}–{f.priceMax}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3.5 border-t border-navy/10 pt-3 text-[11.5px] text-navy/45">
                  Live fares are confirmed by our team via the airline search API at consultation.
                </p>
              </div>
            )}

            {/* 3. Cost Planner CTA */}
            <div className="reveal rounded-2xl bg-navy p-6 sm:p-7 text-white shadow-md">
              <Wallet className="h-6 w-6 text-gold" />
              <h3 className="mt-3 font-serif text-xl font-medium text-white">
                Calculate your full {c.name} budget
              </h3>
              <p className="mt-2 text-[13.5px] text-white/65 leading-relaxed">
                Flight + living + official funds, itemised and separated.
              </p>
              <Link to={`/cost-planner?country=${c.slug}`} className="btn-gold mt-5 w-full text-center block font-semibold text-sm">
                Plan my budget <ArrowRight className="h-4 w-4 inline ml-1" />
              </Link>
            </div>

            {/* 4. Statutory Document Checklist for this country */}
            <div className="reveal border border-navy/10 bg-white p-6 sm:p-7 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between gap-2 border-b border-navy/10 pb-3.5">
                <div className="flex items-center gap-2 text-gold-dark">
                  <FileText className="h-5 w-5" />
                  <h3 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-navy">
                    {c.name} File Checklist
                  </h3>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  2026/27 Active
                </span>
              </div>
              <ul className="mt-4 space-y-2.5">
                {[
                  "Valid Passport & National Identity (CNIC / Resident ID)",
                  "Attested Academic Transcripts & Graduation Degree",
                  "Statutory Proof of Funds / Bank Statement",
                  "English Language Proficiency (IELTS / MOI Acceptance)",
                  "Statement of Purpose (SOP) & Tailored Academic CV",
                  "IOM Panel Medical & Tuberculosis (TB) Clearance",
                ].map((doc) => (
                  <li key={doc} className="flex items-start gap-2.5 text-[13px] text-navy/80">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span>{doc}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 pt-3.5 border-t border-navy/10">
                <a
                  href={waLink(`Hello Kishaa — I want a free document pre-screening audit for my ${c.name} application.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-gold/40 bg-gold/10 py-2.5 text-[12px] font-bold uppercase tracking-wider text-gold-dark hover:bg-gold hover:text-navy transition-all"
                >
                  <MessageCircle className="h-3.5 w-3.5" /> Request Document Audit
                </a>
              </div>
            </div>

            {/* 5. Key Admissions Windows & Intakes */}
            <div className="reveal border border-navy/10 bg-white p-6 sm:p-7 rounded-2xl shadow-xs">
              <div className="flex items-center gap-2 text-gold-dark border-b border-navy/10 pb-3.5">
                <Calendar className="h-5 w-5" />
                <h3 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-navy">
                  Admissions Windows & Deadlines
                </h3>
              </div>
              <div className="mt-4 space-y-3">
                <div className="rounded-xl bg-[#FAF9F5] p-3.5 border border-gold/20">
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-[14px] font-semibold text-navy">Autumn (Sep/Oct 2026/27)</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                      Primary
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] text-navy/65">
                    Main recruitment window with maximum university scholarships & course options.
                  </p>
                </div>

                <div className="rounded-xl bg-[#FAF9F5] p-3.5 border border-gold/20">
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-[14px] font-semibold text-navy">Winter (Jan/Feb 2027)</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gold-dark bg-gold/15 px-2 py-0.5 rounded-full">
                      Fast-Track
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] text-navy/65">
                    Direct entry for postgraduate & top bachelor programs with streamlined CAS / visa turnaround.
                  </p>
                </div>

                <div className="rounded-xl bg-[#FAF9F5] p-3.5 border border-gold/20">
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-[14px] font-semibold text-navy">Spring (Apr/May 2027)</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded-full">
                      Pathway
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] text-navy/65">
                    Pre-master tracks, foundation years, and intensive English preparation modules.
                  </p>
                </div>
              </div>
            </div>

            {/* 6. Meet Consultant & Direct Desk */}
            <div className="reveal border border-gold/40 bg-gradient-to-br from-[#0c284d] to-[#041021] p-6 sm:p-7 rounded-2xl text-white shadow-md">
              <div className="flex items-center gap-3">
                <img
                  src="/img/zeb-khan.webp"
                  alt="Zeb Khan"
                  width={56}
                  height={56}
                  className="h-14 w-14 rounded-full border-2 border-gold/60 object-cover object-top shrink-0 shadow-sm"
                />
                <div>
                  <h4 className="font-serif text-base font-semibold text-white">Zeb Khan</h4>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gold">
                    British Council Certified Trainer
                  </p>
                  <p className="text-[11px] text-white/60">Dubai HQ & Pakistan Specialist Desks</p>
                </div>
              </div>
              <p className="mt-3.5 border-t border-white/10 pt-3.5 text-[12.5px] leading-relaxed text-white/75">
                Direct portfolio assessment and 1-on-1 visa strategy session with verified document audit.
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <a
                  href={waLink(`Hello Zeb Khan — I want to consult regarding ${c.name} student visa and admissions.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-gold text-center block text-[12px] font-bold py-2.5"
                >
                  <MessageCircle className="h-4 w-4 inline mr-1.5" /> Book Consultation with Zeb Khan
                </a>
                <a
                  href={`tel:${SITE.phoneUAE.replace(/\s+/g, '')}`}
                  className="text-center block rounded-xl border border-white/15 bg-white/5 py-2 text-[11.5px] font-semibold text-white/80 hover:border-gold hover:text-gold transition-colors"
                >
                  <Phone className="h-3.5 w-3.5 inline mr-1.5" /> Call Dubai Desk: {SITE.phoneUAE}
                </a>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}

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
} from "lucide-react";
import { trpc } from "@/providers/trpc";
import { Seo, orgJsonLd, zebJsonLd, faqJsonLd } from "@/lib/seo";
import { useReveal } from "@/lib/reveal";
import { SITE, waLink } from "@/lib/site";
import { ProgramCard, TestimonialCard } from "@/components/site/blocks";
import { EnquiryForm } from "@/components/site/EnquiryForm";
import type { Program } from "@/types";

const TRIAD = [
  {
    icon: GraduationCap,
    title: "Career Counseling",
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

export default function Home() {
  const { data: featured } = trpc.content.programs.featured.useQuery();
  const { data: countries } = trpc.content.countries.list.useQuery();
  const { data: testimonials } = trpc.content.testimonials.list.useQuery();
  const { data: faqs } = trpc.content.faqs.list.useQuery();
  const { data: zeb } = trpc.content.team.bySlug.useQuery({ slug: "zeb-khan" });
  const [teaserCountry, setTeaserCountry] = useState("united-kingdom");
  useReveal(featured);

  const career = (featured ?? []).filter((p: Program) => p.pillar === "career").slice(0, 4);
  const immigration = (featured ?? []).filter((p: Program) => p.pillar === "immigration").slice(0, 3);
  const selected = countries?.find((c) => c.slug === teaserCountry) || countries?.[0];
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
        jsonLd={[orgJsonLd, zebJsonLd, ...(faqs?.length ? [faqJsonLd(faqs.slice(0, 6))] : [])]}
      />

      {/* 02 — Triad Hero */}
      <section className="relative overflow-hidden bg-navy text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, #c9a227 0, transparent 40%), radial-gradient(circle at 85% 75%, #c9a227 0, transparent 35%)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 md:py-32">
          <p className="eyebrow-light">Gateway to Global Careers · One Company, Global Solutions</p>
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

          <div className="mt-20 grid gap-px bg-white/10 md:grid-cols-3">
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
            <Link to="/cost-planner" className="btn-fill mt-8">
              <Calculator className="h-4 w-4" /> Open the Cost Planner
            </Link>
          </div>
          <div className="reveal border border-navy/10 bg-white p-8">
            <label htmlFor="teaser-country" className="eyebrow">
              Quick preview — choose a destination
            </label>
            <select
              id="teaser-country"
              value={teaserCountry}
              onChange={(e) => setTeaserCountry(e.target.value)}
              className="mt-3 w-full border border-navy/20 px-4 py-3 text-[15px] text-navy outline-none focus:border-gold"
            >
              {(countries ?? []).map((c) => (
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
                  className="btn-frame w-full text-center"
                >
                  Calculate my full estimate
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 04 — Flagship visa pathways */}
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

      {/* 05 — Meet Zeb Khan */}
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

      {/* 06 — Cambridge & IELTS strip */}
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
            {(featured ?? [])
              .filter((p: Program) => p.pillar === "cambridge")
              .map((p: Program) => (
                <ProgramCard key={p.id} program={p} />
              ))}
          </div>
        </div>
      </section>

      {/* 07 — Verified trust */}
      <section className="border-y border-navy/10 bg-paper">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="reveal flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow">Verified trust</p>
              <h2 className="mt-3 font-serif text-4xl font-medium text-navy md:text-5xl">
                Real outcomes. Real people.
              </h2>
            </div>
            <div className="flex items-center gap-2 border border-navy/10 bg-white px-5 py-3">
              <Star className="h-5 w-5 fill-gold text-gold" />
              <span className="text-[14px] font-semibold text-navy">
                {testimonials?.length ?? 0}+ client stories on file
              </span>
            </div>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {(testimonials ?? []).slice(0, 3).map((t) => (
              <div key={t.id} className="reveal">
                <TestimonialCard t={t} />
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link to="/reviews" className="btn-frame">
              Inspect all reviews <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 08 — University admissions hub */}
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

      {/* 09 — Enquiry */}
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

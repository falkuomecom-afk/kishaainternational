import { Link } from "react-router";
import { ArrowRight, Star, ChevronDown } from "lucide-react";
import { useState } from "react";
import type { Program, Testimonial, Faq } from "../../types";

export function PageHero({
  eyebrow,
  title,
  lede,
  dark = false,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  dark?: boolean;
}) {
  return (
    <section className={dark ? "bg-navy text-white" : "bg-paper"}>
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24">
        <p className={dark ? "eyebrow-light" : "eyebrow"}>{eyebrow}</p>
        <h1
          className={`mt-4 max-w-3xl font-serif text-4xl font-medium leading-[1.08] md:text-6xl ${
            dark ? "text-white" : "text-navy"
          }`}
        >
          {title}
        </h1>
        {lede && (
          <p
            className={`mt-6 max-w-2xl text-lg leading-relaxed ${
              dark ? "text-white/70" : "text-navy/70"
            }`}
          >
            {lede}
          </p>
        )}
        <div className="rule-gold mt-8" />
      </div>
    </section>
  );
}

const PILLAR_META: Record<string, { label: string; to: string }> = {
  career: { label: "Career Counseling", to: "/career-counseling" },
  immigration: { label: "Immigration Consultancy", to: "/immigration-consultancy" },
  cambridge: { label: "Cambridge Courses", to: "/cambridge-courses" },
};

export function ProgramCard({ program, index }: { program: Program; index?: number }) {
  const meta = PILLAR_META[program.pillar];
  const isFeatured = index === 1 || program.featured;
  return (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl transition-all duration-300 ease-out hover:-translate-y-2 ${
        isFeatured
          ? "border-2 border-[#C9A227] bg-gradient-to-b from-[#FFFDF9] via-[#FAF5EA] to-[#F5EBD4] shadow-[0_16px_45px_rgba(201,162,39,0.18)] hover:shadow-[0_24px_55px_rgba(201,162,39,0.28)]"
          : "border border-navy/15 bg-gradient-to-b from-white via-[#FCFBF8] to-[#F7F4EC] shadow-sm hover:border-gold/70 hover:shadow-[0_20px_50px_rgba(6,22,45,0.12)]"
      } p-7 sm:p-8`}
    >
      {/* Featured top gradient accent strip */}
      {isFeatured && (
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-gold-dark via-[#ECC248] to-gold-dark" />
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold-dark">
            {meta?.label}
          </span>
          {isFeatured && (
            <span className="inline-flex items-center rounded-full bg-gold/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold-dark border border-gold/40">
              ★ High Demand
            </span>
          )}
        </div>
        {index !== undefined && (
          <span className="font-serif text-3xl font-bold bg-gradient-to-br from-gold-dark via-gold to-gold-dark bg-clip-text text-transparent group-hover:scale-110 transition-transform">
            {String(index + 1).padStart(2, "0")}
          </span>
        )}
      </div>

      <h3 className="mt-4 font-serif text-2xl font-medium leading-snug text-navy group-hover:text-navy transition-colors">
        {program.name}
      </h3>

      <p className="mt-3 flex-1 text-[15px] leading-relaxed text-navy/70">
        {program.summary}
      </p>

      {program.fees && (
        <div className="mt-5 rounded-xl border border-navy/10 bg-white/70 backdrop-blur-xs p-3.5 flex items-center justify-between">
          <span className="text-[11px] uppercase font-bold tracking-wider text-navy/60">
            Fee &amp; Milestone
          </span>
          <span className="text-[13px] font-semibold text-navy font-mono">
            {program.fees.split(".")[0]}.
          </span>
        </div>
      )}

      <Link
        to={`${meta?.to ?? "/contact"}#${program.slug}`}
        className="mt-6 inline-flex items-center justify-between rounded-lg border border-navy/15 bg-white/80 px-4 py-2.5 text-[13px] font-bold uppercase tracking-[0.14em] text-navy transition-all duration-200 group-hover:bg-navy group-hover:text-white group-hover:border-navy group-hover:shadow-md"
      >
        <span>Explore this route</span>
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1.5" />
      </Link>
    </article>
  );
}

export function TestimonialCard({ t }: { t: Testimonial }) {
  return (
    <figure className="flex h-full flex-col border border-navy/10 bg-white p-7">
      <div className="flex gap-1 text-gold" role="img" aria-label={`${t.rating} out of 5 stars`}>
        {Array.from({ length: t.rating }).map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-current" aria-hidden="true" />
        ))}
      </div>
      <blockquote className="mt-4 flex-1 font-serif text-lg leading-relaxed text-navy">
        “{t.quote}”
      </blockquote>
      <figcaption className="mt-5 border-t border-navy/10 pt-4">
        <p className="text-[14px] font-semibold text-navy">{t.authorName}</p>
        {t.context && <p className="text-[13px] text-navy/70">{t.context}</p>}
      </figcaption>
    </figure>
  );
}

export function FaqAccordion({ faqs, dark = false }: { faqs: Faq[]; dark?: boolean }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className={`divide-y ${dark ? "divide-white/10" : "divide-navy/10"}`}>
      {faqs.map((f, i) => (
        <div key={f.id}>
          <button
            className="flex w-full items-center justify-between gap-4 py-5 text-left"
            onClick={() => setOpen(open === i ? null : i)}
            aria-expanded={open === i}
          >
            <span
              className={`font-serif text-lg font-medium md:text-xl ${
                dark ? "text-white" : "text-navy"
              }`}
            >
              {f.question}
            </span>
            <ChevronDown
              className={`h-5 w-5 shrink-0 text-gold transition-transform duration-300 ${
                open === i ? "rotate-180" : ""
              }`}
            />
          </button>
          {open === i && (
            <p
              className={`pb-6 pr-8 text-[15px] leading-relaxed ${
                dark ? "text-white/65" : "text-navy/65"
              }`}
            >
              {f.answer}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

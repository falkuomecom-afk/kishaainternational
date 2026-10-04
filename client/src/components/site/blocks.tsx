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
  return (
    <article className="group flex h-full flex-col border border-navy/10 bg-white p-7 transition-all duration-300 hover:border-gold hover:shadow-[0_12px_40px_rgba(6,22,45,0.08)]">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-dark">
          {meta?.label}
        </span>
        {index !== undefined && (
          <span className="font-serif text-2xl font-semibold text-navy/60">
            {String(index + 1).padStart(2, "0")}
          </span>
        )}
      </div>
      <h3 className="mt-4 font-serif text-2xl font-medium leading-snug text-navy">
        {program.name}
      </h3>
      <p className="mt-3 flex-1 text-[15px] leading-relaxed text-navy/65">{program.summary}</p>
      {program.fees && (
        <p className="mt-4 border-t border-navy/10 pt-4 text-[13px] font-medium text-navy/80">
          {program.fees.split(".")[0]}.
        </p>
      )}
      <Link
        to={`${meta?.to ?? "/contact"}#${program.slug}`}
        className="mt-5 inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.14em] text-navy transition-colors group-hover:text-gold-dark"
      >
        Explore this route <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
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

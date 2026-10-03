import { Link } from "react-router";
import { ArrowRight, Check, MessageCircle } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { Seo, faqJsonLd, breadcrumbJsonLd, courseJsonLd } from "@/lib/seo";
import { useReveal } from "@/lib/reveal";
import { waLink } from "@/lib/site";
import { PageHero, FaqAccordion } from "@/components/site/blocks";
import { EnquiryForm } from "@/components/site/EnquiryForm";
import type { Program } from "@/types";

/**
 * Shared layout for the three pillar pages:
 * Career Counseling / Immigration Consultancy / Cambridge Courses.
 */
export function PillarPage({
  pillar,
  eyebrow,
  title,
  lede,
  seoTitle,
  seoDescription,
  path,
  steps,
  faqCategory,
  formTitle,
}: {
  pillar: "career" | "immigration" | "cambridge";
  eyebrow: string;
  title: string;
  lede: string;
  seoTitle: string;
  seoDescription: string;
  path: string;
  steps: { title: string; text: string }[];
  faqCategory: string;
  formTitle: string;
}) {
  const { data: programs } = trpc.content.programs.list.useQuery({ pillar });
  const { data: faqs } = trpc.content.faqs.list.useQuery({ category: faqCategory });
  useReveal(programs);

  const jsonLd = [
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: eyebrow, path },
    ]),
    ...(faqs?.length ? [faqJsonLd(faqs)] : []),
    ...(programs ?? []).slice(0, 5).map((p: Program) => courseJsonLd(p)),
  ];

  return (
    <>
      <Seo title={seoTitle} description={seoDescription} path={path} jsonLd={jsonLd} />
      <PageHero eyebrow={eyebrow} title={title} lede={lede} />

      {/* Programs */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="space-y-0">
          {(programs ?? []).map((p: Program, i: number) => (
            <article
              key={p.id}
              id={p.slug}
              className="reveal grid gap-8 border-t border-navy/10 py-14 first:border-t-0 md:grid-cols-12"
            >
              <div className="md:col-span-4">
                <span className="font-serif text-5xl text-gold/60">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2 className="mt-4 font-serif text-3xl font-medium leading-tight text-navy">
                  {p.name}
                </h2>
                {p.fees && (
                  <p className="mt-4 text-[13px] font-semibold uppercase tracking-[0.08em] text-gold-dark">
                    {p.fees}
                  </p>
                )}
              </div>
              <div className="md:col-span-5">
                <p className="text-[16px] leading-relaxed text-navy/75">{p.description}</p>
                {p.highlights && (
                  <ul className="mt-5 space-y-2.5">
                    {p.highlights.split("\n").map((h) => (
                      <li key={h} className="flex items-start gap-2.5 text-[15px] text-navy/80">
                        <Check className="mt-1 h-4 w-4 shrink-0 text-gold" />
                        {h}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="md:col-span-3">
                <dl className="space-y-4 border-l-2 border-gold/50 pl-5 text-[14px]">
                  {p.audience && (
                    <div>
                      <dt className="font-semibold uppercase tracking-[0.12em] text-navy/45 text-[11px]">
                        Who this is for
                      </dt>
                      <dd className="mt-1 text-navy/75">{p.audience}</dd>
                    </div>
                  )}
                  {p.delivery && (
                    <div>
                      <dt className="font-semibold uppercase tracking-[0.12em] text-navy/45 text-[11px]">
                        Delivery
                      </dt>
                      <dd className="mt-1 text-navy/75">{p.delivery}</dd>
                    </div>
                  )}
                  {p.duration && (
                    <div>
                      <dt className="font-semibold uppercase tracking-[0.12em] text-navy/45 text-[11px]">
                        Timeline
                      </dt>
                      <dd className="mt-1 text-navy/75">{p.duration}</dd>
                    </div>
                  )}
                </dl>
                <div className="mt-6 flex flex-col gap-2.5">
                  <Link to={`/contact?program=${encodeURIComponent(p.name)}`} className="btn-fill !py-2.5 text-center">
                    Enquire
                  </Link>
                  <a
                    href={waLink(`Hello — I'd like to discuss: ${p.name}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-frame !py-2.5 text-center"
                  >
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Process */}
      <section className="bg-navy text-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <p className="eyebrow-light">How it works</p>
          <h2 className="mt-3 font-serif text-3xl font-medium md:text-5xl">
            A transparent, step-by-step process
          </h2>
          <div className="mt-12 grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <div key={s.title} className="bg-navy p-8">
                <span className="font-serif text-4xl text-gold">{i + 1}</span>
                <h3 className="mt-4 font-serif text-xl">{s.title}</h3>
                <p className="mt-3 text-[14px] leading-relaxed text-white/65">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ + form */}
      <section className="mx-auto grid max-w-7xl gap-16 px-4 py-20 sm:px-6 lg:grid-cols-2">
        <div>
          <p className="eyebrow">Common questions</p>
          <h2 className="mt-3 font-serif text-3xl font-medium text-navy md:text-4xl">
            Answered before you ask
          </h2>
          <div className="mt-8">
            <FaqAccordion faqs={faqs ?? []} />
          </div>
          <Link
            to="/resources"
            className="mt-6 inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.14em] text-gold-dark"
          >
            All resources & guides <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="border border-navy/10 bg-paper p-8 md:p-10">
          <EnquiryForm
            title={formTitle}
            source={eyebrow}
            interest={
              pillar === "career"
                ? "Career Counseling / University Admissions"
                : pillar === "immigration"
                  ? "Immigration & Visit Visas (Canada LOI, UAE, Schengen)"
                  : "Cambridge / IELTS Training"
            }
          />
        </div>
      </section>
    </>
  );
}

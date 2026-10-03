import { Star } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { Seo, breadcrumbJsonLd } from "@/lib/seo";
import { useReveal } from "@/lib/reveal";
import { PageHero, TestimonialCard } from "@/components/site/blocks";
import { EnquiryForm } from "@/components/site/EnquiryForm";

const PLATFORM_LABEL: Record<string, string> = {
  google: "Google Business Profile",
  facebook: "Facebook",
  trustpilot: "Trustpilot",
};

export default function Reviews() {
  const { data: testimonials } = trpc.content.testimonials.list.useQuery();
  const { data: reviews } = trpc.content.reviews.list.useQuery();
  const { data: aggregates } = trpc.content.reviews.aggregate.useQuery();
  useReveal(testimonials);

  return (
    <>
      <Seo
        title="Reviews & Verified Client Stories"
        description="Verified client reviews and ratings for Kishaa International across Google, Facebook and Trustpilot — real outcomes in admissions, visas and IELTS training."
        path="/reviews"
        jsonLd={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Reviews", path: "/reviews" },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "EducationalOrganization",
            "@id": "https://www.kishaainternational.com/#organization",
            name: "Kishaa International",
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: "5.0",
              reviewCount: String(testimonials?.length ?? 0),
            },
          },
        ]}
      />
      <PageHero
        eyebrow="Reviews & social proof"
        title="Proof you can inspect."
        lede="Every review is attributed to its platform and linked to the original source. Live feeds from Google, Facebook and Trustpilot connect through our verified business profiles."
      />

      {/* Platform aggregates */}
      <section className="border-b border-navy/10 bg-paper">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-14 sm:grid-cols-3 sm:px-6">
          {(["google", "facebook", "trustpilot"] as const).map((p) => {
            const agg = aggregates?.find((a) => a.platform === p);
            return (
              <div key={p} className="reveal border border-navy/10 bg-white p-7 text-center">
                <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-navy/55">
                  {PLATFORM_LABEL[p]}
                </p>
                <div className="mt-3 flex items-center justify-center gap-1 text-gold">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        agg && i < Math.round(Number(agg.avg)) ? "fill-current" : "text-navy/15"
                      }`}
                    />
                  ))}
                </div>
                <p className="mt-2 font-serif text-2xl text-navy">
                  {agg ? Number(agg.avg).toFixed(1) : "—"}
                  <span className="text-sm text-navy/45"> / 5</span>
                </p>
                <p className="text-[12px] text-navy/45">
                  {agg ? `${agg.count} synced reviews` : "Feed connects at launch"}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Synced platform reviews */}
      {(reviews ?? []).length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <h2 className="font-serif text-3xl font-medium text-navy">Synced platform reviews</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {(reviews ?? []).map((r) => (
              <figure key={r.id} className="reveal border border-navy/10 bg-white p-6">
                <div className="flex items-center justify-between">
                  <span className="bg-navy px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-gold">
                    {PLATFORM_LABEL[r.platform]}
                  </span>
                  <div className="flex gap-0.5 text-gold">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-current" />
                    ))}
                  </div>
                </div>
                <blockquote className="mt-4 text-[14px] leading-relaxed text-navy/80">
                  “{r.text}”
                </blockquote>
                <figcaption className="mt-4 text-[13px] font-semibold text-navy">
                  {r.author}
                  {r.reviewDate && (
                    <span className="ml-2 font-normal text-navy/45">{r.reviewDate}</span>
                  )}
                </figcaption>
                {r.permalink && (
                  <a
                    href={r.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-[12px] font-semibold text-gold-dark hover:underline"
                  >
                    View original review →
                  </a>
                )}
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* Client stories */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="reveal font-serif text-3xl font-medium text-navy">Client stories</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {(testimonials ?? []).map((t) => (
            <div key={t.id} className="reveal">
              <TestimonialCard t={t} />
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-navy text-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2">
          <div>
            <p className="eyebrow-light">Your story next</p>
            <h2 className="mt-3 font-serif text-4xl font-medium">Become our next success story.</h2>
            <p className="mt-5 max-w-md text-[16px] leading-relaxed text-white/70">
              Admissions, visas and English training — with the same transparency these clients
              describe.
            </p>
          </div>
          <EnquiryForm dark source="Reviews" title="Start your journey" />
        </div>
      </section>
    </>
  );
}

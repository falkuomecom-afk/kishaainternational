import { useState } from "react";
import { Star, ExternalLink, Play, CheckCircle2 } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { Seo, breadcrumbJsonLd } from "@/lib/seo";
import { useReveal } from "@/lib/reveal";
import { PageHero, TestimonialCard } from "@/components/site/blocks";
import { EnquiryForm } from "@/components/site/EnquiryForm";

const PLATFORM_LABEL: Record<string, string> = {
  google: "Google Business Profile",
  facebook: "Facebook",
  trustpilot: "Trustpilot",
  instagram: "Instagram",
};

export default function Reviews() {
  const [feedFilter, setFeedFilter] = useState<"all" | "facebook" | "instagram">("all");
  const { data: testimonials } = trpc.content.testimonials.list.useQuery();
  const { data: reviews } = trpc.content.reviews.list.useQuery();
  const { data: aggregates } = trpc.content.reviews.aggregate.useQuery();
  const { data: feeds } = trpc.content.feeds.list.useQuery();

  useReveal(testimonials);
  useReveal(feeds);

  const filteredFeeds = (feeds ?? []).filter((f) => {
    if (feedFilter === "all") return true;
    return f.platform === feedFilter;
  });

  return (
    <>
      <Seo
        title="Reviews, Social Feeds & Verified Client Stories"
        description="Live synced Facebook and Instagram feeds, verified client reviews and ratings for Kishaa International — real outcomes in admissions, visas and IELTS training."
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
        lede="Every review and post is attributed to its platform and linked to the original source. Live feeds from Facebook and Instagram connect through our verified business profiles via Composio."
      />

      {/* Platform aggregates */}
      <section className="border-b border-navy/10 bg-paper">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-14 sm:grid-cols-3 sm:px-6">
          {(["facebook", "google", "trustpilot"] as const).map((p) => {
            const agg = aggregates?.find((a) => a.platform === p);
            const isLive = p === "facebook";
            return (
              <div key={p} className="reveal border border-navy/10 bg-white p-7 text-center transition-all hover:shadow-sm">
                <div className="flex items-center justify-center gap-2">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-navy/55">
                    {PLATFORM_LABEL[p]}
                  </p>
                  {isLive && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                    </span>
                  )}
                </div>
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
                  {isLive
                    ? "Live connected via Composio"
                    : p === "google"
                    ? "Ready to connect Google Business"
                    : "Ready to connect Trustpilot"}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 🌟 LIVE SOCIAL FEEDS (Facebook & Instagram via Composio) */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-navy/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-medium text-emerald-800">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Active Live Feed
              </span>
              <p className="text-[12px] font-semibold uppercase tracking-[0.15em] text-navy/60">
                Composio Integration
              </p>
            </div>
            <h2 className="mt-2 font-serif text-3xl font-medium text-navy md:text-4xl">
              Latest from Facebook & Instagram
            </h2>
            <p className="mt-2 text-sm text-navy/70 max-w-2xl">
              Real-time updates, admissions advice, video reels, and announcements synced directly from
              our verified official social accounts.
            </p>
          </div>

          {/* Platform Filters */}
          <div className="flex items-center gap-2">
            {(
              [
                { id: "all", label: "All Updates", count: (feeds ?? []).length },
                { id: "facebook", label: "Facebook", count: (feeds ?? []).filter((f) => f.platform === "facebook").length },
                { id: "instagram", label: "Instagram", count: (feeds ?? []).filter((f) => f.platform === "instagram").length },
              ] as const
            ).map((filter) => (
              <button
                key={filter.id}
                onClick={() => setFeedFilter(filter.id)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-md border transition-all ${
                  feedFilter === filter.id
                    ? "bg-navy text-gold border-navy shadow-sm"
                    : "bg-white text-navy/70 border-navy/15 hover:border-navy/40"
                }`}
              >
                {filter.label} ({filter.count})
              </button>
            ))}
          </div>
        </div>

        {filteredFeeds.length > 0 ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredFeeds.map((feed) => {
              const isInsta = feed.platform === "instagram";
              const isVideo = feed.kind === "video" || feed.kind === "reel";

              return (
                <article
                  key={feed.id}
                  className="reveal group flex flex-col justify-between overflow-hidden rounded-lg border border-navy/10 bg-white transition-all hover:border-gold/50 hover:shadow-md"
                >
                  <div>
                    {/* Media Thumbnail */}
                    {feed.thumbUrl ? (
                      <div className="relative aspect-[16/10] w-full overflow-hidden bg-navy/5">
                        <img
                          src={feed.thumbUrl}
                          alt={feed.caption?.slice(0, 50) || "Social update"}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                        {isVideo && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-navy shadow-md transition-transform group-hover:scale-110">
                              <Play className="h-5 w-5 fill-navy ml-0.5" />
                            </span>
                          </div>
                        )}
                        <span
                          className={`absolute top-3 left-3 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm ${
                            isInsta ? "bg-gradient-to-r from-purple-600 to-pink-600" : "bg-[#1877F2]"
                          }`}
                        >
                          {feed.kind}
                        </span>
                      </div>
                    ) : (
                      <div className="border-b border-navy/5 bg-paper/60 px-5 py-3">
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white ${
                            isInsta ? "bg-gradient-to-r from-purple-600 to-pink-600" : "bg-[#1877F2]"
                          }`}
                        >
                          {feed.platform} update
                        </span>
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-5">
                      <p className="line-clamp-4 text-[14px] leading-relaxed text-navy/85 whitespace-pre-line">
                        {feed.caption}
                      </p>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="flex items-center justify-between border-t border-navy/5 bg-paper/30 px-5 py-3.5 text-xs">
                    <span className="text-navy/50 font-mono text-[11px]">
                      {feed.publishedAt?.slice(0, 10)}
                    </span>
                    <a
                      href={feed.permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-gold-dark hover:text-navy hover:underline"
                    >
                      View on {isInsta ? "Instagram" : "Facebook"} <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-8 rounded-lg border border-dashed border-navy/20 p-12 text-center">
            <p className="text-navy/60 text-sm">No feed items found for the selected filter.</p>
          </div>
        )}
      </section>

      {/* Synced platform reviews */}
      {(reviews ?? []).length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 border-t border-navy/10">
          <h2 className="font-serif text-3xl font-medium text-navy">Verified Platform Reviews</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {(reviews ?? []).map((r) => (
              <figure key={r.id} className="reveal border border-navy/10 bg-white p-6 rounded-md">
                <div className="flex items-center justify-between">
                  <span className="bg-navy px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-gold rounded">
                    {PLATFORM_LABEL[r.platform] || r.platform}
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
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 border-t border-navy/10">
        <h2 className="reveal font-serif text-3xl font-medium text-navy">Client Stories & Outcomes</h2>
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
            <div className="mt-6 flex flex-col gap-2.5 text-sm text-white/80">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-gold" />
                <span>Direct consultation with Chairman Zeb Khan</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-gold" />
                <span>Verified university shortlisting & visa documentation</span>
              </div>
            </div>
          </div>
          <EnquiryForm dark source="Reviews" title="Start your journey" />
        </div>
      </section>
    </>
  );
}

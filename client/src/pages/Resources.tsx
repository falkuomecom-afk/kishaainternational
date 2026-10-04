import { Link } from "react-router";
import { ArrowRight, Clock } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { Seo, breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import { useReveal } from "@/lib/reveal";
import { PageHero, FaqAccordion } from "@/components/site/blocks";
import { getGuideThumbnail, DEFAULT_GUIDE_THUMBNAIL } from "@/lib/guide-images";

export default function Resources() {
  const { data: posts } = trpc.content.posts.list.useQuery();
  const { data: faqs } = trpc.content.faqs.list.useQuery();
  useReveal(posts);
  const categories = [...new Set((faqs ?? []).map((f) => f.category))];

  return (
    <>
      <Seo
        title="Resources & FAQs — Visa Checklists, Bank Statement Rules, IELTS Guides"
        description="Visa application checklists, bank statement rules (UKVI 28-day, Germany blocked account, Australia financial capacity), immigration policy updates and IELTS preparation guides from Kishaa International."
        path="/resources"
        jsonLd={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Resources", path: "/resources" },
          ]),
          ...(faqs?.length ? [faqJsonLd(faqs)] : []),
        ]}
      />
      <PageHero
        eyebrow="Resources & FAQs"
        title="Guides written to be used."
        lede="Visa checklists, official bank statement rules with effective dates, and IELTS preparation roadmaps — free to read, kept current."
      />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="flex items-end justify-between border-b border-navy/10 pb-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold-dark">
              Knowledge Repository · 2026
            </span>
            <h2 className="mt-1 font-serif text-3xl font-medium text-navy">Guides & updates</h2>
          </div>
          <span className="hidden sm:inline-block text-[12px] font-medium text-navy/50">
            {(posts ?? []).length} comprehensive guides published
          </span>
        </div>

        <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-2">
          {(posts ?? []).map((p) => {
            const thumbUrl = getGuideThumbnail(p.slug, (p as any).coverImage);
            return (
              <Link
                key={p.slug}
                to={`/resources/${p.slug}`}
                className="reveal group flex flex-col overflow-hidden rounded-[4px] border border-navy/10 bg-white transition-all duration-300 hover:border-gold hover:shadow-[0_16px_40px_rgba(6,22,45,0.09)]"
              >
                {/* 16:9 Thumbnail Image Container */}
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-navy/95 border-b border-navy/10">
                  <img
                    src={thumbUrl}
                    alt={p.title}
                    className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = DEFAULT_GUIDE_THUMBNAIL;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy/60 via-transparent to-transparent opacity-30 transition-opacity group-hover:opacity-10" />

                  {/* Category Pill Tag Overlay */}
                  <span className="absolute top-3.5 left-3.5 inline-flex items-center rounded-[2px] bg-navy/90 backdrop-blur-md px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.16em] text-gold border border-gold/40 shadow-sm">
                    {p.category}
                  </span>

                  {/* Read Time Overlay */}
                  <span className="absolute bottom-3.5 right-3.5 inline-flex items-center gap-1 rounded-[2px] bg-navy/90 backdrop-blur-md px-2.5 py-0.5 text-[11px] font-medium text-white/90 border border-white/10 shadow-sm">
                    <Clock className="h-3 w-3 text-gold" />
                    {(p as any).readMinutes || 4} min read
                  </span>
                </div>

                {/* Card Text Content */}
                <div className="flex flex-1 flex-col p-6 sm:p-7">
                  <h3 className="font-serif text-2xl font-medium leading-snug text-navy transition-colors group-hover:text-gold-dark">
                    {p.title}
                  </h3>
                  <p className="mt-3 line-clamp-2 flex-1 text-[15px] leading-relaxed text-navy/65">
                    {p.excerpt}
                  </p>
                  <div className="mt-5 pt-4 border-t border-navy/10 flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-navy transition-colors group-hover:text-gold-dark">
                      Read the guide <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-gold-dark bg-gold/10 px-2 py-0.5 rounded-[2px]">
                      Verified
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-20">
          <h2 className="font-serif text-3xl font-medium text-navy">Frequently asked questions</h2>
          <div className="mt-8 grid gap-12 lg:grid-cols-2">
            {categories.map((cat) => (
              <div key={cat}>
                <h3 className="border-b-2 border-gold pb-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-gold-dark">
                  {cat}
                </h3>
                <FaqAccordion faqs={(faqs ?? []).filter((f) => f.category === cat)} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

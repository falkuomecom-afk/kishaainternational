import { useParams, Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { Seo, breadcrumbJsonLd } from "@/lib/seo";
import { Markdown } from "@/lib/markdown";
import { EnquiryForm } from "@/components/site/EnquiryForm";
import { getGuideThumbnail } from "@/lib/guide-images";
import NotFound from "./NotFound";

export default function ResourceDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading, isError } = trpc.content.posts.bySlug.useQuery(
    { slug: slug ?? "" },
    { retry: 1 }
  );

  if (isLoading) return <div className="mx-auto max-w-3xl px-4 pt-28 pb-24 text-navy/50">Loading…</div>;
  if (isError || !post) return <NotFound />;

  const formattedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const thumbnailUrl = getGuideThumbnail(post.slug, (post as any).coverImage);

  return (
    <>
      <Seo
        title={post.seoTitle ?? post.title}
        description={post.seoDescription ?? post.excerpt ?? post.title}
        path={`/resources/${post.slug}`}
        image={thumbnailUrl}
        type="article"
        jsonLd={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Resources", path: "/resources" },
            { name: post.title, path: `/resources/${post.slug}` },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            description: post.excerpt,
            image: `https://www.kishaainternational.com${thumbnailUrl}`,
            author: { "@id": "https://www.kishaainternational.com/#organization" },
            publisher: { "@id": "https://www.kishaainternational.com/#organization" },
            datePublished: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
          },
        ]}
      />

      <section className="pt-24 sm:pt-28 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-10 items-start">
            <article className="min-w-0">
              <Link
                to="/resources"
                className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-navy/50 hover:text-gold-dark transition-colors mb-4"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> All resources
              </Link>
              <p className="eyebrow text-gold-dark font-semibold text-[11px] uppercase tracking-[0.22em] mb-2">
                {post.category || "Guide"}
              </p>
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-[2.65rem] font-medium leading-[1.2] text-navy mb-4">
                {post.title}
              </h1>
              <div className="rule-gold mb-5" />

              <div className="meta-row mb-6 flex flex-wrap items-center gap-3 text-[13px] text-navy/60">
                {formattedDate && <span>{formattedDate}</span>}
                {formattedDate && <span>·</span>}
                <span>{post.readMinutes || 3} min read</span>
                <span>·</span>
                <span>{post.authorName || "Kishaa International"}</span>
                {post.targetQuery && (
                  <span className="inline-flex items-center rounded bg-navy/5 px-2 py-0.5 text-[12px] font-medium text-navy/70 border border-navy/10">
                    Target: {post.targetQuery}
                  </span>
                )}
              </div>

              {/* Featured Guide Hero Thumbnail Banner */}
              <div className="mb-8 overflow-hidden rounded-[4px] border border-navy/10 bg-[#040e1d] shadow-sm">
                <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full overflow-hidden">
                  <img
                    src={thumbnailUrl}
                    alt={post.title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-navy/10 bg-[#f7f6f2] px-4 py-2.5 text-[12px] text-navy/70">
                  <span className="flex items-center gap-2 font-medium">
                    <span className="inline-block h-2 w-2 rounded-full bg-gold-dark"></span>
                    Official Advisory &amp; Regulatory Reference · Kishaa International
                  </span>
                  <span className="font-semibold uppercase tracking-wider text-gold-dark">
                    {post.category || "Verified Guide"} · 2026 Edition
                  </span>
                </div>
              </div>

              {post.answerFirst && (
                <div className="mb-7 rounded-[2px] border-l-[3px] border-gold-dark bg-[#faf9f6] p-5 sm:p-6 shadow-sm">
                  <h3 className="mb-2 font-serif text-[1.15rem] font-medium text-navy">Short answer</h3>
                  <p className="m-0 text-[15px] leading-[1.65] text-navy/80">{post.answerFirst}</p>
                </div>
              )}

              {post.takeaways && post.takeaways.length > 0 && (
                <div className="mb-8 rounded-[4px] border border-gold/30 bg-[#fbf9f1] p-5 sm:p-6 shadow-sm">
                  <h3 className="mb-3 font-serif text-[1.15rem] font-medium text-navy">Key takeaways</h3>
                  <ul className="m-0 list-disc pl-5 space-y-2 text-[15px] leading-[1.65] text-navy/80 marker:text-gold-dark">
                    {post.takeaways.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="cms-prose text-[16.5px] leading-[1.75] text-navy/85">
                <Markdown>{post.body ?? ""}</Markdown>
              </div>

              {post.tagsList && post.tagsList.length > 0 && (
                <div className="mt-8 flex flex-wrap gap-2 pt-6 border-t border-navy/10">
                  {post.tagsList.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-block rounded-[2px] bg-navy/5 px-2.5 py-1 text-[12px] font-medium text-navy/70"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {post.faqs && post.faqs.length > 0 && (
                <div className="mt-12">
                  <h2 className="font-serif text-2xl sm:text-[1.8rem] font-medium text-navy mb-4">
                    Related questions
                  </h2>
                  <div className="divide-y divide-navy/10 rounded-[4px] border border-navy/10 bg-white">
                    {post.faqs.map((faq) => (
                      <details key={faq.id} className="group p-5">
                        <summary className="cursor-pointer font-serif text-base sm:text-lg font-medium text-navy list-none flex justify-between items-center group-hover:text-gold-dark transition-colors">
                          <span>{faq.question}</span>
                          <span className="ml-4 text-xs text-navy/40 group-open:rotate-180 transition-transform">▼</span>
                        </summary>
                        <div className="mt-3 text-[14.5px] leading-[1.65] text-navy/75 pl-1">
                          {faq.answer}
                        </div>
                      </details>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-10 rounded-[4px] border border-navy/10 bg-[#f7f6f2] p-7 sm:p-8 shadow-sm">
                <h3 className="font-serif text-[1.4rem] font-medium text-navy mb-2.5">
                  Talk this through with a consultant
                </h3>
                <p className="max-w-2xl text-[15px] leading-[1.65] text-navy/75 mb-6">
                  Guides cover the general rule. Your file has specifics — profile, funds history, timing and destination. A 20-minute conversation usually saves weeks.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    to="/contact?source=guide"
                    className="btn-gold text-[12px] px-5 py-2.5 font-semibold uppercase tracking-wider"
                  >
                    Request consultation
                  </Link>
                  <Link
                    to="/cost-planner"
                    className="btn-frame text-[12px] px-5 py-2.5 font-semibold uppercase tracking-wider"
                  >
                    Calculate costs
                  </Link>
                </div>
              </div>
            </article>

            <aside className="w-full lg:w-80 space-y-4 lg:sticky lg:top-28">
              <div className="rounded-[4px] border border-navy/10 bg-white p-5 shadow-sm">
                <h4 className="font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-gold-dark mb-3">
                  On this page
                </h4>
                <ul className="space-y-2 text-[13px] text-navy/70 pl-4 list-disc marker:text-gold">
                  <li>Short answer</li>
                  <li>Key takeaways</li>
                  <li>Full detail with tables</li>
                  <li>Related questions</li>
                </ul>
              </div>

              <div className="rounded-[4px] border border-navy/10 bg-white p-5 shadow-sm">
                <h4 className="font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-gold-dark mb-3">
                  Popular destinations
                </h4>
                <ul className="space-y-2 text-[14px]">
                  {(post.destinations && post.destinations.length > 0
                    ? post.destinations
                    : [
                        { name: "United Kingdom", slug: "united-kingdom" },
                        { name: "Canada", slug: "canada" },
                        { name: "Australia", slug: "australia" },
                        { name: "United States", slug: "united-states" },
                        { name: "Germany", slug: "germany" },
                        { name: "United Arab Emirates", slug: "united-arab-emirates" },
                      ]
                  ).map((d) => (
                    <li key={d.slug}>
                      <Link
                        to={`/destinations/${d.slug}`}
                        className="font-medium text-navy hover:text-gold-dark transition-colors flex items-center justify-between"
                      >
                        <span>{d.name}</span>
                        <span className="text-navy/30 text-xs">→</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {post.related && post.related.length > 0 && (
                <div className="rounded-[4px] border border-navy/10 bg-white p-5 shadow-sm">
                  <h4 className="font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-gold-dark mb-3">
                    Related guides
                  </h4>
                  <ul className="space-y-3.5 text-[14px]">
                    {post.related.map((rel) => {
                      const relThumb = getGuideThumbnail(rel.slug, (rel as any).coverImage);
                      return (
                        <li key={rel.id}>
                          <Link
                            to={`/resources/${rel.slug}`}
                            className="group flex items-center gap-3 transition-colors"
                          >
                            <img
                              src={relThumb}
                              alt={rel.title}
                              className="h-12 w-18 shrink-0 rounded-[2px] border border-navy/10 object-cover group-hover:border-gold transition-colors"
                              loading="lazy"
                            />
                            <span className="font-medium text-navy group-hover:text-gold-dark transition-colors leading-snug line-clamp-2 text-[13px]">
                              {rel.title}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              <div className="rounded-[4px] border border-navy/10 bg-white p-5 shadow-sm">
                <h4 className="font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-gold-dark mb-2">
                  Consultation
                </h4>
                <p className="text-[13px] leading-[1.5] text-navy/70 mb-4">
                  Have specific questions regarding this policy or intake?
                </p>
                <Link
                  to="/contact"
                  className="btn-gold w-full text-[12px] py-2.5 text-center font-semibold uppercase tracking-wider block"
                >
                  Book appointment
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="border-t border-navy/10 bg-paper">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <EnquiryForm
            source={`Resource — ${post.title}`}
            title="Questions about this guide? Ask a counselor."
          />
        </div>
      </section>
    </>
  );
}

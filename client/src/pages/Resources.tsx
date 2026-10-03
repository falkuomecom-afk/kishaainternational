import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { Seo, breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import { useReveal } from "@/lib/reveal";
import { PageHero, FaqAccordion } from "@/components/site/blocks";

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
        <h2 className="font-serif text-3xl font-medium text-navy">Guides & updates</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {(posts ?? []).map((p) => (
            <Link
              key={p.slug}
              to={`/resources/${p.slug}`}
              className="reveal group border border-navy/10 bg-white p-8 transition-all hover:border-gold hover:shadow-[0_12px_40px_rgba(6,22,45,0.08)]"
            >
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-dark">
                {p.category}
              </span>
              <h3 className="mt-3 font-serif text-2xl font-medium leading-snug text-navy group-hover:text-gold-dark">
                {p.title}
              </h3>
              <p className="mt-3 text-[15px] leading-relaxed text-navy/60">{p.excerpt}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-navy group-hover:text-gold-dark">
                Read the guide <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
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

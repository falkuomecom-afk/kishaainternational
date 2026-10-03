import { Seo } from "@/lib/seo";
import { Markdown } from "@/lib/markdown";
import { PageHero } from "@/components/site/blocks";
import { trpc } from "@/providers/trpc";

const PRIVACY_FALLBACK = `## What we collect\n\nWhen you submit an enquiry we store your name, your selected contact detail (phone, WhatsApp or email), your area of interest, and any message you choose to send. We also record the page and form you used so we can route your enquiry to the right team.\n\n## Why we collect it\n\nYour information is used for one purpose: to respond to your enquiry and provide the counseling, admissions, visa or training service you asked about. Cost planner estimates are stored so a counselor can discuss them with you — they are never shared publicly.\n\n## What we never ask for\n\nOur public forms never request bank account numbers, financial passwords, passport scans or identity documents. If any document is ever needed, it is requested privately by a named staff member through a secure channel.\n\n## Marketing consent\n\nMarketing messages are sent only if you explicitly opt in. Consent is optional, unchecked by default, and you may withdraw it at any time by contacting us.\n\n## Reviews & feeds\n\nReviews displayed on this site are synced from public Google, Facebook and Trustpilot profiles with attribution and links to the original source.\n\n## Your rights\n\nYou may request a copy, correction or deletion of your enquiry record at any time: email kishaainternational@gmail.com or call +971 58 682 6099 / +92 312 552 6099.\n\n## Retention\n\nEnquiry records are retained for the period needed to serve you and meet operational requirements, then anonymised or deleted according to our retention schedule.`;

const TERMS_FALLBACK = `## The service\n\nKishaa International provides career counseling, immigration consultancy and Cambridge / IELTS training from Dubai, UAE (Headquarters) and Pakistan.\n\n## No guaranteed outcomes\n\nVisa and admission decisions rest solely with the respective embassies, immigration authorities and universities. We provide transparent, professional preparation and never promise approvals.\n\n## Fees\n\nAdvisory fees are always quoted separately from official embassy fees, university tuition and test fees. Where milestone payments are offered, the schedule is agreed in writing before work begins.\n\n## Estimates\n\nCost planner figures are indicative planning estimates based on maintained statistical datasets and official rules with stated effective dates. Live flight fares are confirmed at consultation.\n\n## Content\n\nGuides and country intelligence are prepared with care but may change as official rules change. Always confirm the current rule with the relevant authority or with our team before acting.`;

function extractHtmlFromBlocks(blocksJson: string | null | undefined): string | null {
  if (!blocksJson) return null;
  try {
    const parsed = typeof blocksJson === "string" ? JSON.parse(blocksJson) : blocksJson;
    if (Array.isArray(parsed)) {
      const richBlock = parsed.find((b: any) => b.type === "richtext" && b.html);
      if (richBlock?.html) return richBlock.html;
    }
  } catch {}
  return null;
}

export function Privacy() {
  const { data: page } = trpc.content.pages.bySlug.useQuery({ slug: "privacy" });
  const customHtml = extractHtmlFromBlocks(page?.blocks);

  return (
    <>
      <Seo
        title={page?.seo_title || page?.title || "Privacy Policy"}
        description={page?.seo_description || "How Kishaa International collects, uses and protects your enquiry data."}
        path="/privacy"
      />
      <PageHero eyebrow="Legal" title={page?.title || "Privacy Policy"} />
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        {customHtml ? (
          <div
            className="prose prose-navy max-w-none text-[15px] leading-relaxed text-navy/80 space-y-4"
            dangerouslySetInnerHTML={{ __html: customHtml }}
          />
        ) : (
          <Markdown>{PRIVACY_FALLBACK}</Markdown>
        )}
      </div>
    </>
  );
}

export function Terms() {
  const { data: page } = trpc.content.pages.bySlug.useQuery({ slug: "terms" });
  const customHtml = extractHtmlFromBlocks(page?.blocks);

  return (
    <>
      <Seo
        title={page?.seo_title || page?.title || "Terms of Service"}
        description={page?.seo_description || "Terms of service for Kishaa International consultancy and training services."}
        path="/terms"
      />
      <PageHero eyebrow="Legal" title={page?.title || "Terms of Service"} />
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        {customHtml ? (
          <div
            className="prose prose-navy max-w-none text-[15px] leading-relaxed text-navy/80 space-y-4"
            dangerouslySetInnerHTML={{ __html: customHtml }}
          />
        ) : (
          <Markdown>{TERMS_FALLBACK}</Markdown>
        )}
      </div>
    </>
  );
}


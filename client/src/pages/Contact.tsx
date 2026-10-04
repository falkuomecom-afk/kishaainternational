import { useSearchParams } from "react-router";
import { Phone, Mail, MapPin, MessageCircle } from "lucide-react";
import { Seo, breadcrumbJsonLd, orgJsonLd } from "@/lib/seo";
import { PageHero } from "@/components/site/blocks";
import { EnquiryForm } from "@/components/site/EnquiryForm";
import { SITE, waLink } from "@/lib/site";

export default function Contact() {
  const [params] = useSearchParams();
  const program = params.get("program") ?? undefined;

  return (
    <>
      <Seo
        title="Contact — Dubai HQ & Pakistan"
        description={`Contact Kishaa International: Dubai, UAE HQ ${SITE.phoneUAE} · Pakistan ${SITE.phonePK} · ${SITE.email}. WhatsApp, phone and consultation form.`}
        path="/contact"
        jsonLd={[
          orgJsonLd,
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Contact", path: "/contact" },
          ]),
        ]}
      />
      <PageHero
        eyebrow="Contact"
        title="Talk to a counselor today."
        lede="Dubai and Pakistan teams, one response standard. Choose your channel — WhatsApp, phone, or the form below."
      />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 overflow-x-hidden">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-5 max-w-full overflow-hidden">
            <div className="border border-navy/10 bg-white p-6 sm:p-7 rounded-lg shadow-sm">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-gold-dark shrink-0" />
                <h2 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-dark">
                  Dubai, UAE — Headquarters
                </h2>
              </div>
              <a
                href={waLink("Hello Kishaa International — I'd like to request a consultation.", "uae")}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 block font-serif text-2xl sm:text-3xl text-navy hover:text-gold-dark transition-colors"
                title="Chat with Dubai HQ on WhatsApp"
              >
                {SITE.phoneUAE}
              </a>
              <div className="mt-4 flex flex-wrap items-center gap-2.5">
                <a
                  href={waLink("Hello Kishaa International — I'd like to request a consultation.", "uae")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-4 py-2 text-[12px] font-bold text-white shadow-sm hover:brightness-105 transition-all"
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp Dubai
                </a>
                <a
                  href={`tel:${SITE.phoneUAE.replace(/\s/g, "")}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-navy/20 bg-white px-3.5 py-2 text-[12px] font-semibold text-navy hover:bg-navy/5 transition-all"
                >
                  <Phone className="h-3.5 w-3.5 text-navy/70" /> Call
                </a>
              </div>
            </div>

            <div className="border border-navy/10 bg-white p-6 sm:p-7 rounded-lg shadow-sm">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-gold-dark shrink-0" />
                <h2 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-dark">
                  Pakistan
                </h2>
              </div>
              <a
                href={waLink("Hello Kishaa International — I'd like to request a consultation.", "pk")}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 block font-serif text-2xl sm:text-3xl text-navy hover:text-gold-dark transition-colors"
                title="Chat with Pakistan Office on WhatsApp"
              >
                {SITE.phonePK}
              </a>
              <div className="mt-4 flex flex-wrap items-center gap-2.5">
                <a
                  href={waLink("Hello Kishaa International — I'd like to request a consultation.", "pk")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-4 py-2 text-[12px] font-bold text-white shadow-sm hover:brightness-105 transition-all"
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp Pakistan
                </a>
                <a
                  href={`tel:${SITE.phonePK.replace(/\s/g, "")}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-navy/20 bg-white px-3.5 py-2 text-[12px] font-semibold text-navy hover:bg-navy/5 transition-all"
                >
                  <Phone className="h-3.5 w-3.5 text-navy/70" /> Call
                </a>
              </div>
            </div>

            <div className="border border-navy/10 bg-white p-6 sm:p-7 rounded-lg shadow-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-gold-dark shrink-0" />
                <h2 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-dark">
                  Email
                </h2>
              </div>
              <a
                href={`mailto:${SITE.email}`}
                className="mt-4 block font-serif text-lg sm:text-2xl text-navy hover:text-gold-dark break-all transition-colors"
              >
                {SITE.email}
              </a>
              <p className="mt-3 flex items-center gap-2 text-[13px] text-navy/55">
                <Phone className="h-4 w-4 shrink-0" /> We reply on your preferred channel.
              </p>
            </div>
          </div>

          <div className="lg:col-span-7 max-w-full overflow-hidden">
            <div className="border border-navy/10 bg-paper p-6 sm:p-8 md:p-10 rounded-lg shadow-sm">
              <EnquiryForm
                source="Contact Page"
                program={program}
                title={program ? `Enquire: ${program}` : "Request a consultation"}
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

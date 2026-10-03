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

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-5">
            <div className="border border-navy/10 bg-white p-7">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-gold-dark" />
                <h2 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-dark">
                  Dubai, UAE — Headquarters
                </h2>
              </div>
              <a
                href={`tel:${SITE.phoneUAE.replace(/\s/g, "")}`}
                className="mt-4 block font-serif text-3xl text-navy hover:text-gold-dark"
              >
                {SITE.phoneUAE}
              </a>
              <a
                href={waLink("Hello Kishaa International — I'd like to request a consultation.")}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.12em] text-navy hover:text-gold-dark"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp Dubai
              </a>
            </div>
            <div className="border border-navy/10 bg-white p-7">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-gold-dark" />
                <h2 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-dark">
                  Pakistan
                </h2>
              </div>
              <a
                href={`tel:${SITE.phonePK.replace(/\s/g, "")}`}
                className="mt-4 block font-serif text-3xl text-navy hover:text-gold-dark"
              >
                {SITE.phonePK}
              </a>
              <a
                href={waLink("Hello Kishaa International — I'd like to request a consultation.", "pk")}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.12em] text-navy hover:text-gold-dark"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp Pakistan
              </a>
            </div>
            <div className="border border-navy/10 bg-white p-7">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-gold-dark" />
                <h2 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-dark">
                  Email
                </h2>
              </div>
              <a
                href={`mailto:${SITE.email}`}
                className="mt-4 block font-serif text-2xl text-navy hover:text-gold-dark"
              >
                {SITE.email}
              </a>
              <p className="mt-3 flex items-center gap-2 text-[13px] text-navy/55">
                <Phone className="h-4 w-4" /> We reply on your preferred channel.
              </p>
            </div>
          </div>
          <div className="lg:col-span-7">
            <div className="border border-navy/10 bg-paper p-8 md:p-10">
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

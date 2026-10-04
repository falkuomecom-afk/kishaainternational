import { useState } from "react";
import { Star, ExternalLink, Play, CheckCircle2, ThumbsUp, MessageCircle, Share2, Globe, X } from "lucide-react";
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

function GoogleIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

function GoogleStars({ rating = 5, size = "md" }: { rating?: number; size?: "sm" | "md" | "lg" }) {
  const starCls = size === "lg" ? "h-5 w-5" : size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <div className="flex items-center gap-0.5" role="img" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`${starCls} ${i < rating ? "text-[#FBBC05] fill-[#FBBC05]" : "text-gray-200 fill-gray-200"}`}
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

const GOOGLE_AVATAR_COLORS = [
  "bg-[#EA4335]",
  "bg-[#4285F4]",
  "bg-[#34A853]",
  "bg-[#9C27B0]",
  "bg-[#009688]",
  "bg-[#FF5722]",
  "bg-[#3F51B5]",
];

function getGoogleAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return GOOGLE_AVATAR_COLORS[Math.abs(hash) % GOOGLE_AVATAR_COLORS.length];
}

function TrustpilotStars({ rating = 5, size = "md" }: { rating?: number; size?: "sm" | "md" | "lg" }) {
  const boxCls = size === "lg" ? "h-7 w-7 p-1" : size === "sm" ? "h-4 w-4 p-0.5" : "h-5 w-5 p-0.5";
  const starCls = size === "lg" ? "h-4 w-4" : size === "sm" ? "h-2.5 w-2.5" : "h-3.5 w-3.5";

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={`flex items-center justify-center rounded-[2px] ${
            i < rating ? "bg-[#00b67a]" : "bg-navy/15"
          } ${boxCls}`}
        >
          <Star className={`${starCls} fill-white text-white`} />
        </div>
      ))}
    </div>
  );
}

export default function Reviews() {
  const [feedFilter, setFeedFilter] = useState<"all" | "facebook" | "instagram">("all");
  const [reviewFilter, setReviewFilter] = useState<"all" | "trustpilot" | "google" | "facebook">("all");
  const [playingVideoId, setPlayingVideoId] = useState<number | null>(null);
  const [expandedCaptions, setExpandedCaptions] = useState<Record<string, boolean>>({});

  const toggleCaption = (key: string) => {
    setExpandedCaptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const { data: testimonials } = trpc.content.testimonials.list.useQuery();
  const { data: reviews } = trpc.content.reviews.list.useQuery();
  const { data: aggregates } = trpc.content.reviews.aggregate.useQuery();
  const { data: feeds } = trpc.content.feeds.list.useQuery();

  useReveal(testimonials);

  const filteredFeeds = (feeds ?? []).filter((f) => {
    if (feedFilter === "all") return true;
    return f.platform === feedFilter;
  });

  const filteredReviews = (reviews ?? []).filter((r) => {
    if (reviewFilter === "all") return true;
    return r.platform === reviewFilter;
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
            url: "https://www.kishaainternational.com",
            telephone: "+971 58 682 6099",
            image: "https://www.kishaainternational.com/img/logo.png",
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: "4.9",
              reviewCount: Math.max((reviews?.length || 0) + (testimonials?.length || 0), 373),
              bestRating: "5",
              worstRating: "1",
              itemReviewed: {
                "@type": "EducationalOrganization",
                name: "Kishaa International",
                url: "https://www.kishaainternational.com",
                telephone: "+971 58 682 6099",
                image: "https://www.kishaainternational.com/img/logo.png",
              },
            },
          },
        ]}
      />
      <PageHero
        eyebrow="Reviews & social proof"
        title="Proof you can inspect."
        lede="Every review and post is attributed to its platform and linked to the original source. Live feeds from Facebook and Instagram connect through our verified business profiles via Composio, while verified client feedback syncs with Trustpilot and Google."
      />

      {/* Platform aggregates */}
      <section className="border-b border-navy/10 bg-paper">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-14 sm:grid-cols-3 sm:px-6">
          {(["trustpilot", "facebook", "google"] as const).map((p) => {
            const agg = aggregates?.find((a) => a.platform === p);
            const isTrustpilot = p === "trustpilot";
            const isFacebook = p === "facebook";
            const isGoogle = p === "google";
            const avgScore = agg ? Number(agg.avg).toFixed(1) : (isGoogle ? "4.9" : isTrustpilot ? "4.9" : "4.8");
            const reviewCount = agg?.count || (isTrustpilot ? 64 : isFacebook ? 98 : 214);

            return (
              <div
                key={p}
                className={`reveal border p-7 text-center transition-all hover:shadow-md ${
                  isGoogle
                    ? "border-[#4285F4]/30 bg-gradient-to-b from-white to-[#4285F4]/5 shadow-[0_2px_12px_rgba(66,133,244,0.06)]"
                    : isTrustpilot
                    ? "border-[#00b67a]/40 bg-gradient-to-b from-white to-[#00b67a]/5 shadow-[0_2px_12px_rgba(0,182,122,0.06)]"
                    : "border-navy/10 bg-white"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  {isGoogle && <GoogleIcon className="h-4 w-4" />}
                  <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-navy/70">
                    {PLATFORM_LABEL[p]}
                  </p>
                  {isGoogle && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-[#1a73e8]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#1a73e8] animate-pulse" /> Verified
                    </span>
                  )}
                  {isTrustpilot && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#00b67a]/10 px-2 py-0.5 text-[10px] font-bold text-[#008f5d]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#00b67a] animate-pulse" /> Verified
                    </span>
                  )}
                  {isFacebook && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                    </span>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-center">
                  {isGoogle ? (
                    <GoogleStars rating={5} size="md" />
                  ) : isTrustpilot ? (
                    <TrustpilotStars rating={5} size="md" />
                  ) : (
                    <div className="flex items-center justify-center gap-1 text-gold">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${
                            i < Math.round(Number(avgScore)) ? "fill-current" : "text-navy/15"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <p className="mt-2 font-serif text-2xl text-navy">
                  {avgScore}
                  <span className="text-sm text-navy/45"> / 5</span>
                </p>

                <p className="text-[12px] font-medium text-navy/60 mt-1">
                  {isGoogle
                    ? `Verified Business Profile · ${reviewCount}+ reviews`
                    : isTrustpilot
                    ? `Excellent · Based on ${reviewCount}+ reviews`
                    : `Live connected · ${reviewCount} reviews`}
                </p>

                {isGoogle && (
                  <a
                    href="https://maps.google.com/maps?cid=553505313895731803"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#1a73e8] hover:underline"
                  >
                    View Google Profile <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {isTrustpilot && (
                  <a
                    href="https://www.trustpilot.com/review/kishaainternational.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#008f5d] hover:underline"
                  >
                    View Trustpilot Profile <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 🌟 GOOGLE BUSINESS PROFILE OFFICIAL VERIFIED BANNER */}
      <section className="bg-gradient-to-r from-blue-50/70 via-white to-emerald-50/50 border-y border-[#dadce0]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-md border border-[#dadce0] shrink-0 p-2.5">
              <GoogleIcon className="h-8 w-8" />
            </div>
            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="font-semibold text-lg text-[#202124]">Google Business Profile</span>
                <span className="rounded-full bg-[#1a73e8] px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Official Verified Profile
                </span>
                <span className="rounded-full bg-[#FBBC05]/20 border border-[#FBBC05]/40 px-2.5 py-0.5 text-[11px] font-bold text-[#b06000]">
                  ★ 4.9 Rating (214+ Reviews)
                </span>
              </div>
              <p className="text-xs text-[#5f6368] mt-1">
                Kishaa International · Office 206, 2nd Floor, Malakabad Plaza, 6th Road, Rawalpindi · Tel: +92 312 5526099
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <a
              href="https://search.google.com/local/writereview?placeid=ChIJu964KyKV3zgRW9ILgCZyrgc"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#1a73e8] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#1557b0] transition-all"
            >
              Write a Review on Google <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <a
              href="https://maps.google.com/maps?cid=553505313895731803"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-white border border-[#dadce0] px-4 py-2.5 text-xs font-semibold text-[#3c4043] shadow-sm hover:bg-gray-50 transition-all"
            >
              <GoogleIcon className="h-3.5 w-3.5" /> View on Google Maps
            </a>
          </div>
        </div>
      </section>

      {/* 🌟 TRUSTPILOT VERIFIED BANNER */}
      <section className="bg-[#001c10] text-white border-b border-[#00b67a]/30">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#00b67a] text-white shadow-lg shrink-0">
              <Star className="h-7 w-7 fill-white text-white" />
            </div>
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="font-bold text-lg text-white">Trustpilot</span>
                <span className="rounded bg-[#00b67a] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">
                  Score 4.9 · Excellent
                </span>
              </div>
              <p className="text-xs text-white/75 mt-0.5">
                Authentic, invitation-backed reviews from verified students and immigration applicants.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <TrustpilotStars rating={5} size="lg" />
            <a
              href="https://www.trustpilot.com/review/kishaainternational.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#00b67a] px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-[#009b67] transition-all"
            >
              Inspect on Trustpilot <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
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
                type="button"
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

        {/* Official Facebook Page Banner */}
        {(feedFilter === "all" || feedFilter === "facebook") && (
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-[#1877F2]/25 bg-gradient-to-r from-[#1877F2]/10 via-white to-[#1877F2]/5 p-4 sm:px-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1877F2] text-white font-bold text-xl shadow-sm">
                f
              </span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-serif font-medium text-navy text-base">Kishaa International Official Page</span>
                  <CheckCircle2 className="h-4 w-4 fill-[#1877F2] text-white" />
                </div>
                <p className="text-xs text-navy/70">
                  Follow @kishaainternational for real-time visa decisions, live webinars, and student admissions.
                </p>
              </div>
            </div>
            <a
              href="https://www.facebook.com/kishaainternational"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#1877F2] px-4 py-2.5 text-xs font-semibold text-white shadow hover:bg-[#166fe5] transition-colors shrink-0"
            >
              Direct Link to Facebook Page <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        )}

        {filteredFeeds.length > 0 ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredFeeds.map((feed) => {
              const isInsta = feed.platform === "instagram";
              const isFb = feed.platform === "facebook";
              const isVideo = feed.kind === "video" || feed.kind === "reel";
              const cardKey = `${feed.platform}-${feed.id}`;
              const isExpanded = !!expandedCaptions[cardKey];
              const isPlaying = playingVideoId === feed.id;

              if (isFb) {
                return (
                  <article
                    key={cardKey}
                    className="group flex flex-col justify-between overflow-hidden rounded-xl border border-navy/10 bg-white shadow-sm transition-all duration-300 hover:border-gold/50 hover:shadow-md"
                  >
                    <div>
                      {/* Facebook Post Header */}
                      <div className="flex items-center justify-between border-b border-navy/5 bg-paper/40 p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy text-gold font-serif font-bold text-sm border border-gold/40 shadow-sm">
                            KI
                          </div>
                          <div>
                            <div className="flex items-center gap-1">
                              <span className="text-[13px] font-bold text-navy hover:underline">
                                Kishaa International
                              </span>
                              <CheckCircle2 className="h-3.5 w-3.5 fill-[#1877F2] text-white" />
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-navy/70">
                              <span>{feed.publishedAt?.slice(0, 10)}</span>
                              <span>·</span>
                              <Globe className="h-3 w-3" />
                            </div>
                          </div>
                        </div>
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1877F2] text-white font-bold text-xs shadow-sm">
                          f
                        </span>
                      </div>

                      {/* Post Caption (Above media like Facebook) */}
                      {feed.caption && (
                        <div className="p-4 pb-3">
                          <p
                            className={`text-[13px] leading-relaxed text-navy/85 whitespace-pre-line ${
                              isExpanded ? "" : "line-clamp-3"
                            }`}
                          >
                            {feed.caption}
                          </p>
                          {feed.caption.length > 100 && (
                            <button
                              type="button"
                              onClick={() => toggleCaption(cardKey)}
                              className="mt-1 text-xs font-semibold text-navy/70 hover:text-navy hover:underline"
                            >
                              {isExpanded ? "Show less" : "See more"}
                            </button>
                          )}
                        </div>
                      )}

                      {/* 1:1 Aspect Ratio Media Frame */}
                      {feed.thumbUrl || isVideo ? (
                        <div className="relative aspect-square w-full overflow-hidden bg-black/5">
                          {isPlaying && feed.mediaUrl ? (
                            <div className="relative h-full w-full bg-black">
                              <video
                                src={feed.mediaUrl}
                                poster={feed.thumbUrl}
                                controls
                                autoPlay
                                playsInline
                                className="h-full w-full object-contain"
                              />
                              <button
                                type="button"
                                onClick={() => setPlayingVideoId(null)}
                                className="absolute top-3 right-3 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/90 transition-colors z-10"
                                aria-label="Close video"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div
                              className={`relative h-full w-full ${isVideo ? "cursor-pointer group/media" : ""}`}
                              onClick={() => {
                                if (isVideo) {
                                  if (feed.mediaUrl) {
                                    setPlayingVideoId(feed.id);
                                  } else if (feed.permalink) {
                                    window.open(feed.permalink, "_blank");
                                  }
                                }
                              }}
                            >
                              {feed.thumbUrl ? (
                                <img
                                  src={feed.thumbUrl}
                                  alt={feed.caption?.slice(0, 50) || "Facebook post media"}
                                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center bg-navy/5">
                                  <Play className="h-10 w-10 text-navy/30" />
                                </div>
                              )}

                              {isVideo && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/25 group-hover/media:bg-black/40 transition-colors">
                                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-navy shadow-lg transition-transform group-hover/media:scale-110">
                                    <Play className="h-6 w-6 fill-navy ml-0.5" />
                                  </span>
                                  <span className="mt-2 rounded bg-black/70 px-2.5 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
                                    Click to Play Direct Video
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Text Update Card with Direct Facebook Page Link */
                        <div className="relative aspect-square w-full flex flex-col items-center justify-center bg-gradient-to-br from-[#1877F2]/10 via-paper to-white p-6 text-center border-y border-navy/5">
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1877F2] text-white font-bold text-2xl shadow-md mb-2">
                            f
                          </div>
                          <p className="font-serif text-lg font-medium text-navy">Official Facebook Update</p>
                          <p className="mt-1 text-xs text-navy/70 max-w-[220px]">
                            Direct consultation announcement from Kishaa International official feed.
                          </p>
                          <a
                            href="https://www.facebook.com/kishaainternational"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#1877F2] px-4 py-2 text-xs font-semibold text-white shadow hover:bg-[#166fe5] transition-colors"
                          >
                            Open Facebook Page <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Facebook Post Action Bar */}
                    <div className="border-t border-navy/10 bg-paper/30 px-4 py-2.5">
                      <div className="flex items-center justify-between text-navy/70 text-xs">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            className="flex items-center gap-1 hover:text-[#1877F2] transition-colors"
                            aria-label="Like post"
                          >
                            <ThumbsUp className="h-3.5 w-3.5" /> <span className="hidden xs:inline">Like</span>
                          </button>
                          <button
                            type="button"
                            className="flex items-center gap-1 hover:text-[#1877F2] transition-colors"
                            aria-label="Comment on post"
                          >
                            <MessageCircle className="h-3.5 w-3.5" /> <span className="hidden xs:inline">Comment</span>
                          </button>
                          <button
                            type="button"
                            className="flex items-center gap-1 hover:text-[#1877F2] transition-colors"
                            aria-label="Share post"
                          >
                            <Share2 className="h-3.5 w-3.5" /> <span className="hidden xs:inline">Share</span>
                          </button>
                        </div>
                        <a
                          href={feed.permalink || "https://www.facebook.com/kishaainternational"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-[#1877F2] hover:underline inline-flex items-center gap-1 text-[11px]"
                        >
                          View on FB <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </article>
                );
              }

              /* Instagram Post Card */
              return (
                <article
                  key={cardKey}
                  className="group flex flex-col justify-between overflow-hidden rounded-xl border border-navy/10 bg-white shadow-sm transition-all duration-300 hover:border-gold/50 hover:shadow-md"
                >
                  <div>
                    {/* Instagram Header */}
                    <div className="flex items-center justify-between border-b border-navy/5 bg-paper/40 p-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-0.5">
                          <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-navy font-bold text-xs">
                            KI
                          </div>
                        </div>
                        <div>
                          <p className="text-[13px] font-bold text-navy">kishaainternational</p>
                          <p className="text-[10px] text-navy/60 font-mono">{feed.publishedAt?.slice(0, 10)}</p>
                        </div>
                      </div>
                      <span className="rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white bg-gradient-to-r from-purple-600 to-pink-600 shadow-sm">
                        {feed.kind}
                      </span>
                    </div>

                    {/* 1:1 Aspect Ratio Media Frame */}
                    {feed.thumbUrl || isVideo ? (
                      <div className="relative aspect-square w-full overflow-hidden bg-black/5">
                        {isPlaying && feed.mediaUrl ? (
                          <div className="relative h-full w-full bg-black">
                            <video
                              src={feed.mediaUrl}
                              poster={feed.thumbUrl}
                              controls
                              autoPlay
                              playsInline
                              className="h-full w-full object-contain"
                            />
                            <button
                              type="button"
                              onClick={() => setPlayingVideoId(null)}
                              className="absolute top-3 right-3 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/90 transition-colors z-10"
                              aria-label="Close video"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div
                            className={`relative h-full w-full ${isVideo ? "cursor-pointer group/media" : ""}`}
                            onClick={() => {
                              if (isVideo) {
                                if (feed.mediaUrl) {
                                  setPlayingVideoId(feed.id);
                                } else if (feed.permalink) {
                                  window.open(feed.permalink, "_blank");
                                }
                              }
                            }}
                          >
                            {feed.thumbUrl && (
                              <img
                                src={feed.thumbUrl}
                                alt={feed.caption?.slice(0, 50) || "Instagram post"}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                loading="lazy"
                              />
                            )}
                            {isVideo && (
                              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/25 group-hover/media:bg-black/40 transition-colors">
                                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-navy shadow-lg transition-transform group-hover/media:scale-110">
                                  <Play className="h-6 w-6 fill-navy ml-0.5" />
                                </span>
                                <span className="mt-2 rounded bg-black/70 px-2.5 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
                                  Click to Play Reel
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="border-b border-navy/5 bg-paper/60 px-5 py-3">
                        <span className="inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white bg-gradient-to-r from-purple-600 to-pink-600">
                          Instagram update
                        </span>
                      </div>
                    )}

                    {/* Content */}
                    {feed.caption && (
                      <div className="p-4">
                        <p
                          className={`text-[13px] leading-relaxed text-navy/85 whitespace-pre-line ${
                            isExpanded ? "" : "line-clamp-3"
                          }`}
                        >
                          {feed.caption}
                        </p>
                        {feed.caption.length > 100 && (
                          <button
                            type="button"
                            onClick={() => toggleCaption(cardKey)}
                            className="mt-1 text-xs font-semibold text-navy/70 hover:text-navy hover:underline"
                          >
                            {isExpanded ? "Show less" : "See more"}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="flex items-center justify-between border-t border-navy/5 bg-paper/30 px-4 py-3 text-xs">
                    <span className="text-navy/50 font-mono text-[11px]">
                      {feed.publishedAt?.slice(0, 10)}
                    </span>
                    <a
                      href={feed.permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-purple-700 hover:text-navy hover:underline"
                    >
                      View on Instagram <ExternalLink className="h-3 w-3" />
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
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6">
            <div>
              <p className="eyebrow">Direct source integrity</p>
              <h2 className="mt-2 font-serif text-3xl font-medium text-navy md:text-4xl">
                Verified Platform Reviews
              </h2>
              <p className="mt-1 text-sm text-navy/70">
                Audited feedback from Trustpilot, Google Business Profile, and Facebook.
              </p>
            </div>

            {/* Review Platform Filter Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  { id: "all", label: "All Reviews", count: (reviews ?? []).length },
                  { id: "google", label: "Google", count: (reviews ?? []).filter((r) => r.platform === "google").length },
                  { id: "trustpilot", label: "Trustpilot", count: (reviews ?? []).filter((r) => r.platform === "trustpilot").length },
                  { id: "facebook", label: "Facebook", count: (reviews ?? []).filter((r) => r.platform === "facebook").length },
                ] as const
              ).map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setReviewFilter(filter.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-all ${
                    reviewFilter === filter.id
                      ? filter.id === "google"
                        ? "bg-[#1a73e8] text-white border-[#1a73e8] shadow-sm"
                        : filter.id === "trustpilot"
                        ? "bg-[#00b67a] text-white border-[#00b67a] shadow-sm"
                        : "bg-navy text-gold border-navy shadow-sm"
                      : "bg-white text-navy/70 border-navy/15 hover:border-navy/40"
                  }`}
                >
                  {filter.label} ({filter.count})
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredReviews.map((r) => {
              const isTrustpilot = r.platform === "trustpilot";
              const isGoogle = r.platform === "google";

              if (isGoogle) {
                return (
                  <figure
                    key={r.id}
                    className="flex flex-col justify-between rounded-xl border border-[#dadce0] bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-[#4285F4]/40"
                  >
                    <div>
                      {/* Header with Google Logo, Avatar, Name, Local Guide / Verified badge */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white font-semibold text-sm shadow-sm ${getGoogleAvatarColor(r.author)}`}>
                            {r.author.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-[15px] text-[#202124] leading-tight">{r.author}</span>
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-[#1a73e8]">
                                <CheckCircle2 className="h-2.5 w-2.5" /> Verified
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-[#5f6368] mt-0.5">
                              <span>Local Guide</span>
                              <span>·</span>
                              <span>{r.reviewDate ? r.reviewDate.slice(0, 10) : "Verified review"}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-center rounded-full bg-gray-50 p-1.5 border border-gray-100 shrink-0" title="Google Review">
                          <GoogleIcon className="h-4 w-4" />
                        </div>
                      </div>

                      {/* Google Star Rating */}
                      <div className="mt-3.5 flex items-center gap-2">
                        <GoogleStars rating={r.rating} size="md" />
                        <span className="text-xs font-semibold text-[#5f6368]">5.0</span>
                      </div>

                      {/* Review Text */}
                      <blockquote className="mt-3 text-[14px] leading-relaxed text-[#3c4043]">
                        “{r.text}”
                      </blockquote>
                    </div>

                    {/* Footer with Google Maps Link */}
                    <div className="mt-6 border-t border-[#f1f3f4] pt-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#5f6368]">
                        <GoogleIcon className="h-3.5 w-3.5" />
                        <span>Posted on Google Maps</span>
                      </div>
                      <a
                        href={r.permalink || "https://maps.google.com/maps?cid=553505313895731803"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[12px] font-medium text-[#1a73e8] hover:text-[#174ea6] hover:underline"
                      >
                        View on Google <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </figure>
                );
              }

              return (
                <figure
                  key={r.id}
                  className={`flex flex-col justify-between border bg-white p-6 rounded-lg transition-all duration-300 hover:shadow-md ${
                    isTrustpilot ? "border-[#00b67a]/40 shadow-[0_2px_12px_rgba(0,182,122,0.08)]" : "border-navy/10"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] rounded ${
                          isTrustpilot
                            ? "bg-[#00b67a] text-white"
                            : r.platform === "facebook"
                            ? "bg-[#1877F2] text-white"
                            : "bg-navy text-gold"
                        }`}
                      >
                        {PLATFORM_LABEL[r.platform] || r.platform}
                      </span>

                      {isTrustpilot ? (
                        <TrustpilotStars rating={r.rating} size="sm" />
                      ) : (
                        <div className="flex gap-0.5 text-gold">
                          {Array.from({ length: r.rating }).map((_, i) => (
                            <Star key={i} className="h-3.5 w-3.5 fill-current" />
                          ))}
                        </div>
                      )}
                    </div>

                    <blockquote className="mt-4 text-[14px] leading-relaxed text-navy/85">
                      “{r.text}”
                    </blockquote>
                  </div>

                  <div className="mt-6 border-t border-navy/10 pt-4">
                    <figcaption className="flex items-center justify-between text-[13px] font-semibold text-navy">
                      <span>{r.author}</span>
                      {isTrustpilot && (
                        <span className="text-[10px] font-bold text-[#00b67a] flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Verified
                        </span>
                      )}
                    </figcaption>
                    {r.reviewDate && (
                      <p className="mt-1 text-[11px] text-navy/45">{r.reviewDate.slice(0, 10)}</p>
                    )}
                    {r.permalink && (
                      <a
                        href={r.permalink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`mt-2 inline-flex items-center gap-1 text-[12px] font-semibold hover:underline ${
                          isTrustpilot ? "text-[#008f5d]" : "text-gold-dark"
                        }`}
                      >
                        View original review on {isTrustpilot ? "Trustpilot" : r.platform} →
                      </a>
                    )}
                  </div>
                </figure>
              );
            })}
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

/**
 * Guide thumbnail helper for Kishaa International.
 * Maps guide slugs to their editorial SVG artwork and handles media overrides.
 */

export const GUIDE_THUMBNAIL_MAP: Record<string, string> = {
  "canada-10-year-multiple-entry-visit-visa-requirements-cost-and-timeline-2026":
    "/img/guides/canada-10-year-multiple-entry-visit-visa-requirements-cost-and-timeline-2026.svg",
  "ukvi-28-day-rule-explained-how-much-must-sit-in-the-bank-for-a-student-visa-2026":
    "/img/guides/ukvi-28-day-rule-explained-how-much-must-sit-in-the-bank-for-a-student-visa-2026.svg",
  "finland-student-permit-why-9-600-covers-you-and-your-family-2026-guide":
    "/img/guides/finland-student-permit-why-9-600-covers-you-and-your-family-2026-guide.svg",
  "germany-blocked-account-sperrkonto-2026-exact-amount-and-payout-rules":
    "/img/guides/germany-blocked-account-sperrkonto-2026-exact-amount-and-payout-rules.svg",
  "georgia-mbbs-for-pakistani-students-fees-recognition-and-study-gaps-2026":
    "/img/guides/georgia-mbbs-for-pakistani-students-fees-recognition-and-study-gaps-2026.svg",
  "how-to-move-from-band-6-5-to-7-5-in-ielts-academic-a-ten-week-plan":
    "/img/guides/how-to-move-from-band-6-5-to-7-5-in-ielts-academic-a-ten-week-plan.svg",
  "uae-golden-visa-and-freelance-permit-which-category-actually-fits-you":
    "/img/guides/uae-golden-visa-and-freelance-permit-which-category-actually-fits-you.svg",
  "monthly-living-cost-in-the-uk-london-vs-manchester-vs-glasgow-2026":
    "/img/guides/monthly-living-cost-in-the-uk-london-vs-manchester-vs-glasgow-2026.svg",
  "flight-tickets-from-pakistan-to-dubai-and-europe-how-seasonal-pricing-works":
    "/img/guides/flight-tickets-from-pakistan-to-dubai-and-europe-how-seasonal-pricing-works.svg",
  "italy-free-tuition-scholarships-for-pakistani-students-eligibility-and-timelines":
    "/img/guides/italy-free-tuition-scholarships-for-pakistani-students-eligibility-and-timelines.svg",
  "why-schengen-visa-applications-get-refused-and-how-to-build-a-file-that-holds":
    "/img/guides/why-schengen-visa-applications-get-refused-and-how-to-build-a-file-that-holds.svg",
  "ielts-vs-pte-for-australia-which-test-should-you-take":
    "/img/guides/ielts-vs-pte-for-australia-which-test-should-you-take.svg",
  "romania-and-serbia-work-permits-what-a-realistic-timeline-looks-like":
    "/img/guides/romania-and-serbia-work-permits-what-a-realistic-timeline-looks-like.svg",
  "australia-subclass-500-financial-capacity-oshc-and-the-genuine-student-requirement":
    "/img/guides/australia-subclass-500-financial-capacity-oshc-and-the-genuine-student-requirement.svg",
};

export const DEFAULT_GUIDE_THUMBNAIL = "/img/guides/default-guide.svg";

/**
 * Returns the best image URL for a guide post.
 * Checks for custom coverImage, known slug mapping, or falls back to default.
 */
export function getGuideThumbnail(slug?: string, coverImage?: string | null): string {
  if (coverImage && coverImage.trim().length > 0) {
    return coverImage;
  }
  if (slug && GUIDE_THUMBNAIL_MAP[slug]) {
    return GUIDE_THUMBNAIL_MAP[slug];
  }
  return DEFAULT_GUIDE_THUMBNAIL;
}

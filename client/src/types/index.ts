// Shared DB-entity types for the frontend (mirror of tRPC outputs).
export type Program = {
  id: number;
  name: string;
  slug: string;
  pillar: "career" | "immigration" | "cambridge";
  summary: string | null;
  description: string | null;
  audience: string | null;
  delivery: string | null;
  duration: string | null;
  fees: string | null;
  currency: string | null;
  location: string | null;
  highlights: string | null;
  featured: boolean;
  sortOrder: number;
  status: "draft" | "published" | "archived";
};

export type Country = {
  id: number;
  name: string;
  slug: string;
  region: string;
  flag: string | null;
  summary: string | null;
  visaInfo: string | null;
  tuitionInfo: string | null;
  livingCosts: string | null;
  fundsRule: string | null;
  flightGuide: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  featured: boolean;
  sortOrder: number;
  status: "draft" | "published" | "archived";
};

export type Testimonial = {
  id: number;
  quote: string;
  authorName: string;
  context: string | null;
  program: string | null;
  country: string | null;
  rating: number;
  source: "google" | "facebook" | "trustpilot" | "direct";
};

export type Faq = {
  id: number;
  question: string;
  answer: string;
  category: string | null;
  sortOrder: number | null;
};

export type TeamMember = {
  id: number;
  name: string;
  slug: string;
  role: string;
  bio: string | null;
  credentials: string | null;
  expertise: string | null;
  languages: string | null;
  email: string | null;
  phone: string | null;
  featured: boolean;
};

export type Post = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string | null;
  category: string | null;
  tags: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  publishedAt: Date | null;
};

export type Review = {
  id: number;
  platform: "google" | "facebook" | "trustpilot";
  author: string;
  rating: number;
  text: string | null;
  reviewDate: string | null;
  permalink: string | null;
};

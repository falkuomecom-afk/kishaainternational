import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  int,
  boolean,
  timestamp,
  bigint,
  uniqueIndex,
  index,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/* ---------------------------------- CMS ---------------------------------- */

export const pages = mysqlTable(
  "pages",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    excerpt: text("excerpt"),
    body: text("body"),
    seoTitle: varchar("seoTitle", { length: 255 }),
    seoDescription: text("seoDescription"),
    status: mysqlEnum("status", ["draft", "published", "archived"])
      .default("draft")
      .notNull(),
    publishedAt: timestamp("publishedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("pages_status_idx").on(t.status)],
);

export const posts = mysqlTable(
  "posts",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    excerpt: text("excerpt"),
    body: text("body"),
    category: varchar("category", { length: 120 }).default("Guides"),
    tags: varchar("tags", { length: 500 }),
    seoTitle: varchar("seoTitle", { length: 255 }),
    seoDescription: text("seoDescription"),
    status: mysqlEnum("status", ["draft", "published", "archived"])
      .default("draft")
      .notNull(),
    publishedAt: timestamp("publishedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("posts_status_idx").on(t.status)],
);

export const programs = mysqlTable(
  "programs",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    pillar: mysqlEnum("pillar", ["career", "immigration", "cambridge"])
      .notNull(),
    summary: text("summary"),
    description: text("description"),
    audience: text("audience"),
    delivery: varchar("delivery", { length: 255 }),
    duration: varchar("duration", { length: 255 }),
    fees: varchar("fees", { length: 255 }),
    currency: varchar("currency", { length: 8 }),
    location: varchar("location", { length: 255 }),
    highlights: text("highlights"), // newline separated
    featured: boolean("featured").default(false).notNull(),
    sortOrder: int("sortOrder").default(0).notNull(),
    status: mysqlEnum("status", ["draft", "published", "archived"])
      .default("published")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("programs_pillar_idx").on(t.pillar, t.status)],
);

export const teamMembers = mysqlTable("team_members", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  role: varchar("role", { length: 255 }).notNull(),
  bio: text("bio"),
  credentials: text("credentials"), // newline separated
  expertise: text("expertise"), // newline separated
  languages: varchar("languages", { length: 255 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 64 }),
  featured: boolean("featured").default(false).notNull(),
  status: mysqlEnum("status", ["draft", "published", "archived"])
    .default("published")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const testimonials = mysqlTable("testimonials", {
  id: serial("id").primaryKey(),
  quote: text("quote").notNull(),
  authorName: varchar("authorName", { length: 255 }).notNull(),
  context: varchar("context", { length: 255 }),
  program: varchar("program", { length: 255 }),
  country: varchar("country", { length: 120 }),
  rating: int("rating").default(5).notNull(),
  source: mysqlEnum("source", [
    "google",
    "facebook",
    "trustpilot",
    "direct",
  ])
    .default("direct")
    .notNull(),
  status: mysqlEnum("status", ["draft", "published", "archived"])
    .default("published")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const faqs = mysqlTable("faqs", {
  id: serial("id").primaryKey(),
  question: varchar("question", { length: 500 }).notNull(),
  answer: text("answer").notNull(),
  category: varchar("category", { length: 120 }).default("General"),
  sortOrder: int("sortOrder").default(0).notNull(),
  status: mysqlEnum("status", ["draft", "published", "archived"])
    .default("published")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const countries = mysqlTable(
  "countries",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    slug: varchar("slug", { length: 120 }).notNull().unique(),
    region: varchar("region", { length: 120 }).notNull(),
    flag: varchar("flag", { length: 16 }),
    summary: text("summary"),
    visaInfo: text("visaInfo"),
    tuitionInfo: text("tuitionInfo"),
    // JSON: { currency, budget, standard, comfortable, note }
    livingCosts: text("livingCosts"),
    // JSON: { amount, currency, months, holderRule, note, sourceUrl, effectiveDate }
    fundsRule: text("fundsRule"),
    // JSON: [{ from, priceMin, priceMax, currency, airlineNote }]
    flightGuide: text("flightGuide"),
    seoTitle: varchar("seoTitle", { length: 255 }),
    seoDescription: text("seoDescription"),
    featured: boolean("featured").default(false).notNull(),
    sortOrder: int("sortOrder").default(0).notNull(),
    status: mysqlEnum("status", ["draft", "published", "archived"])
      .default("published")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("countries_region_idx").on(t.region, t.status)],
);

/* ---------------------------------- Leads --------------------------------- */

export const leads = mysqlTable(
  "leads",
  {
    id: serial("id").primaryKey(),
    ref: varchar("ref", { length: 32 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 64 }),
    email: varchar("email", { length: 320 }),
    interest: varchar("interest", { length: 120 }).notNull(),
    contactPref: mysqlEnum("contactPref", ["phone", "whatsapp", "email"])
      .default("whatsapp")
      .notNull(),
    message: text("message"),
    country: varchar("country", { length: 120 }),
    program: varchar("program", { length: 255 }),
    source: varchar("source", { length: 120 }).default("Website"),
    page: varchar("page", { length: 255 }),
    stage: mysqlEnum("stage", [
      "new",
      "contacted",
      "qualified",
      "consultation",
      "enrolled",
      "closed",
    ])
      .default("new")
      .notNull(),
    closeReason: varchar("closeReason", { length: 255 }),
    ownerId: bigint("ownerId", { mode: "number", unsigned: true }),
    nextFollowUp: timestamp("nextFollowUp"),
    consentNotice: boolean("consentNotice").default(false).notNull(),
    marketingConsent: boolean("marketingConsent").default(false).notNull(),
    idempotencyKey: varchar("idempotencyKey", { length: 64 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("leads_idem_idx").on(t.idempotencyKey),
    index("leads_stage_idx").on(t.stage),
  ],
);

export const leadActivities = mysqlTable(
  "lead_activities",
  {
    id: serial("id").primaryKey(),
    leadId: bigint("leadId", { mode: "number", unsigned: true }).notNull(),
    actor: varchar("actor", { length: 255 }),
    type: varchar("type", { length: 64 }).notNull(),
    note: text("note"),
    priorStage: varchar("priorStage", { length: 32 }),
    newStage: varchar("newStage", { length: 32 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => [index("lead_act_lead_idx").on(t.leadId)],
);

/* ------------------------------ Reviews cache ----------------------------- */

export const reviews = mysqlTable("reviews", {
  id: serial("id").primaryKey(),
  platform: mysqlEnum("platform", ["google", "facebook", "trustpilot"])
    .notNull(),
  author: varchar("author", { length: 255 }).notNull(),
  rating: int("rating").default(5).notNull(),
  text: text("text"),
  reviewDate: varchar("reviewDate", { length: 32 }),
  permalink: varchar("permalink", { length: 500 }),
  visible: boolean("visible").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/* ------------------------------ Site controls ----------------------------- */

export const redirects = mysqlTable("redirects", {
  id: serial("id").primaryKey(),
  oldPath: varchar("oldPath", { length: 500 }).notNull().unique(),
  newPath: varchar("newPath", { length: 500 }).notNull(),
  type: int("type").default(301).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const settings = mysqlTable("settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 120 }).notNull().unique(),
  value: text("value"),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Lead = typeof leads.$inferSelect;
export type Program = typeof programs.$inferSelect;
export type Country = typeof countries.$inferSelect;
export type TeamMember = typeof teamMembers.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Page = typeof pages.$inferSelect;
export type Testimonial = typeof testimonials.$inferSelect;
export type Faq = typeof faqs.$inferSelect;
export type Review = typeof reviews.$inferSelect;

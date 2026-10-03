import { z } from "zod";
import { eq, desc, and, sql } from "drizzle-orm";
import { createRouter, publicQuery, adminQuery } from "../middleware";
import { getDb } from "../queries/connection";
import * as s from "@db/schema";

const statusEnum = z.enum(["draft", "published", "archived"]);

/* ------------------------------- inputs ---------------------------------- */

const pageInput = z.object({
  title: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  excerpt: z.string().optional(),
  body: z.string().optional(),
  seoTitle: z.string().max(255).optional(),
  seoDescription: z.string().optional(),
  status: statusEnum.default("draft"),
});

const postInput = pageInput.extend({
  category: z.string().max(120).default("Guides"),
  tags: z.string().max(500).optional(),
});

const programInput = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  pillar: z.enum(["career", "immigration", "cambridge"]),
  summary: z.string().optional(),
  description: z.string().optional(),
  audience: z.string().optional(),
  delivery: z.string().max(255).optional(),
  duration: z.string().max(255).optional(),
  fees: z.string().max(255).optional(),
  currency: z.string().max(8).optional(),
  location: z.string().max(255).optional(),
  highlights: z.string().optional(),
  featured: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  status: statusEnum.default("published"),
});

const teamInput = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  role: z.string().min(1).max(255),
  bio: z.string().optional(),
  credentials: z.string().optional(),
  expertise: z.string().optional(),
  languages: z.string().max(255).optional(),
  email: z.string().max(320).optional(),
  phone: z.string().max(64).optional(),
  featured: z.boolean().default(false),
  status: statusEnum.default("published"),
});

const testimonialInput = z.object({
  quote: z.string().min(1),
  authorName: z.string().min(1).max(255),
  context: z.string().max(255).optional(),
  program: z.string().max(255).optional(),
  country: z.string().max(120).optional(),
  rating: z.number().int().min(1).max(5).default(5),
  source: z.enum(["google", "facebook", "trustpilot", "direct"]).default("direct"),
  status: statusEnum.default("published"),
});

const faqInput = z.object({
  question: z.string().min(1).max(500),
  answer: z.string().min(1),
  category: z.string().max(120).default("General"),
  sortOrder: z.number().int().default(0),
  status: statusEnum.default("published"),
});

const countryInput = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(120),
  region: z.string().min(1).max(120),
  flag: z.string().max(16).optional(),
  summary: z.string().optional(),
  visaInfo: z.string().optional(),
  tuitionInfo: z.string().optional(),
  livingCosts: z.string().optional(),
  fundsRule: z.string().optional(),
  flightGuide: z.string().optional(),
  seoTitle: z.string().max(255).optional(),
  seoDescription: z.string().optional(),
  featured: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  status: statusEnum.default("published"),
});

const reviewInput = z.object({
  platform: z.enum(["google", "facebook", "trustpilot"]),
  author: z.string().min(1).max(255),
  rating: z.number().int().min(1).max(5).default(5),
  text: z.string().optional(),
  reviewDate: z.string().max(32).optional(),
  permalink: z.string().max(500).optional(),
  visible: z.boolean().default(true),
});

const redirectInput = z.object({
  oldPath: z.string().min(1).max(500),
  newPath: z.string().min(1).max(500),
  type: z.number().int().default(301),
});

const settingInput = z.object({
  key: z.string().min(1).max(120),
  value: z.string().optional(),
});

/* --------------------------- generic CRUD helper -------------------------- */

function crud<T extends z.ZodObject<z.ZodRawShape>>(
  table: any,
  schema: T,
  orderCol?: any,
) {
  return createRouter({
    list: adminQuery.query(async () => {
      const q = getDb().select().from(table);
      const rows = orderCol
        ? await q.orderBy(orderCol)
        : await q.orderBy(desc(table.id));
      return rows;
    }),
    create: adminQuery.input(schema).mutation(async ({ input }) => {
      const data: Record<string, unknown> = { ...input };
      if ("status" in data && data.status === "published" && "publishedAt" in table)
        data.publishedAt = new Date();
      const r = await getDb().insert(table).values(data);
      return { id: Number(r[0].insertId) };
    }),
    update: adminQuery
      .input(z.object({ id: z.number() }).and(schema.partial()))
      .mutation(async ({ input }) => {
        const { id, ...data } = input as { id: number } & Record<string, unknown>;
        await getDb().update(table).set(data).where(eq(table.id, id));
        return { ok: true };
      }),
    remove: adminQuery
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await getDb().delete(table).where(eq(table.id, input.id));
        return { ok: true };
      }),
  });
}

/* --------------------------------- router --------------------------------- */

export const contentRouter = createRouter({
  /* ------------------------------ public reads ---------------------------- */
  pages: createRouter({
    bySlug: publicQuery
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const rows = await getDb()
          .select()
          .from(s.pages)
          .where(and(eq(s.pages.slug, input.slug), eq(s.pages.status, "published")))
          .limit(1);
        return rows.at(0) ?? null;
      }),
  }),
  posts: createRouter({
    list: publicQuery.query(async () => {
      return getDb()
        .select()
        .from(s.posts)
        .where(eq(s.posts.status, "published"))
        .orderBy(desc(s.posts.publishedAt));
    }),
    bySlug: publicQuery
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const rows = await getDb()
          .select()
          .from(s.posts)
          .where(and(eq(s.posts.slug, input.slug), eq(s.posts.status, "published")))
          .limit(1);
        const r = rows.at(0);
        if (!r) return null;
        return {
          ...r,
          readMinutes: 3,
          authorName: "Kishaa International",
          targetQuery: null as string | null,
          answerFirst: null as string | null,
          takeaways: [] as string[],
          tagsList: [] as string[],
          related: [] as { id: number; title: string; slug: string; excerpt?: string | null }[],
          faqs: [] as { id: number; question: string; answer: string }[],
          destinations: [] as { name: string; slug: string }[],
        };
      }),
  }),
  programs: createRouter({
    list: publicQuery
      .input(z.object({ pillar: z.string().optional() }).optional())
      .query(async ({ input }) => {
        const conds = [eq(s.programs.status, "published")];
        if (input?.pillar)
          conds.push(eq(s.programs.pillar, input.pillar as never));
        return getDb()
          .select()
          .from(s.programs)
          .where(and(...conds))
          .orderBy(s.programs.sortOrder, s.programs.id);
      }),
    featured: publicQuery.query(async () => {
      return getDb()
        .select()
        .from(s.programs)
        .where(and(eq(s.programs.status, "published"), eq(s.programs.featured, true)))
        .orderBy(s.programs.sortOrder);
    }),
  }),
  team: createRouter({
    list: publicQuery.query(async () => {
      return getDb()
        .select()
        .from(s.teamMembers)
        .where(eq(s.teamMembers.status, "published"));
    }),
    bySlug: publicQuery
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const rows = await getDb()
          .select()
          .from(s.teamMembers)
          .where(
            and(eq(s.teamMembers.slug, input.slug), eq(s.teamMembers.status, "published")),
          )
          .limit(1);
        return rows.at(0) ?? null;
      }),
  }),
  testimonials: createRouter({
    list: publicQuery.query(async () => {
      return getDb()
        .select()
        .from(s.testimonials)
        .where(eq(s.testimonials.status, "published"))
        .orderBy(desc(s.testimonials.id));
    }),
  }),
  faqs: createRouter({
    list: publicQuery
      .input(z.object({ category: z.string().optional() }).optional())
      .query(async ({ input }) => {
        const conds = [eq(s.faqs.status, "published")];
        if (input?.category) conds.push(eq(s.faqs.category, input.category));
        return getDb()
          .select()
          .from(s.faqs)
          .where(and(...conds))
          .orderBy(s.faqs.sortOrder, s.faqs.id);
      }),
  }),
  countries: createRouter({
    list: publicQuery.query(async () => {
      return getDb()
        .select()
        .from(s.countries)
        .where(eq(s.countries.status, "published"))
        .orderBy(s.countries.sortOrder, s.countries.name);
    }),
    bySlug: publicQuery
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const rows = await getDb()
          .select()
          .from(s.countries)
          .where(
            and(eq(s.countries.slug, input.slug), eq(s.countries.status, "published")),
          )
          .limit(1);
        return rows.at(0) ?? null;
      }),
  }),
  reviews: createRouter({
    list: publicQuery.query(async () => {
      return getDb()
        .select()
        .from(s.reviews)
        .where(eq(s.reviews.visible, true))
        .orderBy(desc(s.reviews.id));
    }),
    aggregate: publicQuery.query(async () => {
      const rows = await getDb()
        .select({
          platform: s.reviews.platform,
          avg: sql<number>`avg(${s.reviews.rating})`,
          count: sql<number>`count(*)`,
        })
        .from(s.reviews)
        .where(eq(s.reviews.visible, true))
        .groupBy(s.reviews.platform);
      return rows;
    }),
  }),
  settings: createRouter({
    get: publicQuery.input(z.object({ key: z.string() })).query(async ({ input }) => {
      const rows = await getDb()
        .select()
        .from(s.settings)
        .where(eq(s.settings.key, input.key))
        .limit(1);
      return rows.at(0)?.value ?? null;
    }),
  }),
  redirects: createRouter({
    byPath: publicQuery
      .input(z.object({ path: z.string() }))
      .query(async ({ input }) => {
        const rows = await getDb()
          .select()
          .from(s.redirects)
          .where(eq(s.redirects.oldPath, input.path))
          .limit(1);
        return rows.at(0) ?? null;
      }),
  }),
  sitemapUrls: publicQuery.query(async () => {
    const [pgs, psts, progs, cts, team] = await Promise.all([
      getDb().select({ slug: s.pages.slug, updatedAt: s.pages.updatedAt }).from(s.pages).where(eq(s.pages.status, "published")),
      getDb().select({ slug: s.posts.slug, updatedAt: s.posts.updatedAt }).from(s.posts).where(eq(s.posts.status, "published")),
      getDb().select({ slug: s.programs.slug, pillar: s.programs.pillar }).from(s.programs).where(eq(s.programs.status, "published")),
      getDb().select({ slug: s.countries.slug, updatedAt: s.countries.updatedAt }).from(s.countries).where(eq(s.countries.status, "published")),
      getDb().select({ slug: s.teamMembers.slug }).from(s.teamMembers).where(eq(s.teamMembers.status, "published")),
    ]);
    return { pages: pgs, posts: psts, programs: progs, countries: cts, team };
  }),

  /* ------------------------------ admin CRUD ------------------------------ */
  admin: createRouter({
    pages: crud(s.pages, pageInput),
    posts: crud(s.posts, postInput),
    programs: crud(s.programs, programInput),
    team: crud(s.teamMembers, teamInput),
    testimonials: crud(s.testimonials, testimonialInput),
    faqs: crud(s.faqs, faqInput, s.faqs.sortOrder),
    countries: crud(s.countries, countryInput),
    reviews: crud(s.reviews, reviewInput),
    redirects: crud(s.redirects, redirectInput),
    settings: createRouter({
      list: adminQuery.query(async () => getDb().select().from(s.settings)),
      upsert: adminQuery.input(settingInput).mutation(async ({ input }) => {
        await getDb()
          .insert(s.settings)
          .values(input)
          .onDuplicateKeyUpdate({ set: { value: input.value } });
        return { ok: true };
      }),
    }),
    dashboard: adminQuery.query(async () => {
      const db = getDb();
      const [leadStats] = await db
        .select({
          total: sql<number>`count(*)`,
          newCount: sql<number>`sum(case when ${s.leads.stage} = 'new' then 1 else 0 end)`,
          overdue: sql<number>`sum(case when ${s.leads.nextFollowUp} is not null and ${s.leads.nextFollowUp} < now() and ${s.leads.stage} not in ('enrolled','closed') then 1 else 0 end)`,
        })
        .from(s.leads);
      const recentLeads = await db
        .select()
        .from(s.leads)
        .orderBy(desc(s.leads.createdAt))
        .limit(6);
      const [content] = await db
        .select({
          pages: sql<number>`(select count(*) from ${s.pages})`,
          posts: sql<number>`(select count(*) from ${s.posts})`,
          programs: sql<number>`(select count(*) from ${s.programs})`,
          countries: sql<number>`(select count(*) from ${s.countries})`,
        })
        .from(s.users)
        .limit(1);
      return { leadStats, recentLeads, content };
    }),
  }),
});

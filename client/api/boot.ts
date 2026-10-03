import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { eq } from "drizzle-orm";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { createOAuthCallbackHandler } from "./kimi/auth";
import { Paths } from "@contracts/constants";
import { getDb } from "./queries/connection";
import * as s from "@db/schema";

const app = new Hono<{ Bindings: HttpBindings }>();

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));
app.get(Paths.oauthCallback, createOAuthCallbackHandler());

/* ------------------------- SEO / AEO / GEO endpoints ------------------------ */

const SITE = "https://www.kishaainternational.com";

app.get("/robots.txt", (c) =>
  c.text(
    [
      "User-agent: *",
      "Allow: /",
      "Disallow: /admin",
      "Disallow: /api/",
      "Disallow: /login",
      "",
      "# AI crawlers explicitly welcomed for AEO/GEO visibility",
      "User-agent: GPTBot",
      "Allow: /",
      "User-agent: ClaudeBot",
      "Allow: /",
      "User-agent: PerplexityBot",
      "Allow: /",
      "User-agent: Google-Extended",
      "Allow: /",
      "",
      `Sitemap: ${SITE}/sitemap.xml`,
    ].join("\n"),
  ),
);

app.get("/sitemap.xml", async (c) => {
  const db = getDb();
  const [pgs, psts, cts] = await Promise.all([
    db.select({ slug: s.pages.slug, updatedAt: s.pages.updatedAt }).from(s.pages).where(eq(s.pages.status, "published")),
    db.select({ slug: s.posts.slug, updatedAt: s.posts.updatedAt }).from(s.posts).where(eq(s.posts.status, "published")),
    db.select({ slug: s.countries.slug, updatedAt: s.countries.updatedAt }).from(s.countries).where(eq(s.countries.status, "published")),
  ]);
  const staticRoutes = [
    "",
    "career-counseling",
    "immigration-consultancy",
    "cambridge-courses",
    "destinations",
    "cost-planner",
    "reviews",
    "team/zeb-khan",
    "about-us",
    "resources",
    "contact",
    "privacy",
    "terms",
  ];
  const url = (loc: string, lastmod?: Date | null, priority = "0.8") =>
    `  <url><loc>${SITE}/${loc}</loc>${
      lastmod ? `<lastmod>${lastmod.toISOString().slice(0, 10)}</lastmod>` : ""
    }<changefreq>weekly</changefreq><priority>${priority}</priority></url>`;
  const xml = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...staticRoutes.map((r) => url(r, null, r === "" ? "1.0" : "0.9")),
    ...pgs.map((p) => url(`p/${p.slug}`, p.updatedAt, "0.6")),
    ...psts.map((p) => url(`resources/${p.slug}`, p.updatedAt, "0.7")),
    ...cts.map((x) => url(`destinations/${x.slug}`, x.updatedAt, "0.8")),
    `</urlset>`,
  ].join("\n");
  return c.text(xml, 200, { "Content-Type": "application/xml" });
});

app.get("/llms.txt", (c) =>
  c.text(
    `# Kishaa International

> Gateway to Global Careers | One Company, Global Solutions. Career counseling, immigration consultancy, and Cambridge courses training with offices in Dubai, UAE (HQ) and Pakistan.

## About
Kishaa International provides career counseling, immigration consultancy (Canada 10-Year LOI visit visas, UAE Golden/Freelance visas, Turkey, Schengen), university admissions (UK 2027 MOI intake, Italy free tuition scholarships, Finland family/PR, Georgia MBBS), and Cambridge English / IELTS training led by Zeb Khan, Senior Consultant & Executive Trainer (MA English, MEd, PGD TEFL, Dip EPM, British Council Certified Trainer).

## Contact
- Dubai HQ: +971 58 682 6099
- Pakistan: +92 312 552 6099
- Email: kishaainternational@gmail.com
- Web: ${SITE}

## Key pages
- Career Counseling: ${SITE}/career-counseling
- Immigration Consultancy: ${SITE}/immigration-consultancy
- Cambridge Courses & IELTS: ${SITE}/cambridge-courses
- Destinations & Costs: ${SITE}/destinations
- Cost Planner: ${SITE}/cost-planner
- Reviews: ${SITE}/reviews
- Meet Zeb Khan: ${SITE}/team/zeb-khan
- Resources & FAQs: ${SITE}/resources
- Contact: ${SITE}/contact
`,
  ),
);

/* ----------------------------------- API ---------------------------------- */

app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});
app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

if (env.isProduction) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");
  serveStaticFiles(app);

  const port = parseInt(process.env.PORT || "3000");
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Navigate, Outlet, useLocation } from "react-router";
import { MessageCircle } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Analytics } from "@/components/site/Analytics";
import { waLink } from "@/lib/site";
import Home from "./pages/Home";

// Code-split secondary routes to shrink the initial JavaScript bundle
const CareerCounseling = lazy(() => import("./pages/CareerCounseling"));
const Immigration = lazy(() => import("./pages/Immigration"));
const Cambridge = lazy(() => import("./pages/Cambridge"));
const Destinations = lazy(() => import("./pages/Destinations"));
const DestinationDetail = lazy(() => import("./pages/DestinationDetail"));
const CostPlanner = lazy(() => import("./pages/CostPlanner"));
const Reviews = lazy(() => import("./pages/Reviews"));
const TeamZebKhan = lazy(() => import("./pages/TeamZebKhan"));
const About = lazy(() => import("./pages/About"));
const Resources = lazy(() => import("./pages/Resources"));
const ResourceDetail = lazy(() => import("./pages/ResourceDetail"));
const Contact = lazy(() => import("./pages/Contact"));
const BankStatements = lazy(() => import("./pages/BankStatements"));
const Privacy = lazy(() => import("./pages/Legal").then((m) => ({ default: m.Privacy })));
const Terms = lazy(() => import("./pages/Legal").then((m) => ({ default: m.Terms })));
const NotFound = lazy(() => import("./pages/NotFound"));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

/** Public site chrome: header, footer, floating WhatsApp conversion action. */
function SiteLayout() {
  return (
    <>
      <ScrollToTop />
      <Header />
      <main id="main">
        <Suspense
          fallback={
            <div className="flex min-h-[60vh] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <a
        href={waLink("Hello Kishaa International — I have a question.")}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed bottom-5 right-5 z-40 flex h-13 w-13 items-center justify-center rounded-full bg-[#25d366] p-3.5 text-white shadow-lg transition-transform hover:scale-105"
      >
        <MessageCircle className="h-6 w-6" />
      </a>
      <Analytics />
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/career-counseling" element={<CareerCounseling />} />
        <Route path="/immigration-consultancy" element={<Immigration />} />
        <Route path="/cambridge-courses" element={<Cambridge />} />
        <Route path="/destinations" element={<Destinations />} />
        <Route path="/destinations/:slug" element={<DestinationDetail />} />
        <Route path="/cost-planner" element={<CostPlanner />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/team/zeb-khan" element={<TeamZebKhan />} />
        <Route path="/about-us" element={<About />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/resources/:slug" element={<ResourceDetail />} />
        <Route path="/bank-statements" element={<BankStatements />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        {/* Legacy WordPress URLs — 301-equivalent one-hop redirects */}
        <Route path="/courses" element={<Navigate to="/cambridge-courses" replace />} />
        <Route path="/exam-help" element={<Navigate to="/cambridge-courses" replace />} />
        <Route path="/visa-consultancy" element={<Navigate to="/immigration-consultancy" replace />} />
        <Route path="/news-and-events" element={<Navigate to="/resources" replace />} />
        <Route path="/faq" element={<Navigate to="/resources" replace />} />
        <Route path="/about" element={<Navigate to="/about-us" replace />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route
        path="/login"
        element={<Navigate to="/admin" replace />}
      />
      <Route
        path="/admin/*"
        Component={() => {
          useEffect(() => {
            window.location.href = "/admin";
          }, []);
          return null;
        }}
      />
    </Routes>
  );
}

import { Routes, Route, Navigate, Outlet, useLocation } from "react-router";
import { useEffect } from "react";
import { MessageCircle } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { waLink } from "@/lib/site";
import Home from "./pages/Home";
import CareerCounseling from "./pages/CareerCounseling";
import Immigration from "./pages/Immigration";
import Cambridge from "./pages/Cambridge";
import Destinations from "./pages/Destinations";
import DestinationDetail from "./pages/DestinationDetail";
import CostPlanner from "./pages/CostPlanner";
import Reviews from "./pages/Reviews";
import TeamZebKhan from "./pages/TeamZebKhan";
import About from "./pages/About";
import Resources from "./pages/Resources";
import ResourceDetail from "./pages/ResourceDetail";
import Contact from "./pages/Contact";
import { Privacy, Terms } from "./pages/Legal";
import NotFound from "./pages/NotFound";

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
        <Outlet />
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

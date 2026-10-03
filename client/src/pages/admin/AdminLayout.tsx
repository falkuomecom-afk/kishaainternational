import { NavLink, Outlet, Link } from "react-router";
import {
  LayoutDashboard,
  Inbox,
  FileText,
  Newspaper,
  GraduationCap,
  Users,
  MessageSquareQuote,
  HelpCircle,
  Globe2,
  Star,
  ArrowLeftRight,
  Settings,
  LogOut,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/leads", label: "Leads", icon: Inbox },
  { to: "/admin/content/pages", label: "Pages", icon: FileText },
  { to: "/admin/content/posts", label: "Posts", icon: Newspaper },
  { to: "/admin/content/programs", label: "Programs", icon: GraduationCap },
  { to: "/admin/content/team", label: "Team", icon: Users },
  { to: "/admin/content/testimonials", label: "Testimonials", icon: MessageSquareQuote },
  { to: "/admin/content/faqs", label: "FAQs", icon: HelpCircle },
  { to: "/admin/content/countries", label: "Countries", icon: Globe2 },
  { to: "/admin/content/reviews", label: "Review Cache", icon: Star },
  { to: "/admin/content/redirects", label: "Redirects", icon: ArrowLeftRight },
  { to: "/admin/content/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout() {
  const { user, isLoading, logout } = useAuth({ redirectOnUnauthenticated: true });

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-navy/50">
        Loading workspace…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-paper">
      <aside className="fixed inset-y-0 flex w-60 flex-col bg-navy text-white">
        <div className="border-b border-white/10 px-5 py-5">
          <p className="font-serif text-lg font-medium">Kishaa CMS</p>
          <p className="mt-0.5 text-[11px] uppercase tracking-[0.16em] text-white/40">
            {user.name ?? "Staff"} · {user.role}
          </p>
        </div>
        <nav className="flex-1 overflow-y-auto py-3" aria-label="CMS">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-2.5 text-[13px] transition-colors ${
                  isActive
                    ? "border-r-2 border-gold bg-white/10 text-gold"
                    : "text-white/65 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <n.icon className="h-4 w-4" /> {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-white/10 p-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-[12px] text-white/50 hover:text-gold"
          >
            <ExternalLink className="h-3.5 w-3.5" /> View public site
          </Link>
          <button
            onClick={() => logout()}
            className="mt-2 flex items-center gap-2 text-[12px] text-white/50 hover:text-gold"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </aside>
      <main className="ml-60 flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}

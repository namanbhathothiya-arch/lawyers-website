import { useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  Briefcase,
  Calendar,
  CalendarOff,
  Clock,
  Info,
  LayoutDashboard,
  LogOut,
  Menu,
  CircleHelp,
  Scale,
  Users,
  UserCog,
  MessageSquareQuote,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const adminNav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/appointments", label: "Consultations", icon: Calendar },
  { to: "/admin/doctors", label: "Lawyers", icon: Users },
  { to: "/admin/service-sections", label: "Service Sections", icon: Briefcase },
  { to: "/admin/services", label: "Services", icon: Briefcase },
  { to: "/admin/availability", label: "Availability", icon: Clock },
  { to: "/admin/holidays", label: "Holidays", icon: CalendarOff },
  { to: "/admin/staff", label: "Staff", icon: UserCog },
  { to: "/admin/about-us", label: "About Us", icon: Info },
  { to: "/admin/testimonials", label: "Testimonials", icon: MessageSquareQuote },
  { to: "/admin/faqs", label: "FAQs", icon: CircleHelp },
] as const;

export function AdminPortalShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { user, role, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-[#070c14] text-slate-100 relative overflow-x-hidden">
      {/* Backdrop Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 md:hidden transition-opacity backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "w-64 border-r border-slate-800 bg-[#0b1220] flex flex-col transition-transform duration-300 ease-in-out z-50",
          "fixed inset-y-0 left-0 md:sticky md:top-0 md:h-screen md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="h-16 px-6 border-b border-slate-800 flex items-center gap-3">
          <span className="h-8 w-8 rounded-lg bg-blue-600 text-white grid place-items-center shadow-md">
            <Scale className="h-4.5 w-4.5" />
          </span>
          <span className="font-serif font-bold text-sm leading-tight text-white">Admin Console</span>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {adminNav.map((item) => {
            const isActive =
              item.to === "/admin"
                ? location.pathname === "/admin" || location.pathname === "/admin/"
                : location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "w-full flex items-center gap-3 px-3.5 py-3 md:py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-blue-600 text-white shadow-md font-semibold"
                    : "text-slate-400 hover:bg-slate-800/80 hover:text-white",
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 bg-[#080d17]">
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-950/30 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-y-auto min-w-0">
        <header className="h-16 px-4 md:px-8 border-b border-slate-800 bg-[#070c14]/90 backdrop-blur-md flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-10 h-10 flex items-center justify-center -ml-2 rounded-lg border border-slate-800 hover:bg-slate-800 md:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5 text-slate-200" />
            </button>
            <h2 className="font-serif font-bold text-lg text-white">{title}</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs px-3 py-1 rounded-full border border-blue-500/30 bg-blue-950/80 text-blue-400 font-semibold capitalize">
              {role}
            </span>
            <span className="text-xs text-slate-400 hidden sm:inline">{user?.email}</span>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}

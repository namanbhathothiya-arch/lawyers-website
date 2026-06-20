import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Calendar, Clock, LogOut, Menu, Search, Stethoscope } from "lucide-react";
import { StaffGuard } from "@/components/StaffGuard";
import { useAuth } from "@/hooks/use-auth";
import { AppointmentsManager } from "@/components/admin/AppointmentsManager";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/staff")({
  head: () => ({
    meta: [{ title: "Staff Portal — HeartCare Advanced Clinic" }],
  }),
  component: () => (
    <StaffGuard>
      <StaffPortal />
    </StaffGuard>
  ),
});

type StaffTab = "today" | "appointments" | "search";

const staffNav: Array<{
  id: StaffTab;
  label: string;
  icon: typeof Clock;
}> = [
  { id: "today", label: "Today", icon: Clock },
  { id: "appointments", label: "Appointments", icon: Calendar },
  { id: "search", label: "Search Patients", icon: Search },
];

function StaffPortal() {
  const [activeTab, setActiveTab] = useState<StaffTab>("today");
  const { user, role, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-secondary/10 text-foreground relative overflow-x-hidden">
      {/* Backdrop Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "w-64 border-r border-border bg-background flex flex-col transition-transform duration-300 ease-in-out z-50",
          "fixed inset-y-0 left-0 md:sticky md:top-0 md:h-screen md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="h-16 px-6 border-b border-border flex items-center gap-2">
          <span className="h-8 w-8 rounded-lg bg-primary text-primary-foreground grid place-items-center">
            <Stethoscope className="h-4.5 w-4.5" />
          </span>
          <span className="font-bold text-sm leading-tight tracking-tight">Reception Desk</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {staffNav.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setSidebarOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                activeTab === item.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-border bg-background">
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="h-16 px-4 md:px-8 border-b border-border bg-background/80 backdrop-blur flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-11 h-11 flex items-center justify-center -ml-2 rounded-md hover:bg-secondary/50 md:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="font-semibold text-lg">
              {activeTab === "today"
                ? "Today's Schedule"
                : activeTab === "search"
                  ? "Search Patients"
                  : "Upcoming Appointments"}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-full bg-primary/15 text-primary font-semibold capitalize">
              {role}
            </span>
            <span className="text-sm text-muted-foreground hidden sm:inline">{user?.email}</span>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-8 animate-fade-in">
          {activeTab === "today" && <AppointmentsManager view="today" role="staff" />}
          {activeTab === "appointments" && <AppointmentsManager view="upcoming" role="staff" />}
          {activeTab === "search" && <AppointmentsManager view="search" role="staff" />}
        </div>
      </main>
    </div>
  );
}

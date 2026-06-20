import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, Calendar, CircleHelp, Clock, Users } from "lucide-react";
import { AdminGuard } from "@/components/AdminGuard";
import { AdminPortalShell } from "@/components/admin/AdminPortalShell";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [{ title: "Admin Dashboard — HeartCare Advanced Clinic" }],
  }),
  component: () => (
    <AdminGuard>
      <AdminDashboard />
    </AdminGuard>
  ),
});

function AdminDashboard() {
  const { data: apptCount, isLoading: loadingAppts } = useQuery({
    queryKey: ["admin-count", "appointments"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: docCount, isLoading: loadingDocs } = useQuery({
    queryKey: ["admin-count", "doctors"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("doctors")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: svcCount, isLoading: loadingSvcs } = useQuery({
    queryKey: ["admin-count", "services"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("services")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: faqCount, isLoading: loadingFaqs } = useQuery({
    queryKey: ["admin-count", "faqs"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("faqs")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  return (
    <AdminPortalShell title="Dashboard">
      <div className="space-y-8">
        <div className="bg-primary text-primary-foreground p-8 rounded-2xl shadow-lg">
          <h3 className="text-2xl font-bold">Welcome back, Admin</h3>
          <p className="mt-2 text-primary-foreground/80 max-w-lg">
            Manage appointments, doctor-service assignments, weekly schedules, holidays, and clinic
            catalog settings.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardCard
            label="Total Appointments"
            count={apptCount}
            loading={loadingAppts}
            icon={Calendar}
            color="text-blue-500 bg-blue-500/10"
            to="/admin/appointments"
          />
          <DashboardCard
            label="Active Doctors"
            count={docCount}
            loading={loadingDocs}
            icon={Users}
            color="text-green-500 bg-green-500/10"
            to="/admin/doctors"
          />
          <DashboardCard
            label="Offered Services"
            count={svcCount}
            loading={loadingSvcs}
            icon={Briefcase}
            color="text-purple-500 bg-purple-500/10"
            to="/admin/services"
          />
          <DashboardCard
            label="FAQs"
            count={faqCount}
            loading={loadingFaqs}
            icon={CircleHelp}
            color="text-amber-500 bg-amber-500/10"
            to="/admin/faqs"
          />
        </div>
      </div>
    </AdminPortalShell>
  );
}

function DashboardCard({
  label,
  count,
  loading,
  icon: Icon,
  color,
  to,
}: {
  label: string;
  count?: number;
  loading: boolean;
  icon: typeof Clock;
  color: string;
  to: string;
}) {
  return (
    <Link to={to}>
      <Card className="border-border shadow-sm hover:shadow-md hover:border-primary/20 cursor-pointer transition-all duration-200">
        <CardContent className="p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground font-medium">{label}</p>
            <p className="text-3xl font-bold">
              {loading ? (
                <span className="inline-block h-8 w-12 animate-pulse bg-secondary/50 rounded" />
              ) : (
                count
              )}
            </p>
          </div>
          <div className={cn("h-12 w-12 rounded-xl grid place-items-center", color)}>
            <Icon className="h-6 w-6" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

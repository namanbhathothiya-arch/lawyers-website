import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminGuard } from "@/components/AdminGuard";
import { AdminPortalShell } from "@/components/admin/AdminPortalShell";
import { ServicesManager } from "@/components/admin/ServicesManager";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";

type ServiceSection = {
  id: string;
  name: string;
  slug?: string | null;
  description?: string | null;
};

export const Route = createFileRoute("/admin/service-sections/$sectionId")({
  head: () => ({
    meta: [{ title: "Service Section — [FIRM NAME]" }],
  }),
  component: SectionDetailRoute,
});

function SectionDetailRoute() {
  const { sectionId } = Route.useParams();
  const { data: section, isLoading, isError, error } = useQuery<ServiceSection | null>({
    queryKey: ["admin-service-section", sectionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_sections")
        .select("id, name, slug, description")
        .eq("id", sectionId)
        .maybeSingle();
      if (error) throw error;
      return (data as ServiceSection | null) || null;
    },
    enabled: Boolean(sectionId),
  });

  return (
    <AdminGuard>
      <AdminPortalShell title={section?.name || "Service Section"}>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-72" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : isError ? (
          <div className="rounded-xl border border-dashed border-destructive/20 bg-destructive/5 p-8 text-center text-destructive">
            <p className="font-semibold">Could not load this service section</p>
            <p className="mt-1 text-sm">{error?.message}</p>
          </div>
        ) : section ? (
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">{section.name}</h1>
                  {section.description && (
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                      {section.description}
                    </p>
                  )}
                </div>
                <Button asChild variant="outline">
                  <Link to="/admin/service-sections">Back to Service Sections</Link>
                </Button>
              </div>
            </div>
            <ServicesManager sectionId={section.id} sectionName={section.name} />
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-secondary/10 p-8 text-center">
            <p className="font-semibold">Service section not found</p>
            <Button asChild className="mt-4">
              <Link to="/admin/service-sections">Return to Service Sections</Link>
            </Button>
          </div>
        )}
      </AdminPortalShell>
    </AdminGuard>
  );
}

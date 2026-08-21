import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { AdminGuard } from "@/components/AdminGuard";
import { AdminPortalShell } from "@/components/admin/AdminPortalShell";
import { ServiceSectionsManager } from "@/components/admin/ServiceSectionsManager";

export const Route = createFileRoute("/admin/service-sections")({
  head: () => ({
    meta: [{ title: "Service Sections — [FIRM NAME]" }],
  }),
  component: ServiceSectionsRoute,
});

function ServiceSectionsRoute() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isNestedSectionPath =
    pathname !== "/admin/service-sections" &&
    pathname !== "/admin/service-sections/" &&
    pathname.startsWith("/admin/service-sections/");

  if (isNestedSectionPath) {
    return <Outlet />;
  }

  return (
    <AdminGuard>
      <AdminPortalShell title="Service Sections">
        <ServiceSectionsManager />
      </AdminPortalShell>
    </AdminGuard>
  );
}

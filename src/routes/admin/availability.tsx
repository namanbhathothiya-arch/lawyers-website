import { createFileRoute } from "@tanstack/react-router";
import { AdminGuard } from "@/components/AdminGuard";
import { AdminPortalShell } from "@/components/admin/AdminPortalShell";
import { AvailabilityManager } from "@/components/admin/AvailabilityManager";

export const Route = createFileRoute("/admin/availability")({
  head: () => ({
    meta: [{ title: "Availability — Advanced Care Medical Clinic" }],
  }),
  component: () => (
    <AdminGuard>
      <AdminPortalShell title="Availability">
        <AvailabilityManager />
      </AdminPortalShell>
    </AdminGuard>
  ),
});

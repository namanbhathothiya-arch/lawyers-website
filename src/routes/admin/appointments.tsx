import { createFileRoute } from "@tanstack/react-router";
import { AdminGuard } from "@/components/AdminGuard";
import { AdminPortalShell } from "@/components/admin/AdminPortalShell";
import { AppointmentsManager } from "@/components/admin/AppointmentsManager";

export const Route = createFileRoute("/admin/appointments")({
  head: () => ({
    meta: [{ title: "Appointments — Advanced Care Medical Clinic" }],
  }),
  component: () => (
    <AdminGuard>
      <AdminPortalShell title="Appointments">
        <AppointmentsManager view="all" role="admin" />
      </AdminPortalShell>
    </AdminGuard>
  ),
});

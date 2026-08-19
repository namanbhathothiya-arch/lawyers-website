import { createFileRoute } from "@tanstack/react-router";
import { AdminGuard } from "@/components/AdminGuard";
import { AdminPortalShell } from "@/components/admin/AdminPortalShell";
import { AppointmentsManager } from "@/components/admin/AppointmentsManager";

export const Route = createFileRoute("/admin/appointments")({
  head: () => ({
    meta: [{ title: "Consultations — [FIRM NAME]" }],
  }),
  component: () => (
    <AdminGuard>
      <AdminPortalShell title="Consultations">
        <AppointmentsManager view="all" role="admin" />
      </AdminPortalShell>
    </AdminGuard>
  ),
});

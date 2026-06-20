import { createFileRoute } from "@tanstack/react-router";
import { AdminGuard } from "@/components/AdminGuard";
import { AdminPortalShell } from "@/components/admin/AdminPortalShell";
import { ServicesManager } from "@/components/admin/ServicesManager";

export const Route = createFileRoute("/admin/services")({
  head: () => ({
    meta: [{ title: "Services — HeartCare Advanced Clinic" }],
  }),
  component: () => (
    <AdminGuard>
      <AdminPortalShell title="Services">
        <ServicesManager />
      </AdminPortalShell>
    </AdminGuard>
  ),
});

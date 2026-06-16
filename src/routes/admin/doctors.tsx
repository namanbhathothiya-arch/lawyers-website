import { createFileRoute } from "@tanstack/react-router";
import { AdminGuard } from "@/components/AdminGuard";
import { AdminPortalShell } from "@/components/admin/AdminPortalShell";
import { DoctorsManager } from "@/components/admin/DoctorsManager";

export const Route = createFileRoute("/admin/doctors")({
  head: () => ({
    meta: [{ title: "Doctors — Advanced Care Medical Clinic" }],
  }),
  component: () => (
    <AdminGuard>
      <AdminPortalShell title="Doctors">
        <DoctorsManager />
      </AdminPortalShell>
    </AdminGuard>
  ),
});

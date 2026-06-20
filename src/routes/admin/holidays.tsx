import { createFileRoute } from "@tanstack/react-router";
import { AdminGuard } from "@/components/AdminGuard";
import { AdminPortalShell } from "@/components/admin/AdminPortalShell";
import { HolidaysManager } from "@/components/admin/HolidaysManager";

export const Route = createFileRoute("/admin/holidays")({
  head: () => ({
    meta: [{ title: "Holidays — HeartCare Advanced Clinic" }],
  }),
  component: () => (
    <AdminGuard>
      <AdminPortalShell title="Holidays">
        <HolidaysManager />
      </AdminPortalShell>
    </AdminGuard>
  ),
});

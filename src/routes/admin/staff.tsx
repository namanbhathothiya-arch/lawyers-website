import { createFileRoute } from "@tanstack/react-router";
import { AdminGuard } from "@/components/AdminGuard";
import { AdminPortalShell } from "@/components/admin/AdminPortalShell";
import { StaffManager } from "@/components/admin/StaffManager";

export const Route = createFileRoute("/admin/staff")({
  head: () => ({
    meta: [{ title: "Staff Management — HeartCare Advanced Clinic" }],
  }),
  component: () => (
    <AdminGuard>
      <AdminPortalShell title="Staff Management">
        <StaffManager />
      </AdminPortalShell>
    </AdminGuard>
  ),
});

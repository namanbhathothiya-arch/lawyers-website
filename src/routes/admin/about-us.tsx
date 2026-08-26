import { createFileRoute } from "@tanstack/react-router";
import { AdminGuard } from "@/components/AdminGuard";
import { AdminPortalShell } from "@/components/admin/AdminPortalShell";
import { AboutUsManager } from "@/components/admin/AboutUsManager";

export const Route = createFileRoute("/admin/about-us")({
  head: () => ({
    meta: [{ title: "About Us — Admin" }],
  }),
  component: () => (
    <AdminGuard>
      <AdminPortalShell title="About Us">
        <AboutUsManager />
      </AdminPortalShell>
    </AdminGuard>
  ),
});

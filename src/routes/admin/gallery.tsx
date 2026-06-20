import { createFileRoute } from "@tanstack/react-router";
import { AdminGuard } from "@/components/AdminGuard";
import { AdminPortalShell } from "@/components/admin/AdminPortalShell";
import { GalleryManager } from "@/components/admin/GalleryManager";

export const Route = createFileRoute("/admin/gallery")({
  head: () => ({
    meta: [{ title: "Clinic Gallery — HeartCare Advanced Clinic" }],
  }),
  component: () => (
    <AdminGuard>
      <AdminPortalShell title="Clinic Gallery">
        <GalleryManager />
      </AdminPortalShell>
    </AdminGuard>
  ),
});

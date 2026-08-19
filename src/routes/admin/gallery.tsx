import { createFileRoute } from "@tanstack/react-router";
import { AdminGuard } from "@/components/AdminGuard";
import { AdminPortalShell } from "@/components/admin/AdminPortalShell";
import { GalleryManager } from "@/components/admin/GalleryManager";

export const Route = createFileRoute("/admin/gallery")({
  head: () => ({
    meta: [{ title: "Office Gallery — [FIRM NAME]" }],
  }),
  component: () => (
    <AdminGuard>
      <AdminPortalShell title="Office Gallery">
        <GalleryManager />
      </AdminPortalShell>
    </AdminGuard>
  ),
});

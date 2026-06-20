import { createFileRoute } from "@tanstack/react-router";
import { AdminGuard } from "@/components/AdminGuard";
import { AdminPortalShell } from "@/components/admin/AdminPortalShell";
import { FaqsManager } from "@/components/admin/FaqsManager";

export const Route = createFileRoute("/admin/faqs")({
  head: () => ({
    meta: [{ title: "FAQs — HeartCare Advanced Clinic" }],
  }),
  component: () => (
    <AdminGuard>
      <AdminPortalShell title="FAQs">
        <FaqsManager />
      </AdminPortalShell>
    </AdminGuard>
  ),
});

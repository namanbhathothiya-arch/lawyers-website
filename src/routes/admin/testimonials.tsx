import { createFileRoute } from "@tanstack/react-router";
import { AdminGuard } from "@/components/AdminGuard";
import { AdminPortalShell } from "@/components/admin/AdminPortalShell";
import { TestimonialsManager } from "@/components/admin/TestimonialsManager";

export const Route = createFileRoute("/admin/testimonials")({
  head: () => ({
    meta: [{ title: "Testimonials — HeartCare Advanced Clinic" }],
  }),
  component: () => (
    <AdminGuard>
      <AdminPortalShell title="Testimonials">
        <TestimonialsManager />
      </AdminPortalShell>
    </AdminGuard>
  ),
});

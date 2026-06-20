import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { ClinicGallery } from "@/components/ClinicGallery";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Clinic Gallery — HeartCare Advanced Clinic" },
      {
        name: "description",
        content:
          "View photos of HeartCare Advanced Clinic's consultation rooms, patient spaces, and modern medical facilities.",
      },
      { property: "og:title", content: "Clinic Gallery — HeartCare Advanced Clinic" },
      {
        property: "og:description",
        content:
          "Explore the consultation rooms, patient spaces, and modern facilities at HeartCare Advanced Clinic.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://heartcareclinic.com/gallery" },
    ],
    links: [{ rel: "canonical", href: "https://heartcareclinic.com/gallery" }],
  }),
  component: GalleryPage,
});

function GalleryPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <Link
        to="/"
        hash="gallery"
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-background px-4 text-sm font-semibold text-muted-foreground transition hover:border-primary/25 hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to home
      </Link>

      <div className="mt-8 max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Our Clinic</p>
        <h1 className="mt-3 text-4xl font-bold sm:text-5xl">All clinic photos</h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
          Explore our consultation rooms, patient spaces, and modern medical facilities. Select any
          photo to view it full screen.
        </p>
      </div>

      <div className="mt-10">
        <ClinicGallery showAll />
      </div>
    </section>
  );
}

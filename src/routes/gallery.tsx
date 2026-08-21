import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { ClinicGallery } from "@/components/ClinicGallery";
import { LAW_FIRM } from "@/lib/clinic-data";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: `Firm & Chambers Gallery — ${LAW_FIRM.name}` },
      {
        name: "description",
        content: `View photos of ${LAW_FIRM.name}'s chambers, consultation rooms, client spaces, and legal facilities.`,
      },
      { property: "og:title", content: `Firm & Chambers Gallery — ${LAW_FIRM.name}` },
      {
        property: "og:description",
        content: `Explore the chambers, consultation rooms, client spaces, and legal facilities at ${LAW_FIRM.name}.`,
      },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://sharmalaw.in/gallery" }],
  }),
  component: GalleryPage,
});

function GalleryPage() {
  return (
    <div className="bg-[#08090d] text-slate-100 min-h-screen">
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <Link
          to="/"
          hash="gallery"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/10 bg-transparent px-4 text-sm font-semibold text-slate-300 transition hover:border-[var(--site-gold)]/35 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 text-[var(--site-gold)]" aria-hidden="true" />
          Back to Home
        </Link>

        <div className="mt-8 max-w-3xl">
          <p className="eyebrow">Chambers & offices</p>
          <h1 className="mt-3 font-serif text-4xl font-semibold text-white sm:text-5xl">Firm chambers gallery</h1>
          <p className="mt-4 text-base leading-relaxed text-slate-300 sm:text-lg">
            Explore our legal chambers, conference rooms, client reception, and legal research facilities. Select any photo for full-screen view.
          </p>
        </div>

        <div className="mt-10">
          <ClinicGallery showAll />
        </div>
      </section>
    </div>
  );
}

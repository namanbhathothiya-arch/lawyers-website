import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, HelpCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FAQSection } from "@/components/FAQSection";
import { LAW_FIRM } from "@/lib/clinic-data";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — [FIRM NAME]" },
      {
        name: "description",
        content:
          "Frequently asked questions about meetings, fees, confidentiality, and next steps.",
      },
      { property: "og:title", content: "FAQ — [FIRM NAME]" },
      {
        property: "og:description",
        content:
          "Frequently asked questions about meetings, fees, confidentiality, and next steps.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://example.com/faq" },
      { property: "og:image", content: "https://example.com/og-image.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "FAQ — [FIRM NAME]" },
      {
        name: "twitter:description",
        content:
          "Frequently asked questions about meetings, fees, confidentiality, and next steps.",
      },
      { name: "twitter:image", content: "https://example.com/og-image.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://example.com/faq" }],
  }),
  component: FaqPage,
});

function FaqPage() {
  return (
    <main className="relative isolate overflow-hidden">
      <section className="border-b border-primary/10 bg-[linear-gradient(135deg,oklch(0.16_0.03_255),oklch(0.22_0.03_255)_54%,oklch(0.985_0.008_95))] text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1fr_auto] lg:items-end lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-white/80 shadow-sm backdrop-blur">
              <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
              Frequently asked questions
            </div>
            <h1 className="hero-display mt-6 text-5xl leading-[0.98] sm:text-6xl lg:text-7xl">
              Clear answers for <span className="text-accent">clients and callers.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/72 sm:text-lg sm:leading-8">
              Find practical answers about meetings, preparation, fees, confidentiality, and what
              happens after you reach out to the firm.
            </p>
          </div>

          <div className="rounded-3xl border border-white/15 bg-white/10 p-5 shadow-[0_24px_70px_-42px_rgba(16,45,75,0.65)] backdrop-blur">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-success" aria-hidden="true" />
              <div>
                <div className="text-sm font-bold">Need a direct answer?</div>
                <div className="text-xs text-white/65">Call {LAW_FIRM.phone}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <FAQSection />

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] bg-primary p-8 text-primary-foreground shadow-[0_24px_70px_-45px_rgba(16,45,75,0.7)] sm:p-10 lg:flex lg:items-center lg:justify-between lg:gap-8">
          <div className="max-w-2xl">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-primary-foreground/60">
              Next step
            </div>
            <h2 className="mt-3 text-2xl font-bold sm:text-3xl">Ready to book a meeting?</h2>
            <p className="mt-2 text-sm leading-6 text-primary-foreground/75">
              When you’re ready, we can help route your matter to the right lawyer and legal area.
            </p>
          </div>
          <Button asChild size="lg" variant="secondary" className="mt-6 rounded-full lg:mt-0">
            <Link to="/appointment">
              Book a Meeting
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}

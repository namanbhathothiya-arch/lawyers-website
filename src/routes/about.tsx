import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, HeartPulse, Award, Users } from "lucide-react";
import { CLINIC } from "@/lib/clinic-data";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Advanced Care Medical Clinic" },
      {
        name: "description",
        content:
          "About Advanced Care Medical Clinic — our mission, values, and the team behind compassionate, modern healthcare.",
      },
      { property: "og:title", content: "About — Advanced Care Medical Clinic" },
      {
        property: "og:description",
        content:
          "About Advanced Care Medical Clinic — our mission, values, and the team behind compassionate, modern healthcare.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://advancedcareclinic.com/about" },
      { property: "og:image", content: "https://advancedcareclinic.com/og-image.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "About — Advanced Care Medical Clinic" },
      {
        name: "twitter:description",
        content:
          "About Advanced Care Medical Clinic — our mission, values, and the team behind compassionate, modern healthcare.",
      },
      { name: "twitter:image", content: "https://advancedcareclinic.com/og-image.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://advancedcareclinic.com/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <>
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-3xl">
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">
            About us
          </div>
          <h1 className="mt-2 text-4xl sm:text-5xl font-bold">Healthcare that feels human.</h1>
          <p className="mt-5 text-lg text-muted-foreground">
            {CLINIC.name} was founded on a simple belief: great medicine should feel personal. We
            bring together experienced specialists, modern facilities, and unhurried consultations —
            so you get the care you'd want for your own family.
          </p>
        </div>

        <h2 className="sr-only">Our Core Values</h2>
        <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: ShieldCheck,
              t: "Clinical excellence",
              d: "Evidence-based protocols across every specialty.",
            },
            {
              icon: HeartPulse,
              t: "Patient-first",
              d: "Listening more, prescribing only what's needed.",
            },
            {
              icon: Award,
              t: "Senior specialists",
              d: "Average 10+ years of practice across our team.",
            },
            { icon: Users, t: "Family care", d: "From pediatrics to geriatrics — under one roof." },
          ].map((v) => (
            <div key={v.t} className="rounded-2xl border border-border p-6 bg-card">
              <div className="h-10 w-10 rounded-xl bg-primary-light text-primary grid place-items-center">
                <v.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{v.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{v.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-secondary/40 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12">
          <div>
            <h2 className="text-3xl font-bold">Our mission</h2>
            <p className="mt-4 text-muted-foreground">
              To make high-quality, specialist-led healthcare effortlessly accessible — without
              compromising warmth or time. Every interaction is designed to be calm, clear, and
              considered.
            </p>
          </div>
          <div>
            <h2 className="text-3xl font-bold">Our facility</h2>
            <p className="mt-4 text-muted-foreground">
              Modern consultation suites, on-site diagnostics, sterile minor-procedure rooms and
              accessible design — engineered for both clinical precision and patient comfort.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

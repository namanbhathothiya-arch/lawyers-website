import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, HeartPulse, Award, Users } from "lucide-react";
import { CLINIC } from "@/lib/clinic-data";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — HeartCare Advanced Clinic" },
      {
        name: "description",
        content:
          "Learn about HeartCare Advanced Clinic and Dr. Raj Sharma's compassionate approach to advanced cardiac care.",
      },
      { property: "og:title", content: "About — HeartCare Advanced Clinic" },
      {
        property: "og:description",
        content:
          "Learn about HeartCare Advanced Clinic and Dr. Raj Sharma's compassionate approach to advanced cardiac care.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://heartcareclinic.com/about" },
      { property: "og:image", content: "https://heartcareclinic.com/og-image.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "About — HeartCare Advanced Clinic" },
      {
        name: "twitter:description",
        content:
          "Learn about HeartCare Advanced Clinic and Dr. Raj Sharma's compassionate approach to advanced cardiac care.",
      },
      { name: "twitter:image", content: "https://heartcareclinic.com/og-image.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://heartcareclinic.com/about" }],
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
          <h1 className="mt-2 text-4xl sm:text-5xl font-bold">
            Advanced cardiac care with compassion.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            {CLINIC.name} is led by {CLINIC.doctor}, a specialist in {CLINIC.specialization}.
            We combine advanced cardiac expertise, modern facilities, and attentive consultations
            to provide clear, compassionate care for every patient.
          </p>
        </div>

        <h2 className="sr-only">Our Core Values</h2>
        <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: ShieldCheck,
              t: "Clinical excellence",
              d: "Evidence-based protocols for advanced cardiac care.",
            },
            {
              icon: HeartPulse,
              t: "Patient-first",
              d: "Listening more, prescribing only what's needed.",
            },
            {
              icon: Award,
              t: "Specialist expertise",
              d: "Interventional cardiology led by Dr. Raj Sharma.",
            },
            { icon: Users, t: "Continuity of care", d: "Support through diagnosis, treatment, and follow-up." },
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
              To make advanced cardiac care accessible without compromising compassion, clarity,
              or time. Every interaction is designed to help patients feel informed and supported.
            </p>
          </div>
          <div>
            <h2 className="text-3xl font-bold">Our facility</h2>
            <p className="mt-4 text-muted-foreground">
              Modern consultation facilities and a patient-focused environment support precise
              cardiac assessment, treatment planning, and comfortable follow-up care.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

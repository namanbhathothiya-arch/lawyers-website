import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, Award, Users, Scale } from "lucide-react";
import { LAW_FIRM } from "@/lib/clinic-data";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: `About Us — ${LAW_FIRM.name}` },
      {
        name: "description",
        content: `Learn about ${LAW_FIRM.name} and our strategic approach to corporate, civil, and legal representation.`,
      },
      { property: "og:title", content: `About Us — ${LAW_FIRM.name}` },
      {
        property: "og:description",
        content: `Learn about ${LAW_FIRM.name} and our strategic approach to corporate, civil, and legal representation.`,
      },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://sharmalaw.in/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <main className="bg-[#070c14] text-slate-100 min-h-screen">
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="max-w-3xl">
          <div className="text-xs font-bold uppercase tracking-widest text-blue-400">
            About Our Chambers
          </div>
          <h1 className="mt-3 font-serif text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-white">
            Strategic legal representation for complex matters.
          </h1>
          <p className="mt-6 text-base sm:text-lg leading-relaxed text-slate-300">
            {LAW_FIRM.name} is a premier Indian law firm led by {LAW_FIRM.lawyer}, practicing in {LAW_FIRM.specialization}.
            We combine deep statutory knowledge, disciplined litigation strategy, and direct advocate accessibility to protect client interests across high-stakes legal disputes.
          </p>
        </div>

        <h2 className="sr-only">Our Core Legal Principles</h2>
        <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: Scale,
              t: "Legal Rigor",
              d: "Evidence-backed statutory analysis and meticulous case preparation.",
            },
            {
              icon: ShieldCheck,
              t: "Client Privilege",
              d: "Unwavering commitment to absolute confidentiality and professional ethics.",
            },
            {
              icon: Award,
              t: "Senior Advocacy",
              d: "Direct lead advocate involvement across every consultation and court filing.",
            },
            {
              icon: Users,
              t: "Strategic Counsel",
              d: "Proactive guidance designed to minimize risk and resolve disputes efficiently.",
            },
          ].map((v) => (
            <div key={v.t} className="rounded-xl border border-slate-800 p-6 bg-[#121b2d] shadow-xl">
              <div className="h-10 w-10 rounded-lg bg-blue-950 border border-blue-800/40 text-blue-400 grid place-items-center">
                <v.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-serif text-lg font-bold text-white">{v.t}</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">{v.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-800/80 bg-[#0b1220] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 lg:gap-16">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Our Mission</span>
            <h2 className="mt-2 font-serif text-3xl font-bold text-white">Ethical Advocacy & Results</h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-300">
              To deliver exceptional legal counsel without compromising integrity, strategic clarity, or personal responsiveness. Every client interaction is handled with the highest level of professional care and commitment.
            </p>
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-blue-400">Our Practice</span>
            <h2 className="mt-2 font-serif text-3xl font-bold text-white">Chambers & Representation</h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-300">
              Our chambers provide confidential consultation facilities and comprehensive legal support for corporate entities, business owners, and private individuals in district courts, high courts, and tribunals.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

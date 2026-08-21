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
    <div className="bg-[#F8FAFC] text-slate-900 min-h-screen">
      <section className="bg-[#0B1630] text-white border-b border-slate-800 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="eyebrow border-blue-400/30 bg-white/[0.05] text-blue-300">About the chambers</div>
            <h1 className="mt-4 font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold leading-tight text-white">
              A practice built on careful advice and accountable advocacy.
            </h1>
            <p className="mt-6 text-base sm:text-lg leading-relaxed text-slate-300">
              {LAW_FIRM.name} is a premier Indian law firm led by {LAW_FIRM.lawyer}, practicing in {LAW_FIRM.specialization}.
              We combine deep statutory knowledge, disciplined litigation strategy, and direct advocate accessibility to protect client interests across high-stakes legal disputes.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <h2 className="sr-only">Our Core Legal Principles</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
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
            <div key={v.t} className="rounded-xl border border-slate-200 p-6 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl">
              <div className="h-10 w-10 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 grid place-items-center">
                <v.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-serif text-lg font-bold text-slate-900">{v.t}</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">{v.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-200 bg-[#F1F5F9] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 lg:gap-16">
          <div>
            <span className="eyebrow border-slate-300 bg-white text-slate-700 shadow-sm">Our mission</span>
            <h2 className="mt-3 font-serif text-3xl font-bold text-slate-900">Ethical Advocacy & Results</h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              To deliver exceptional legal counsel without compromising integrity, strategic clarity, or personal responsiveness. Every client interaction is handled with the highest level of professional care and commitment.
            </p>
          </div>
          <div>
            <span className="eyebrow border-slate-300 bg-white text-slate-700 shadow-sm">Our practice</span>
            <h2 className="mt-3 font-serif text-3xl font-bold text-slate-900">Chambers & Representation</h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              Our chambers provide confidential consultation facilities and comprehensive legal support for corporate entities, business owners, and private individuals in district courts, high courts, and tribunals.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

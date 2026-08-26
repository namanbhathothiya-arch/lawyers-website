import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Lock,
  MessageSquare,
  Scale,
  Shield,
  Target,
  Users,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LAW_FIRM } from "@/lib/clinic-data";
import { useAboutContent } from "@/hooks/use-about-content";
import { useDoctors } from "@/hooks/use-supabase-data";
import { DoctorProfileCard } from "@/components/DoctorProfileCard";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: `About Us — ${LAW_FIRM.name}` },
      {
        name: "description",
        content: `Learn about ${LAW_FIRM.name} — our approach to legal representation, client communication, and case preparation.`,
      },
      { property: "og:title", content: `About Us — ${LAW_FIRM.name}` },
      {
        property: "og:description",
        content: `Learn about ${LAW_FIRM.name} and our client-first approach to legal representation.`,
      },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://sharmalaw.in/about" }],
  }),
  component: AboutPage,
});

/* ---- Static approach cards ---- */
const APPROACH_CARDS = [
  {
    icon: MessageSquare,
    title: "Clear Advice",
    body: "We explain your legal position in plain language, without unnecessary jargon, so you understand exactly where you stand and what options are open to you.",
  },
  {
    icon: BookOpen,
    title: "Strategic Preparation",
    body: "Every matter receives thorough document review and statutory analysis before any consultation, filing, or hearing. Good preparation leads to better outcomes.",
  },
  {
    icon: Users,
    title: "Direct Communication",
    body: "You will speak directly with the advocate assigned to your matter throughout your engagement, not a junior representative or a call handler.",
  },
  {
    icon: Lock,
    title: "Confidential Representation",
    body: "All communications and case details remain strictly protected by legal professional privilege. Your matter stays private.",
  },
  {
    icon: Target,
    title: "Practical Guidance",
    body: "We focus on workable, realistic strategies that reflect your actual circumstances — not theoretical best-case scenarios.",
  },
];

/* ---- Why choose us cards ---- */
const WHY_CARDS = [
  {
    title: "Client-First Approach",
    body: "Every decision we take is guided by what serves the client's interests, not what is easiest or most convenient for the firm.",
  },
  {
    title: "Structured Case Handling",
    body: "Matters are handled methodically with clear timelines, documented advice, and regular progress updates.",
  },
  {
    title: "Accessible Advocacy",
    body: "Our chambers are structured so that clients can always reach their advocate promptly, especially on time-sensitive matters.",
  },
  {
    title: "Honest Assessment",
    body: "We provide candid legal assessments, including when the prospects of a matter are uncertain, so you can make genuinely informed decisions.",
  },
];

/* ---- Fallback content ---- */
const FALLBACK = {
  eyebrow: "ABOUT OUR FIRM",
  headline: "Experienced counsel. Clear strategy. Trusted representation.",
  subheadline:
    "A client-focused legal practice built around thoughtful advice, careful preparation, and direct communication.",
  mission:
    "We help individuals, families, and businesses understand their legal position, evaluate their options, and move forward with confidence.",
  story: `Our practice was founded on the belief that every person deserves direct access to a qualified advocate who genuinely understands their circumstances. We work closely with clients across a range of civil, corporate, and general legal matters, combining careful statutory analysis with clear, honest communication.\n\nWe place particular emphasis on preparation. Before any consultation, filing, or hearing, we review the available documents and facts thoroughly so that the advice we give is grounded in what the law actually permits — not what clients hope to hear. This disciplined approach helps us identify risks early and plan practical paths forward.\n\nOur chambers maintain a structured yet approachable environment. Clients speak directly with the advocate handling their matter, receive clear written summaries of the advice given, and are kept informed of procedural developments without unnecessary delay.`,
  approach: "",
  confidentiality_note:
    "All communications between clients and our advocates are protected by legal professional privilege. Information shared during a consultation or in the course of representation is treated as strictly confidential and will not be disclosed to any third party without your explicit consent, except as required by law.",
  consultation_note:
    "We welcome individuals, families, and businesses who wish to discuss their legal matter. To arrange a consultation with the appropriate advocate, please use our online booking system or contact the chambers directly.",
  primary_cta_label: "Book a Consultation",
  primary_cta_url: "/appointment",
  secondary_cta_label: "Meet Our Lawyers",
  secondary_cta_url: "/doctors",
};

function AboutPage() {
  const { data: about, isLoading, isError } = useAboutContent();
  const { data: doctors } = useDoctors();

  const content = about ?? FALLBACK;

  // Parse story paragraphs
  const storyParagraphs = content.story
    ? content.story.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)
    : FALLBACK.story.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);

  return (
    <div className="bg-white text-slate-900">
      {/* ======================================================= */}
      {/* 1. HERO */}
      {/* ======================================================= */}
      <section className="relative overflow-hidden bg-[#061A35] text-white">
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)", backgroundSize: "32px 32px" }}
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#061A35] to-transparent" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          {isLoading ? (
            <HeroSkeleton />
          ) : (
            <div className="max-w-3xl">
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-white/[0.06] px-4 py-1.5 backdrop-blur-sm">
                <Scale className="h-3.5 w-3.5 text-blue-300" aria-hidden="true" />
                <span className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-blue-300">
                  {content.eyebrow}
                </span>
              </div>

              {/* Headline */}
              <h1 className="mt-6 font-serif text-4xl sm:text-5xl lg:text-[3.5rem] font-semibold leading-[1.06] tracking-tight text-white">
                {content.headline}
              </h1>

              {/* Subheadline */}
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-300">
                {content.subheadline}
              </p>

              {/* CTAs */}
              <div className="mt-9 flex flex-wrap gap-3">
                <Button
                  asChild
                  size="lg"
                  className="group min-h-12 rounded-xl bg-white px-7 text-base font-semibold text-[#061A35] hover:bg-slate-100 shadow-xl transition-all duration-200 hover:-translate-y-0.5"
                >
                  <Link
                    to={content.primary_cta_url as "/appointment"}
                    className="inline-flex items-center gap-2"
                  >
                    <CalendarDays className="h-4.5 w-4.5" aria-hidden="true" />
                    {content.primary_cta_label}
                    <ArrowRight
                      className="ml-0.5 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </Link>
                </Button>

                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="min-h-12 rounded-xl border-white/30 bg-transparent px-7 text-base font-semibold text-white hover:bg-white/10 hover:border-white/50 transition-all duration-200"
                >
                  <Link
                    to={content.secondary_cta_url as "/doctors"}
                    className="inline-flex items-center gap-2"
                  >
                    <Users className="h-4.5 w-4.5" aria-hidden="true" />
                    {content.secondary_cta_label}
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Error banner (non-blocking) */}
      {isError && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3">
          <div className="mx-auto max-w-7xl flex items-center gap-2 text-sm text-amber-700">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Some content is temporarily unavailable. Displaying fallback content.</span>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* 2. WHO WE ARE — firm story */}
      {/* ======================================================= */}
      <section
        aria-labelledby="about-story-heading"
        className="border-b border-slate-100 py-16 sm:py-20"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-20 items-start">
            <div>
              <span className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-blue-600">
                Who We Are
              </span>
              <h2
                id="about-story-heading"
                className="mt-3 font-serif text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl"
              >
                A practice built on preparation and clear advocacy.
              </h2>
              {storyParagraphs.map((para, i) => (
                <p key={i} className="mt-4 text-base leading-relaxed text-slate-600">
                  {para}
                </p>
              ))}
            </div>

            {/* Mission / quick-stat panel */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-6">
                <div className="flex items-start gap-3">
                  <div
                    className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-600 text-white"
                    aria-hidden="true"
                  >
                    <Scale className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-bold text-slate-900">Our Mission</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{content.mission}</p>
                  </div>
                </div>
              </div>

              {content.confidentiality_note && (
                <div className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-6">
                  <div className="flex items-start gap-3">
                    <div
                      className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600"
                      aria-hidden="true"
                    >
                      <Lock className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-serif text-base font-bold text-slate-900">Confidentiality</h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">
                        {content.confidentiality_note}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================= */}
      {/* 3. OUR APPROACH */}
      {/* ======================================================= */}
      <section
        aria-labelledby="about-approach-heading"
        className="border-b border-slate-100 bg-[#F8FAFC] py-16 sm:py-20"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-blue-600">
              Our Approach
            </span>
            <h2
              id="about-approach-heading"
              className="mt-3 font-serif text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl"
            >
              How we work with you
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-500">
              Every engagement follows the same disciplined process — from the initial consultation to the final step.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {APPROACH_CARDS.map((card) => (
              <article
                key={card.title}
                className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-md"
              >
                <div
                  className="grid h-11 w-11 place-items-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600 transition-colors duration-200 group-hover:bg-blue-600 group-hover:text-white"
                  aria-hidden="true"
                >
                  <card.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-serif text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors duration-200">
                  {card.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{card.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================= */}
      {/* 4. WHY CLIENTS CHOOSE US */}
      {/* ======================================================= */}
      <section
        aria-labelledby="about-why-heading"
        className="border-b border-slate-100 py-16 sm:py-20"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            <div>
              <span className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-blue-600">
                Why Clients Choose Us
              </span>
              <h2
                id="about-why-heading"
                className="mt-3 font-serif text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl"
              >
                A practice that puts your matter first.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600">
                Clients return and refer others because our practice is structured to deliver consistent, honest, and practical legal support — not because of any single outcome.
              </p>

              <Button
                asChild
                className="mt-8 min-h-11 bg-[#061A35] hover:bg-[#0d2847] text-white font-semibold rounded-lg px-6 shadow-md"
              >
                <Link to="/appointment" className="inline-flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" aria-hidden="true" />
                  Schedule a Consultation
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {WHY_CARDS.map((card) => (
                <div
                  key={card.title}
                  className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                >
                  <div className="flex items-center gap-2 text-blue-600" aria-hidden="true">
                    <Shield className="h-4 w-4" />
                  </div>
                  <h3 className="mt-3 font-serif text-base font-bold text-slate-900">{card.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{card.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================= */}
      {/* 5. TEAM PREVIEW (reuses existing lawyer data) */}
      {/* ======================================================= */}
      {doctors && doctors.length > 0 && (
        <section
          aria-labelledby="about-team-heading"
          className="border-b border-slate-100 bg-[#F8FAFC] py-16 sm:py-20"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <span className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-blue-600">
                Our Advocates
              </span>
              <h2
                id="about-team-heading"
                className="mt-3 font-serif text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl"
              >
                Meet our lawyers
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-500">
                Each advocate brings focused expertise to their practice area. View individual profiles to see specializations and how to make contact.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {doctors.slice(0, 4).map((doctor) => (
                <DoctorProfileCard key={doctor.id} doctor={doctor} compact />
              ))}
            </div>

            <div className="mt-10 text-center">
              <Button
                asChild
                variant="outline"
                className="min-h-11 border-slate-300 bg-white hover:bg-slate-50 text-slate-900 rounded-lg px-6 shadow-sm font-semibold"
              >
                <Link to="/doctors">View all lawyers</Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* ======================================================= */}
      {/* 6. CONSULTATION CTA */}
      {/* ======================================================= */}
      <section
        aria-labelledby="about-cta-heading"
        className="py-16 sm:py-20"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-[#061A35] px-8 py-12 text-center shadow-2xl sm:py-16">
            <div className="mx-auto max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/30 bg-white/[0.06] px-4 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-blue-300">
                <Lock className="h-3 w-3" aria-hidden="true" />
                Consultation
              </span>

              <h2
                id="about-cta-heading"
                className="mt-5 font-serif text-3xl font-semibold text-white sm:text-4xl"
              >
                {content.consultation_note || "Ready to discuss your legal matter?"}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-300">
                {!content.consultation_note &&
                  "Arrange a consultation with the appropriate advocate. Your enquiry will be treated in strict confidence."}
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Button
                  asChild
                  size="lg"
                  className="group min-h-12 rounded-xl bg-white px-8 text-base font-semibold text-[#061A35] hover:bg-slate-100 shadow-xl transition-all duration-200 hover:-translate-y-0.5"
                >
                  <Link to="/appointment" className="inline-flex items-center gap-2">
                    <CalendarDays className="h-4.5 w-4.5" aria-hidden="true" />
                    Book a Consultation
                    <ArrowRight
                      className="ml-0.5 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="min-h-12 rounded-xl border-white/30 bg-transparent px-8 text-base font-semibold text-white hover:bg-white/10 hover:border-white/50 transition-all duration-200"
                >
                  <Link to="/doctors" className="inline-flex items-center gap-2">
                    <Users className="h-4.5 w-4.5" aria-hidden="true" />
                    Meet Our Lawyers
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function HeroSkeleton() {
  return (
    <div className="space-y-4 max-w-3xl" aria-hidden="true">
      <Skeleton className="h-7 w-36 rounded-full bg-white/10" />
      <Skeleton className="h-14 w-full rounded-xl bg-white/10" />
      <Skeleton className="h-14 w-4/5 rounded-xl bg-white/10" />
      <Skeleton className="h-5 w-2/3 rounded bg-white/10" />
      <div className="flex gap-3 mt-8">
        <Skeleton className="h-12 w-44 rounded-xl bg-white/10" />
        <Skeleton className="h-12 w-40 rounded-xl bg-white/10" />
      </div>
    </div>
  );
}

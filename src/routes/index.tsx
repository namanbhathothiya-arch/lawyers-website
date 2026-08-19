import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, type CSSProperties } from "react";
import {
  ArrowRight,
  ShieldCheck,
  Clock,
  Users,
  Award,
  Phone,
  Check,
  CalendarDays,
  Scale,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/hero-clinic.jpg";
import doctorImg from "@/assets/doctor-1.jpg";
import { LAW_FIRM, getDoctorImage } from "@/lib/clinic-data";
import { useHeroContent } from "@/hooks/use-supabase-data";
import { Skeleton } from "@/components/ui/skeleton";
import { DeferredSection } from "@/components/DeferredSection";

const HomeDeferredSections = lazy(() =>
  import("@/components/HomeDeferredSections").then((module) => ({
    default: module.HomeDeferredSections,
  })),
);

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${LAW_FIRM.name} — Expert Legal Representation` },
      {
        name: "description",
        content:
          "Strategic legal counsel and experienced representation for corporate, civil, and legal matters in India.",
      },
      { property: "og:title", content: `${LAW_FIRM.name} — Expert Legal Representation` },
      {
        property: "og:description",
        content:
          "Strategic legal counsel and experienced representation for corporate, civil, and legal matters in India.",
      },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://sharmalaw.in/" }],
  }),
  component: HomePage,
});

function HomePage() {
  const { data: heroContent } = useHeroContent();

  const heroDoctor = heroContent?.doctor;
  const heroDoctorName = heroDoctor?.name || LAW_FIRM.lawyer;
  const heroDoctorSpecialization = heroDoctor?.specialization || LAW_FIRM.specialization;
  const heroDoctorExperience = heroDoctor?.experience || "15+ years";
  const heroDoctorPhoto = heroDoctor ? getDoctorImage(heroDoctor.id, heroDoctor.photo) : doctorImg;
  const heroImage = heroContent?.image?.image_url || heroImg;
  const heroImageAlt =
    heroContent?.image?.title || `Legal chambers and consultation rooms at ${LAW_FIRM.name}`;

  const firmSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LegalService",
        "@id": "https://sharmalaw.in/#firm",
        name: LAW_FIRM.name,
        url: "https://sharmalaw.in",
        logo: "https://sharmalaw.in/favicon.svg",
        description:
          "Expert legal representation and counsel from dedicated advocates.",
        telephone: LAW_FIRM.phone,
        email: LAW_FIRM.email,
        address: {
          "@type": "PostalAddress",
          streetAddress: LAW_FIRM.address,
          addressCountry: "IN",
        },
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json">{JSON.stringify(firmSchema)}</script>
      {/* HERO SECTION */}
      <section className="private-hero relative isolate overflow-hidden border-b border-slate-800">
        <div className="private-hero-grid absolute inset-0 -z-20" />
        <div className="absolute -left-24 top-8 -z-10 h-72 w-72 rounded-full bg-blue-600/15 blur-3xl" />
        <div className="absolute -right-20 bottom-8 -z-10 h-80 w-80 rounded-full bg-blue-900/20 blur-3xl" />

        <div className="mx-auto grid max-w-7xl gap-10 px-4 pb-12 pt-8 sm:px-6 sm:pb-16 sm:pt-12 lg:grid-cols-[0.96fr_1.04fr] lg:items-center lg:gap-16 lg:px-8 lg:pb-20 lg:pt-16">
          <div className="hero-enter relative z-10 order-2 sm:px-0 lg:order-1">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-blue-500/25 bg-blue-950/60 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-widest text-blue-400 shadow-sm backdrop-blur">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-blue-600 text-white">
                <Scale className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />
              </span>
              India Advocates & Legal Consultants
            </div>

            <h1 className="hero-display mt-6 max-w-2xl text-4xl leading-[1.05] text-white sm:text-6xl lg:text-[4.25rem]">
              Strategic legal counsel, <span className="text-blue-500">defined by results.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
              Confidential, outcome-focused legal practice. Direct consultation with{" "}
              <strong className="text-white font-medium">{heroDoctorName}</strong> for comprehensive case evaluation, documentation, and court representation.
            </p>

            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-3" aria-label="Firm assurances">
              {["Same-week consultation slots", "Transparent legal fee plans", "Complete client confidentiality"].map(
                (label) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-2 text-sm font-medium text-slate-300"
                  >
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-blue-900/60 border border-blue-600/40 text-blue-400">
                      <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
                    </span>
                    {label}
                  </span>
                ),
              )}
            </div>

            <div className="mt-9 flex flex-col gap-3.5 sm:flex-row sm:items-center">
              <Button
                asChild
                size="lg"
                className="group min-h-14 w-full rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-7 text-base font-semibold shadow-lg shadow-blue-950 transition-all sm:w-auto"
              >
                <Link to="/appointment">
                  Book Consultation
                  <ArrowRight
                    className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="min-h-14 w-full rounded-xl border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200 px-7 text-base font-semibold backdrop-blur sm:w-auto"
              >
                <a
                  href={`tel:${LAW_FIRM.phone}`}
                  aria-label={`Call ${LAW_FIRM.name} at ${LAW_FIRM.phone}`}
                >
                  <Phone className="mr-2 h-4 w-4 text-blue-400" aria-hidden="true" />
                  Call Chambers
                </a>
              </Button>
            </div>

            <div className="mt-8 flex items-center gap-3 border-t border-slate-800 pt-6 text-sm text-slate-400">
              <CalendarDays className="h-4 w-4 shrink-0 text-blue-400" aria-hidden="true" />
              <span>
                Consultation Hours: {LAW_FIRM.workingDays} ·{" "}
                <strong className="font-semibold text-slate-200">{LAW_FIRM.workingHours}</strong>
              </span>
            </div>
          </div>

          {/* HERO MEDIA & LAWYER CARD */}
          <div className="hero-enter hero-enter-late relative order-1 mx-auto w-full max-w-2xl lg:order-2 lg:max-w-none">
            <div className="relative lg:pb-14 lg:pl-8">
              <div className="absolute -right-3 -top-3 hidden h-full w-[88%] rounded-2xl border border-blue-500/20 lg:block lg:right-4 lg:top-4" />
              <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
                <img
                  src={heroImage}
                  alt={heroImageAlt}
                  width={1600}
                  height={1024}
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                  className="block h-auto w-full object-contain object-top lg:h-[540px] lg:object-cover filter brightness-[0.85] contrast-[1.05]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#070c14] via-[#070c14]/40 to-transparent" />
                <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border border-slate-700 bg-[#070c14]/90 px-3.5 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  Accepting Legal Consultations
                </div>
                <div className="absolute bottom-6 right-6 hidden rounded-xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-white shadow-xl backdrop-blur-md sm:block">
                  <div className="text-[0.65rem] font-bold uppercase tracking-widest text-amber-400">
                    Firm Assurance
                  </div>
                  <div className="mt-0.5 text-xs font-medium text-slate-200">Strict Client Confidentiality</div>
                </div>
              </div>

              {/* LAWYER INFO CARD */}
              <article className="hero-doctor-card relative z-10 mx-2 mt-3 rounded-xl border border-slate-800 bg-[#101827]/95 p-4 shadow-2xl backdrop-blur-xl sm:mx-0 sm:w-full sm:p-5 lg:absolute lg:bottom-0 lg:left-0 lg:mt-0 lg:w-[76%] lg:max-w-md">
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    <img
                      src={heroDoctorPhoto}
                      alt={`${heroDoctorName}, ${heroDoctorSpecialization}`}
                      width={256}
                      height={256}
                      loading="eager"
                      decoding="async"
                      className="h-20 w-20 rounded-xl object-cover object-top ring-2 ring-blue-600/40 sm:h-22 sm:w-22"
                    />
                    <span className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full border-2 border-[#101827] bg-blue-600 text-white">
                      <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[0.65rem] font-bold uppercase tracking-widest text-blue-400">
                      Senior Advocate
                    </div>
                    <h2 className="mt-0.5 truncate font-serif text-lg font-bold text-white sm:text-xl">
                      {heroDoctorName}
                    </h2>
                    <p className="truncate text-xs font-medium text-slate-400 sm:text-sm">
                      {heroDoctorSpecialization}
                    </p>
                    <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                      <Award className="h-3.5 w-3.5" aria-hidden="true" />
                      {heroDoctorExperience}
                      {!heroDoctorExperience.toLowerCase().includes("experience") && " Experience"}
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>

        {/* STATS BAR */}
        <div className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 sm:pb-10 lg:px-8">
          <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/90 shadow-xl backdrop-blur-md lg:grid-cols-4">
            {[
              { value: "15+", label: "Years in Practice" },
              { value: "2,500+", label: "Cases Represented" },
              { value: "99%", label: "Client Satisfaction" },
              { value: "6 Days", label: "Chambers Availability" },
            ].map((stat, index) => (
              <div
                key={stat.label}
                className={`hero-stat flex min-w-0 flex-col items-start gap-1 border-slate-800/80 px-5 py-4 sm:flex-row sm:items-center sm:gap-3 sm:px-6 lg:py-5 ${
                  index >= 2 ? "border-t lg:border-t-0" : ""
                }`}
                style={{ "--hero-delay": `${320 + index * 70}ms` } as CSSProperties}
              >
                <div className="hero-display text-3xl font-bold leading-none text-blue-400 sm:text-3xl">
                  {stat.value}
                </div>
                <div className="max-w-32 text-xs font-medium leading-tight text-slate-400">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="hidden border-b border-slate-800 bg-[#070c14] lg:block">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-slate-800/60 px-0 sm:grid-cols-4">
          {[
            { icon: ShieldCheck, t: "Bar Council Advocates" },
            { icon: Clock, t: "Punctual Consultations" },
            { icon: Award, t: "Strategic Case Legal Framework" },
            { icon: Users, t: "Client-Centric Privacy" },
          ].map((f) => (
            <div
              key={f.t}
              className="flex min-h-16 items-center justify-center gap-2.5 bg-[#070c14] px-4 text-center"
            >
              <f.icon className="h-4 w-4 shrink-0 text-blue-500" aria-hidden="true" />
              <span className="text-xs font-medium text-slate-300 sm:text-sm">{f.t}</span>
            </div>
          ))}
        </div>
      </section>

      <DeferredSection fallback={<HomeDeferredFallback />} rootMargin="700px">
        <Suspense fallback={<HomeDeferredFallback />}>
          <HomeDeferredSections />
        </Suspense>
      </DeferredSection>
    </>
  );
}

function HomeDeferredFallback() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8" aria-hidden="true">
      <div className="mx-auto max-w-2xl space-y-3 text-center">
        <Skeleton className="mx-auto h-4 w-28 bg-slate-800" />
        <Skeleton className="mx-auto h-9 w-72 max-w-full bg-slate-800" />
        <Skeleton className="mx-auto h-4 w-full max-w-lg bg-slate-800" />
      </div>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <Skeleton className="aspect-[4/3] w-full rounded-lg bg-slate-800" />
            <Skeleton className="mt-5 h-5 w-2/3 bg-slate-800" />
            <Skeleton className="mt-3 h-4 w-full bg-slate-800" />
          </div>
        ))}
      </div>
    </div>
  );
}

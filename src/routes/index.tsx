import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import {
  ArrowRight,
  ShieldCheck,
  Clock,
  Users,
  Award,
  Check,
  CalendarDays,
  Scale,
  Home,
  ChevronRight,
  User,
  Lock,
  Quote,
  BadgeCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DeferredSection } from "@/components/DeferredSection";
// Fixed static law-themed hero image — does NOT depend on gallery_images
import heroLawImg from "@/assets/hero-law.jpg";
// Advocate fallback — professional Indian advocate in black coat with white bands
import advocateFallbackImg from "@/assets/advocate-fallback.jpg";
import { LAW_FIRM, getDoctorImage } from "@/lib/clinic-data";
import { useHeroContent } from "@/hooks/use-supabase-data";

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
  const heroDoctorExperience = heroDoctor?.experience || "";
  // Use custom Supabase photo if available; otherwise use advocate fallback (not a doctor image)
  const heroDoctorPhoto = heroDoctor
    ? getDoctorImage(heroDoctor.id, heroDoctor.photo) || advocateFallbackImg
    : advocateFallbackImg;

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

      {/* HERO TOP / CONTEXT BREADCRUMB BAR */}
      <div className="relative z-20 mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between rounded-xl bg-[#F4F5F7] px-5 py-3 text-xs font-medium text-slate-700 shadow-sm border border-slate-200/60">
          <div className="flex items-center gap-2">
            <Home className="h-4 w-4 text-slate-500" aria-hidden="true" />
            <span className="text-slate-500">Home</span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
            <span className="font-semibold text-slate-900">
              Trusted Legal Representation, Clear Advice
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-slate-600 font-medium">
            <ShieldCheck className="h-4 w-4 text-slate-500" aria-hidden="true" />
            <span>Your Rights. Our Responsibility.</span>
          </div>
        </div>
      </div>

      {/* HERO SECTION */}
      <section className="private-hero relative isolate overflow-hidden bg-[#03142B] pb-20 pt-8 sm:pb-28 lg:pb-36 lg:pt-12">
        {/* FIXED LAW-THEMED BACKGROUND — static asset, no gallery dependency */}
        <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
          <img
            src={heroLawImg}
            alt=""
            className="h-full w-full object-cover object-center filter brightness-[0.22] contrast-[1.05]"
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, rgba(3,20,43,0.97) 0%, rgba(3,20,43,0.92) 40%, rgba(3,20,43,0.72) 65%, rgba(3,20,43,0.38) 100%)",
            }}
          />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:items-center">
            {/* LEFT COLUMN */}
            <div className="hero-enter relative z-10 pt-4">
              <div className="inline-flex items-center gap-2.5 rounded-full border border-[#D6A85F]/30 bg-[#F5F4EF] px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#061A35] shadow-md backdrop-blur-md">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-[#D6A85F] text-[#061A35]">
                  <Scale className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />
                </span>
                <span>Independent Advocates • Confidential Counsel</span>
              </div>

              <h1 className="hero-display mt-6 max-w-2xl font-serif text-4xl sm:text-5xl lg:text-[4.25rem] xl:text-[4.5rem] font-medium leading-[1.02] tracking-tight">
                <span className="block text-[#F5F4EF]">Clear legal advice.</span>
                <span className="block text-[#D6A85F] font-serif mt-1">Measured representation.</span>
              </h1>

              <p className="mt-6 max-w-[560px] text-base leading-relaxed text-[#E6ECF3] sm:text-lg lg:text-[18px]">
                {LAW_FIRM.name} helps you understand your position, your options, and the next step —
                with direct consultation from{" "}
                <strong className="text-white font-semibold">{heroDoctorName}</strong>
                {heroDoctorSpecialization ? `, ${heroDoctorSpecialization}` : ""}.
              </p>

              <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-[560px]" aria-label="Firm assurances">
                {[
                  "Privileged client communications",
                  `Consultations ${LAW_FIRM.workingDays}`,
                  "Direct advocate access",
                ].map((label) => (
                  <div key={label} className="flex items-center gap-2.5">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#D6A85F]/20 text-[#D6A85F] border border-[#D6A85F]/50">
                      <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
                    </span>
                    <span className="text-sm font-medium text-[#F5F4EF]">{label}</span>
                  </div>
                ))}
              </div>

              <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
                <Button
                  asChild
                  size="lg"
                  className="group min-h-12 rounded-[12px] bg-[#F5F4EF] px-[26px] py-[14px] text-base font-semibold text-[#061A35] hover:bg-white shadow-xl transition-all duration-200 hover:-translate-y-0.5 border-0"
                >
                  <Link to="/appointment" className="inline-flex items-center gap-2">
                    <CalendarDays className="h-4.5 w-4.5 text-[#061A35]" aria-hidden="true" />
                    <span>Book a Consultation</span>
                    <ArrowRight
                      className="ml-1 h-4 w-4 text-[#061A35] transition-transform duration-200 group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="min-h-12 rounded-[12px] border border-[#F5F4EF]/35 bg-transparent px-[26px] py-[14px] text-base font-semibold text-[#F5F4EF] hover:bg-[#F5F4EF]/10 hover:border-[#F5F4EF]/60 transition-all duration-200"
                >
                  <Link to="/doctors" className="inline-flex items-center gap-2">
                    <User className="h-4.5 w-4.5 text-[#F5F4EF]" aria-hidden="true" />
                    <span>Meet Our Lawyers</span>
                  </Link>
                </Button>
              </div>

              <div className="mt-6 flex items-center gap-2 text-xs text-[#F5F4EF]/80">
                <Lock className="h-3.5 w-3.5 text-[#D6A85F]" aria-hidden="true" />
                <span>Your matter is confidential and protected</span>
              </div>
            </div>

            {/* RIGHT COLUMN — FIXED LAW IMAGE + PROMINENT ADVOCATE CARD */}
            <div className="hero-enter hero-enter-late relative">
              {/* Law-themed image panel */}
              <div className="relative overflow-hidden rounded-[20px] border border-white/15 bg-slate-950 shadow-2xl">
                <img
                  src={heroLawImg}
                  alt="Law chambers with scales of justice, law books, and the Indian Constitution"
                  width={1280}
                  height={854}
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                  className="block h-auto w-full object-cover object-center lg:h-[520px] filter brightness-[0.88] contrast-[1.05]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#03142B]/75 via-transparent to-transparent" />

                {/* STATUS BADGE */}
                <div className="absolute left-5 top-5 inline-flex items-center gap-2.5 rounded-full border border-slate-200/80 bg-[#F5F4EF] px-4 py-2 text-xs font-semibold text-[#061A35] shadow-lg backdrop-blur-md">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22C55E] opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#22C55E]" />
                  </span>
                  <span>Accepting Legal Consultations</span>
                </div>
              </div>

              {/* FEATURED ADVOCATE FLOATING CARD — larger and more prominent */}
              <article
                className="hero-doctor-card relative z-20 mt-5 lg:mt-0 lg:absolute lg:-bottom-14 lg:-left-10 lg:w-[96%] lg:max-w-[580px] rounded-[20px] border-2 border-[#D6A85F]/40 bg-[#F5F4EF] p-6 sm:p-7 text-[#061A35] shadow-[0_24px_60px_rgba(0,0,0,0.32)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1"
                aria-label={`Featured Advocate: ${heroDoctorName}`}
              >
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-[auto_1fr_auto]">
                  {/* ADVOCATE PHOTO — large and prominent */}
                  <img
                    src={heroDoctorPhoto}
                    alt={`${heroDoctorName}, ${heroDoctorSpecialization} — Professional Advocate`}
                    width={400}
                    height={400}
                    loading="eager"
                    decoding="async"
                    className="h-28 w-28 sm:h-32 sm:w-32 shrink-0 rounded-2xl object-cover object-top ring-2 ring-[#B88745]/40 shadow-lg self-start"
                  />

                  {/* DETAILS */}
                  <div className="min-w-0 flex flex-col justify-center">
                    <div className="text-[0.62rem] font-bold uppercase tracking-widest text-[#B88745]">
                      Featured Advocate
                    </div>
                    <h2 className="mt-1 font-serif text-2xl font-bold text-[#061A35] leading-tight">
                      {heroDoctorName}
                    </h2>
                    <p className="text-sm font-medium text-[#334B68] mt-0.5 truncate">
                      {heroDoctorSpecialization}
                    </p>
                    {heroDoctorExperience && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-[#334B68]">
                        <User className="h-3.5 w-3.5 text-[#B88745] shrink-0" aria-hidden="true" />
                        <span>
                          {heroDoctorExperience}
                          {!heroDoctorExperience.toLowerCase().includes("experience") && " experience"}
                        </span>
                      </div>
                    )}
                    {heroDoctor?.id && (
                      <Link
                        to="/doctors/$lawyerId"
                        params={{ lawyerId: heroDoctor.id }}
                        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#061A35] hover:text-[#B88745] transition-colors w-fit"
                      >
                        <span>View full profile</span>
                        <ArrowRight className="h-3 w-3" aria-hidden="true" />
                      </Link>
                    )}
                  </div>

                  {/* RIGHT QUOTE — hidden on small screens */}
                  <div className="hidden sm:flex flex-col justify-center border-l border-slate-300/60 pl-5 max-w-[180px]">
                    <Quote className="h-5 w-5 text-[#B88745] fill-[#B88745]/20 shrink-0" aria-hidden="true" />
                    <p className="mt-1.5 font-serif text-xs leading-relaxed text-[#334B68] italic">
                      Dedicated to protecting your rights and securing the best possible outcome.
                    </p>
                  </div>
                </div>

                {/* BOTTOM CTA ROW */}
                <div className="mt-5 flex flex-col gap-2 pt-4 border-t border-slate-200/70 sm:flex-row sm:items-center sm:justify-between">
                  <Button
                    asChild
                    size="sm"
                    className="min-h-10 bg-[#061A35] hover:bg-[#0d2a50] text-[#F5F4EF] font-semibold rounded-xl text-xs px-5 shadow-md"
                  >
                    <Link to="/appointment" className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                      Book Consultation
                    </Link>
                  </Button>
                  <span className="inline-flex items-center gap-1.5 text-[0.7rem] font-medium text-[#334B68]">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#B88745]" aria-hidden="true" />
                    Confidential consultation
                  </span>
                </div>
              </article>
            </div>
          </div>

          {/* BOTTOM TRUST FEATURES BAR */}
          <div className="mt-24 lg:mt-28 rounded-2xl border border-slate-200/70 bg-[#F4F5F7] p-6 shadow-sm">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-slate-200/80">
              <div className="flex items-center gap-4 lg:px-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white text-[#C5A059] shadow-xs border border-slate-200/60">
                  <ShieldCheck className="h-6 w-6" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Confidential</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Client Confidentiality</p>
                </div>
              </div>

              <div className="flex items-center gap-4 lg:px-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white text-[#C5A059] shadow-xs border border-slate-200/60">
                  <Users className="h-6 w-6" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Direct Access</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Speak with your advocate</p>
                </div>
              </div>

              <div className="flex items-center gap-4 lg:px-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white text-[#C5A059] shadow-xs border border-slate-200/60">
                  <Clock className="h-6 w-6" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">6 Days a Week</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Consultations Mon–Sat</p>
                </div>
              </div>

              <div className="flex items-center gap-4 lg:px-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white text-[#C5A059] shadow-xs border border-slate-200/60">
                  <BadgeCheck className="h-6 w-6" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Trusted Expertise</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Years of proven experience</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="border-b border-[var(--site-border)] bg-[#08090d]">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-px bg-white/8 px-0 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: ShieldCheck, t: "Privileged client communications" },
            { icon: Clock, t: "Scheduled consultations" },
            { icon: Award, t: "Practice-led case preparation" },
            { icon: Users, t: "Direct advocate access" },
          ].map((f) => (
            <div
              key={f.t}
              className="flex min-h-16 items-center justify-center gap-2.5 bg-[#08090d] px-4 text-center"
            >
              <f.icon className="h-4 w-4 shrink-0 text-[var(--site-gold)]" aria-hidden="true" />
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
          <div key={index} className="rounded-xl border border-[var(--site-border)] bg-[var(--site-bg-card)] p-5">
            <Skeleton className="aspect-[4/3] w-full rounded-lg bg-slate-800" />
            <Skeleton className="mt-5 h-5 w-2/3 bg-slate-800" />
            <Skeleton className="mt-3 h-4 w-full bg-slate-800" />
          </div>
        ))}
      </div>
    </div>
  );
}

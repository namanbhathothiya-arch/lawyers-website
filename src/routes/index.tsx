import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, type CSSProperties } from "react";
import {
  ArrowRight,
  ShieldCheck,
  Clock,
  HeartPulse,
  Award,
  Phone,
  Check,
  CalendarDays,
  Cross,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/hero-clinic.jpg";
import doctorImg from "@/assets/doctor-1.jpg";
import { CLINIC, getDoctorImage } from "@/lib/clinic-data";
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
      { title: "HeartCare Advanced Clinic — Advanced Cardiac Care" },
      {
        name: "description",
        content:
          "Advanced cardiac care with compassion from Dr. Raj Sharma, specialist in Interventional Cardiology.",
      },
      { property: "og:title", content: "HeartCare Advanced Clinic — Advanced Cardiac Care" },
      {
        property: "og:description",
        content:
          "Advanced cardiac care with compassion from Dr. Raj Sharma, specialist in Interventional Cardiology.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://heartcareclinic.com/" },
      { property: "og:image", content: "https://heartcareclinic.com/og-image.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "HeartCare Advanced Clinic — Advanced Cardiac Care" },
      {
        name: "twitter:description",
        content:
          "Advanced cardiac care with compassion from Dr. Raj Sharma, specialist in Interventional Cardiology.",
      },
      { name: "twitter:image", content: "https://heartcareclinic.com/og-image.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://heartcareclinic.com/" }],
  }),
  component: HomePage,
});

function HomePage() {
  const { data: heroContent } = useHeroContent();

  const heroDoctor = heroContent?.doctor;
  const heroDoctorName = heroDoctor?.name || CLINIC.doctor;
  const heroDoctorSpecialization = heroDoctor?.specialization || CLINIC.specialization;
  const heroDoctorExperience = heroDoctor?.experience || "15+ years";
  const heroDoctorPhoto = heroDoctor ? getDoctorImage(heroDoctor.id, heroDoctor.photo) : doctorImg;
  const heroImage = heroContent?.image?.image_url || heroImg;
  const heroImageAlt =
    heroContent?.image?.title || "Bright consultation facilities at HeartCare Advanced Clinic";

  const clinicSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "MedicalClinic",
        "@id": "https://heartcareclinic.com/#clinic",
        name: CLINIC.name,
        url: "https://heartcareclinic.com",
        logo: "https://heartcareclinic.com/favicon.svg",
        image: "https://heartcareclinic.com/og-image.jpg",
        description:
          "Advanced cardiac care with compassion from Dr. Raj Sharma, specialist in Interventional Cardiology.",
        telephone: CLINIC.phone,
        email: CLINIC.email,
        address: {
          "@type": "PostalAddress",
          streetAddress: "123 Medical Plaza",
          addressLocality: "New Delhi",
          addressCountry: "IN",
        },
        openingHoursSpecification: [
          {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            opens: "09:00",
            closes: "18:00",
          },
        ],
      },
      {
        "@type": "LocalBusiness",
        "@id": "https://heartcareclinic.com/#business",
        name: CLINIC.name,
        image: "https://heartcareclinic.com/og-image.jpg",
        telephone: CLINIC.phone,
        url: "https://heartcareclinic.com",
        address: {
          "@type": "PostalAddress",
          streetAddress: "123 Medical Plaza",
          addressLocality: "New Delhi",
          addressCountry: "IN",
        },
        priceRange: "$$",
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json">{JSON.stringify(clinicSchema)}</script>
      {/* HERO */}
      <section className="private-hero relative isolate overflow-hidden border-b border-primary/10">
        <div className="private-hero-grid absolute inset-0 -z-20" />
        <div className="absolute -left-24 top-8 -z-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -right-20 bottom-8 -z-10 h-80 w-80 rounded-full bg-accent/70 blur-3xl" />

        <div className="mx-auto grid max-w-7xl gap-10 px-0 pb-10 pt-0 sm:px-6 sm:pb-14 sm:pt-6 lg:grid-cols-[0.94fr_1.06fr] lg:items-center lg:gap-16 lg:px-8 lg:pb-16 lg:pt-16">
          <div className="hero-enter relative z-10 order-2 px-4 sm:px-0 lg:order-1">
            <div className="inline-flex items-center gap-2 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
              <span className="grid h-7 w-7 place-items-center rounded-full border border-primary/20 bg-white/80 shadow-sm">
                <Cross className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" />
              </span>
              Private consultant-led care
            </div>

            <h1 className="hero-display mt-6 max-w-2xl text-[2.85rem] leading-[0.98] text-foreground sm:text-6xl lg:text-[4.6rem]">
              Exceptional heart care, <span className="text-primary">made personal.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              Advanced cardiac expertise in a calm, private setting. Every consultation with{" "}
              {heroDoctorName} is unhurried, precise, and shaped around you.
            </p>

            <div className="mt-7 flex items-center gap-3 border-t border-primary/10 pt-5 text-sm text-muted-foreground lg:hidden">
              <CalendarDays className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span>
                Open {CLINIC.workingDays} ·{" "}
                <strong className="font-semibold text-foreground">{CLINIC.workingHours}</strong>
              </span>
            </div>

            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-3" aria-label="Clinic assurances">
              {["Same-week consultations", "Transparent care plans", "Modern diagnostics"].map(
                (label) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-2 text-sm font-medium text-foreground/80"
                  >
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-success/10 text-success">
                      <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
                    </span>
                    {label}
                  </span>
                ),
              )}
            </div>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                asChild
                size="lg"
                className="group min-h-14 w-full rounded-full px-7 text-[0.95rem] shadow-[0_16px_35px_-15px_var(--color-primary)] sm:w-auto"
              >
                <Link to="/appointment">
                  Book Appointment
                  <ArrowRight
                    className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="min-h-14 w-full rounded-full border-primary/20 bg-white/70 px-7 text-[0.95rem] shadow-sm backdrop-blur hover:bg-white sm:w-auto"
              >
                <a
                  href={`tel:${CLINIC.phone}`}
                  aria-label={`Call ${CLINIC.name} at ${CLINIC.phone}`}
                >
                  <Phone className="mr-2 h-4 w-4 text-primary" aria-hidden="true" />
                  Call Now
                </a>
              </Button>
            </div>

            <div className="mt-8 hidden items-center gap-3 border-t border-primary/10 pt-6 text-sm text-muted-foreground lg:flex">
              <CalendarDays className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span>
                Open {CLINIC.workingDays} ·{" "}
                <strong className="font-semibold text-foreground">{CLINIC.workingHours}</strong>
              </span>
            </div>
          </div>

          <div className="hero-enter hero-enter-late relative order-1 mx-auto w-full max-w-2xl lg:order-2 lg:max-w-none">
            <div className="relative lg:pb-16 lg:pl-10">
              <div className="absolute -right-3 -top-3 hidden h-full w-[88%] rounded-[2rem] border border-primary/15 lg:block lg:right-5 lg:top-5" />
              <div className="relative overflow-hidden bg-muted shadow-[0_35px_80px_-35px_rgba(16,45,75,0.45)] sm:rounded-[2.25rem] lg:rounded-[2.25rem]">
                <img
                  src={heroImage}
                  alt={heroImageAlt}
                  width={1600}
                  height={1024}
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                  className="block h-auto w-full object-contain object-top lg:h-[570px] lg:object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#102d4b]/60 via-transparent to-white/5" />
                <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/90 px-3.5 py-2 text-xs font-semibold text-foreground shadow-lg backdrop-blur sm:left-7 sm:top-7">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                  </span>
                  Accepting appointments
                </div>
                <div className="absolute bottom-6 right-6 hidden rounded-2xl border border-white/30 bg-[#102d4b]/75 px-4 py-3 text-white shadow-xl backdrop-blur-md sm:block">
                  <div className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-white/65">
                    Our promise
                  </div>
                  <div className="mt-1 text-sm font-semibold">Time, clarity & continuity</div>
                </div>
              </div>

              <article className="hero-doctor-card relative z-10 mx-4 mt-3 rounded-2xl border border-white/70 bg-white/95 p-4 shadow-[0_24px_60px_-24px_rgba(16,45,75,0.5)] backdrop-blur-xl sm:mx-0 sm:w-full sm:rounded-3xl sm:p-5 lg:absolute lg:bottom-0 lg:left-0 lg:mt-0 lg:w-[73%] lg:max-w-md">
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    <img
                      src={heroDoctorPhoto}
                      alt={`${heroDoctorName}, ${heroDoctorSpecialization}`}
                      width={256}
                      height={256}
                      loading="eager"
                      decoding="async"
                      className="h-20 w-20 rounded-2xl object-cover object-top ring-1 ring-primary/10 sm:h-24 sm:w-24"
                    />
                    <span className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-primary text-white">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[0.62rem] font-bold uppercase tracking-[0.17em] text-primary">
                      Featured consultant
                    </div>
                    <h2 className="mt-1 truncate text-lg font-bold text-card-foreground sm:text-xl">
                      {heroDoctorName}
                    </h2>
                    <p className="mt-0.5 truncate text-xs font-medium text-muted-foreground sm:text-sm">
                      {heroDoctorSpecialization}
                    </p>
                    <div className="mt-2.5 flex items-center gap-1.5 text-xs font-semibold text-foreground/80 sm:text-sm">
                      <Award className="h-4 w-4 text-primary" aria-hidden="true" />
                      {heroDoctorExperience}
                      {!heroDoctorExperience.toLowerCase().includes("experience") && " experience"}
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 sm:pb-10 lg:px-8">
          <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-primary/10 bg-white/75 shadow-[0_20px_50px_-35px_rgba(16,45,75,0.35)] backdrop-blur-md lg:grid-cols-4">
            {[
              { value: "15+", label: "Years of specialist care" },
              { value: "10k+", label: "Patients supported" },
              { value: "98%", label: "Patient satisfaction" },
              { value: "6 days", label: "Weekly availability" },
            ].map((stat, index) => (
              <div
                key={stat.label}
                className={`hero-stat flex min-w-0 flex-col items-start gap-1 border-primary/10 px-4 py-4 sm:flex-row sm:items-center sm:gap-3 sm:px-6 lg:py-5 ${
                  index >= 2 ? "border-t lg:border-t-0" : ""
                }`}
                style={{ "--hero-delay": `${320 + index * 70}ms` } as CSSProperties}
              >
                <div className="hero-display text-3xl leading-none text-primary sm:text-[2.15rem]">
                  {stat.value}
                </div>
                <div className="max-w-28 text-xs font-medium leading-4 text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="hidden border-b border-border bg-background lg:block">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-border/70 px-0 sm:grid-cols-4">
          {[
            { icon: ShieldCheck, t: "Verified specialist" },
            { icon: Clock, t: "On-time appointments" },
            { icon: Award, t: "Evidence-based care" },
            { icon: HeartPulse, t: "Patient-first approach" },
          ].map((f) => (
            <div
              key={f.t}
              className="flex min-h-20 items-center justify-center gap-2.5 bg-background px-3 text-center"
            >
              <f.icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span className="text-xs font-semibold text-foreground/75 sm:text-sm">{f.t}</span>
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
        <Skeleton className="mx-auto h-4 w-28" />
        <Skeleton className="mx-auto h-9 w-72 max-w-full" />
        <Skeleton className="mx-auto h-4 w-full max-w-lg" />
      </div>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-3xl border border-border bg-card p-5">
            <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
            <Skeleton className="mt-5 h-5 w-2/3" />
            <Skeleton className="mt-3 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-4/5" />
          </div>
        ))}
      </div>
    </div>
  );
}

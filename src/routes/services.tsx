import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { type DBService, useServices } from "@/hooks/use-supabase-data";
import {
  Activity,
  ArrowRight,
  Check,
  ChevronDown,
  ClipboardCheck,
  HeartPulse,
  Microscope,
  ScanHeart,
  ShieldCheck,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CLINIC } from "@/lib/clinic-data";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ImageCarousel } from "@/components/ImageCarousel";
import { getServiceImageList } from "@/lib/image-lists";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services & Pricing — HeartCare Advanced Clinic" },
      {
        name: "description",
        content:
          "Explore consultations, cardiac screenings, and services at HeartCare Advanced Clinic.",
      },
      { property: "og:title", content: "Services & Pricing — HeartCare Advanced Clinic" },
      {
        property: "og:description",
        content:
          "Explore consultations, cardiac screenings, and services at HeartCare Advanced Clinic.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://heartcareclinic.com/services" },
      { property: "og:image", content: "https://heartcareclinic.com/og-image.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Services & Pricing — HeartCare Advanced Clinic" },
      {
        name: "twitter:description",
        content:
          "Explore consultations, cardiac screenings, and services at HeartCare Advanced Clinic.",
      },
      { name: "twitter:image", content: "https://heartcareclinic.com/og-image.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://heartcareclinic.com/services" }],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  const { data: services, isLoading, isError, error, refetch } = useServices();

  const servicesSchema = useMemo(() => {
    if (!services) return null;
    return {
      "@context": "https://schema.org",
      "@graph": services.map((s) => {
        const priceNum = s.price ? s.price.replace(/[^\d]/g, "") : "0";
        return {
          "@type": "MedicalService",
          "@id": `https://heartcareclinic.com/services#${s.id}`,
          name: s.name,
          description: s.description,
          provider: {
            "@type": "MedicalClinic",
            name: CLINIC.name,
            address: CLINIC.address,
          },
          offers: {
            "@type": "Offer",
            price: priceNum,
            priceCurrency: "INR",
          },
        };
      }),
    };
  }, [services]);

  return (
    <main className="relative isolate overflow-hidden">
      {servicesSchema && (
        <script type="application/ld+json">{JSON.stringify(servicesSchema)}</script>
      )}

      <section className="relative border-b border-primary/10 bg-[linear-gradient(135deg,oklch(0.985_0.012_230),white_52%,oklch(0.96_0.04_205))]">
        <div className="absolute inset-0 -z-10 opacity-70 [background-image:radial-gradient(circle_at_18%_20%,color-mix(in_oklab,var(--color-primary)_13%,transparent),transparent_27%),radial-gradient(circle_at_85%_72%,color-mix(in_oklab,var(--color-accent)_75%,transparent),transparent_30%)]" />
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1fr_auto] lg:items-end lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/75 px-3.5 py-2 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-primary shadow-sm backdrop-blur">
              <HeartPulse className="h-3.5 w-3.5" aria-hidden="true" />
              Specialist services
            </div>
            <h1 className="hero-display mt-6 text-5xl leading-[0.98] sm:text-6xl lg:text-7xl">
              Thoughtful care, <span className="text-primary">clearly priced.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              From consultation to diagnostics, every service is delivered with clinical precision,
              personal attention, and a clear next step.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:flex">
            {[
              { value: "20+", label: "Minute visits" },
              { value: "7 days", label: "Follow-up support" },
            ].map((item) => (
              <div
                key={item.label}
                className="min-w-32 rounded-2xl border border-white/70 bg-white/75 px-5 py-4 shadow-[0_18px_45px_-30px_rgba(16,45,75,0.55)] backdrop-blur"
              >
                <div className="hero-display text-2xl text-primary">{item.value}</div>
                <div className="mt-1 text-xs font-medium text-muted-foreground">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
              Our care catalogue
            </div>
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Choose the care you need</h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-muted-foreground">
            Select any service to view what it includes, then book directly with the service already
            chosen for you.
          </p>
        </div>

        {isLoading ? (
          <ServicesSkeleton />
        ) : isError ? (
          <ErrorState message={error?.message || "Unknown error"} retry={refetch} />
        ) : !services || services.length === 0 ? (
          <EmptyState
            title="No services found"
            description="There are no services registered in the database yet. Please configure them in the admin dashboard."
          />
        ) : (
          <Carousel
            opts={{ align: "start" }}
            className="mt-10 lg:mt-12"
            aria-label="Services carousel"
          >
            <CarouselContent className="-ml-5">
              {services.map((service, index) => (
                <CarouselItem key={service.id} className="min-w-0 basis-full pl-5 lg:basis-1/3">
                  <ServiceCard service={service} index={index} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="mt-6 flex items-center justify-center gap-3">
              <CarouselPrevious className="static h-10 w-10 translate-y-0 border-primary/20 bg-white/85 text-primary shadow-sm backdrop-blur hover:bg-primary hover:text-primary-foreground" />
              <CarouselNext className="static h-10 w-10 translate-y-0 border-primary/20 bg-white/85 text-primary shadow-sm backdrop-blur hover:bg-primary hover:text-primary-foreground" />
            </div>
          </Carousel>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8 lg:pb-24">
        <div className="relative overflow-hidden rounded-[2rem] bg-[#102d4b] px-6 py-9 text-white shadow-[0_30px_80px_-38px_rgba(16,45,75,0.7)] sm:px-10 sm:py-12 lg:grid lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-14 lg:px-14">
          <div className="absolute -right-24 -top-32 h-80 w-80 rounded-full bg-primary/35 blur-3xl" />
          <div className="relative">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
              The HeartCare standard
            </div>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">What’s always included</h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-white/65">
              Considered care extends beyond the consultation room. These essentials are part of
              every appointment.
            </p>
          </div>
          <ul className="relative mt-8 grid gap-3 sm:grid-cols-2 lg:mt-0">
            {[
              "Unhurried 20+ minute consultations",
              "Digital prescription & records",
              "Free 7-day follow-up message",
              "Transparent, all-inclusive pricing",
            ].map((promise) => (
              <li
                key={promise}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3.5 text-sm font-medium backdrop-blur"
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/10 text-[#77dfba]">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
                </span>
                {promise}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}

function ServiceCard({ service, index }: { service: DBService; index: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const Icon = getServiceIcon(service.name);
  const serviceImages = getServiceImageList(service as unknown as Record<string, unknown>).map(
    (src, imageIndex) => ({
      src,
      alt: imageIndex === 0 ? service.name : `${service.name} image ${imageIndex + 1}`,
    }),
  );
  const description =
    service.description?.trim() ||
    "A focused, consultant-led service with a clear assessment and personalised next steps.";

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} asChild>
      <article className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-[1.6rem] border border-primary/10 bg-card shadow-[0_16px_55px_-40px_rgba(16,45,75,0.65)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-[0_28px_70px_-38px_rgba(16,45,75,0.6)]">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-primary/65 to-accent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        {serviceImages.length > 0 && (
          <div className="aspect-[16/10] border-b border-border/70 bg-secondary/50">
            <ImageCarousel
              images={serviceImages}
              label={`${service.name} image gallery`}
              className="h-full"
              frameClassName="p-3"
              imageClassName="rounded-2xl"
              emptyLabel="Service image coming soon"
            />
          </div>
        )}
        <div className="min-w-0 flex-1 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary-light text-primary ring-1 ring-primary/10 transition-all duration-300 group-hover:scale-105 group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-lg">
              <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
            </div>
            <span className="pt-1 text-[0.66rem] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
              {String(index + 1).padStart(2, "0")}
            </span>
          </div>

          <div className="mt-6 min-w-0">
            <h3 className="min-w-0 break-words text-xl font-bold leading-snug text-card-foreground [overflow-wrap:anywhere]">
              {service.name}
            </h3>
            <p
              className={`mt-3 min-w-0 break-words text-sm leading-6 text-muted-foreground [overflow-wrap:anywhere] ${
                isOpen ? "" : "max-h-[3.75rem] overflow-hidden"
              }`}
            >
              {description}
            </p>
          </div>

          <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
            <div className="mt-4 rounded-2xl bg-secondary/60 p-4">
              <div className="flex items-start gap-2.5 text-sm leading-6 text-foreground/75">
                <ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                <span>
                  Includes a consultant review, clear clinical guidance, and a documented care plan
                  where appropriate.
                </span>
              </div>
            </div>
          </CollapsibleContent>

          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="mt-4 inline-flex min-h-9 items-center gap-1.5 rounded-lg text-xs font-bold text-primary outline-none transition-colors hover:text-primary/75 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label={`${isOpen ? "Hide" : "View"} details for ${service.name}`}
            >
              {isOpen ? "Hide details" : "View details"}
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>
          </CollapsibleTrigger>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-border/80 bg-secondary/25 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <div className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Starting at
            </div>
            <div className="mt-0.5 break-words text-xl font-bold text-primary [overflow-wrap:anywhere]">
              {service.price}
            </div>
          </div>
          <Button
            asChild
            className="group/button rounded-full px-5 shadow-[0_12px_28px_-16px_var(--color-primary)]"
          >
            <Link to="/appointment" search={{ service: service.id }}>
              Book now
              <ArrowRight
                className="ml-1 h-4 w-4 transition-transform group-hover/button:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          </Button>
        </div>
      </article>
    </Collapsible>
  );
}

function getServiceIcon(name: string): LucideIcon {
  const normalizedName = name.toLowerCase();

  if (/(echo|ecg|ekg|scan|imaging|ultrasound)/.test(normalizedName)) return ScanHeart;
  if (/(test|lab|blood|pathology)/.test(normalizedName)) return Microscope;
  if (/(screen|check|assessment|evaluation)/.test(normalizedName)) return ClipboardCheck;
  if (/(heart|cardiac|cardio)/.test(normalizedName)) return HeartPulse;
  if (/(monitor|holter|pressure)/.test(normalizedName)) return Activity;
  if (/(prevent|risk|wellness)/.test(normalizedName)) return ShieldCheck;

  return Stethoscope;
}

function ServicesSkeleton() {
  return (
    <div className="mt-10 grid gap-5 md:grid-cols-2 lg:mt-12 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-[1.6rem] border border-border bg-card">
          <div className="space-y-5 p-6">
            <div className="flex justify-between">
              <Skeleton className="h-12 w-12 rounded-2xl" />
              <Skeleton className="h-3 w-6" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
            <Skeleton className="h-8 w-24" />
          </div>
          <div className="flex items-center justify-between border-t border-border bg-secondary/25 px-6 py-4">
            <div>
              <Skeleton className="mb-2 h-3 w-16" />
              <Skeleton className="h-6 w-20" />
            </div>
            <Skeleton className="h-10 w-28 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ErrorState({ message, retry }: { message: string; retry: () => void }) {
  return (
    <div className="mt-12 p-8 rounded-2xl bg-destructive/10 border border-destructive/20 text-center max-w-xl mx-auto">
      <p className="text-destructive font-medium">Failed to load database records</p>
      <p className="text-sm text-muted-foreground mt-1">{message}</p>
      <Button variant="outline" size="sm" className="mt-4" onClick={retry}>
        Try Again
      </Button>
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="mt-12 p-12 rounded-2xl border border-dashed border-border text-center max-w-md mx-auto">
      <p className="font-semibold text-lg">{title}</p>
      <p className="text-sm text-muted-foreground mt-2">{description}</p>
    </div>
  );
}

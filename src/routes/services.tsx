import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { type DBService, useLegalServices } from "@/hooks/use-supabase-data";
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  Check,
  ChevronDown,
  FileText,
  Gavel,
  Landmark,
  Scale,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { LAW_FIRM } from "@/lib/clinic-data";
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
      { title: `Legal Services & Practice Areas — ${LAW_FIRM.name}` },
      {
        name: "description",
        content: `Explore legal services, consultations, and court representation at ${LAW_FIRM.name}.`,
      },
      { property: "og:title", content: `Legal Services & Practice Areas — ${LAW_FIRM.name}` },
      {
        property: "og:description",
        content: `Explore legal services, consultations, and court representation at ${LAW_FIRM.name}.`,
      },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://sharmalaw.in/services" }],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  const { data: services, isLoading, isError, error, refetch } = useLegalServices();

  const servicesSchema = useMemo(() => {
    if (!services) return null;
    return {
      "@context": "https://schema.org",
      "@graph": services.map((s) => {
        const priceNum = s.price ? s.price.replace(/[^\d]/g, "") : "0";
        return {
          "@type": "LegalService",
          "@id": `https://sharmalaw.in/services#${s.id}`,
          name: s.name,
          description: s.description,
          provider: {
            "@type": "ProfessionalService",
            name: LAW_FIRM.name,
            address: LAW_FIRM.address,
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
    <main className="relative isolate overflow-hidden bg-[#070c14] text-slate-100 min-h-screen">
      {servicesSchema && (
        <script type="application/ld+json">{JSON.stringify(servicesSchema)}</script>
      )}

      {/* HEADER HERO */}
      <section className="relative border-b border-slate-800/80 bg-gradient-to-b from-[#09101d] to-[#070c14]">
        <div className="absolute inset-0 -z-10 opacity-40 [background-image:radial-gradient(circle_at_18%_20%,rgba(37,99,235,0.18),transparent_40%)]" />
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1fr_auto] lg:items-end lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/25 bg-blue-950/60 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-widest text-blue-400 shadow-sm backdrop-blur">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Practice Areas & Legal Solutions
            </div>
            <h1 className="mt-6 font-serif text-4xl leading-tight font-bold text-white sm:text-6xl lg:text-7xl">
              Strategic Counsel, <span className="text-blue-500">Transparent Fees.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg sm:leading-8">
              From preliminary case assessment to court representation, every service is delivered with legal rigor, absolute confidentiality, and strategic foresight.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:flex">
            {[
              { value: "30+ Mins", label: "Focused Consultation" },
              { value: "Confidential", label: "Privileged Advice" },
            ].map((item) => (
              <div
                key={item.label}
                className="min-w-36 rounded-xl border border-slate-800 bg-slate-900/80 px-5 py-4 shadow-lg backdrop-blur"
              >
                <div className="font-serif text-2xl font-bold text-blue-400">{item.value}</div>
                <div className="mt-1 text-xs font-medium text-slate-400">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES CATALOG */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-blue-400">
              Legal Services
            </div>
            <h2 className="mt-2 font-serif text-3xl font-bold text-white sm:text-4xl">Select your required legal service</h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-slate-400">
            Choose any legal service to view comprehensive details, deliverables, and book directly with your advocate.
          </p>
        </div>

        {isLoading ? (
          <ServicesSkeleton />
        ) : isError ? (
          <ErrorState message={error?.message || "Unknown error"} retry={refetch} />
        ) : !services || services.length === 0 ? (
          <EmptyState
            title="No services found"
            description="There are no services configured in the database yet."
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
            <div className="mt-8 flex items-center justify-center gap-3">
              <CarouselPrevious className="static h-10 w-10 translate-y-0 border-slate-700 bg-slate-900 text-slate-200 hover:bg-blue-600 hover:text-white" />
              <CarouselNext className="static h-10 w-10 translate-y-0 border-slate-700 bg-slate-900 text-slate-200 hover:bg-blue-600 hover:text-white" />
            </div>
          </Carousel>
        )}
      </section>

      {/* COMMITMENT BANNER */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8 lg:pb-24">
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-[#0d1627] px-6 py-10 text-white shadow-2xl sm:px-10 sm:py-12 lg:grid lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-14 lg:px-14">
          <div className="absolute -right-24 -top-32 h-80 w-80 rounded-full bg-blue-600/15 blur-3xl" />
          <div className="relative">
            <div className="text-xs font-bold uppercase tracking-widest text-amber-400">
              Firm Commitment
            </div>
            <h2 className="mt-3 font-serif text-3xl font-bold text-white sm:text-4xl">What’s always included</h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-300">
              Every consultation at our chambers includes structured legal review and actionable counsel.
            </p>
          </div>
          <ul className="relative mt-8 grid gap-3.5 sm:grid-cols-2 lg:mt-0">
            {[
              "In-depth legal case analysis",
              "Documented strategy & next steps",
              "Clear professional advice",
              "Transparent, upfront fee schedule",
            ].map((promise) => (
              <li
                key={promise}
                className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-3.5 text-sm font-medium text-slate-200 backdrop-blur"
              >
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-blue-900/60 border border-blue-600/40 text-blue-400">
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
    "A focused, lawyer-led service providing strategic legal advice and clear representation.";

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} asChild>
      <article className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-800 bg-[#121b2d] text-slate-100 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-blue-600/50 hover:shadow-2xl">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-blue-500 to-amber-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        {serviceImages.length > 0 && (
          <div className="aspect-[16/10] border-b border-slate-800 bg-slate-950">
            <ImageCarousel
              images={serviceImages}
              label={`${service.name} image gallery`}
              className="h-full"
              frameClassName="p-3"
              imageClassName="rounded-xl"
              emptyLabel="Service image coming soon"
            />
          </div>
        )}
        <div className="min-w-0 flex-1 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-blue-950 border border-blue-600/40 text-blue-400 transition-all duration-300 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white">
              <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
            </div>
            <span className="pt-1 text-xs font-bold uppercase tracking-widest text-slate-500">
              {String(index + 1).padStart(2, "0")}
            </span>
          </div>

          <div className="mt-6 min-w-0">
            <h3 className="min-w-0 font-serif text-xl font-bold leading-snug text-white [overflow-wrap:anywhere]">
              {service.name}
            </h3>
            <p
              className={`mt-3 min-w-0 break-words text-sm leading-relaxed text-slate-300 [overflow-wrap:anywhere] ${
                isOpen ? "" : "max-h-[3.75rem] overflow-hidden"
              }`}
            >
              {description}
            </p>
          </div>

          <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/80 p-4">
              <div className="flex items-start gap-2.5 text-xs leading-relaxed text-slate-300">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" aria-hidden="true" />
                <span>
                  Includes advocate consultation, legal document review, and case strategy formulation.
                </span>
              </div>
            </div>
          </CollapsibleContent>

          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
              aria-label={`${isOpen ? "Hide" : "View"} details for ${service.name}`}
            >
              {isOpen ? "Hide Details" : "View Details"}
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>
          </CollapsibleTrigger>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-slate-800 bg-slate-900/60 px-6 py-4">
          <div className="min-w-0">
            <div className="text-[0.65rem] font-bold uppercase tracking-widest text-slate-400">
              Consultation Fee
            </div>
            <div className="mt-0.5 break-words font-serif text-xl font-bold text-blue-400 [overflow-wrap:anywhere]">
              {service.price}
            </div>
          </div>
          <Button
            asChild
            className="bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg px-4"
          >
            <Link to="/appointment" search={{ service: service.id }}>
              Book Now
              <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </article>
    </Collapsible>
  );
}

function getServiceIcon(name: string): LucideIcon {
  const normalizedName = name.toLowerCase();

  if (/(property|real estate|land|housing)/.test(normalizedName)) return Landmark;
  if (/(family|divorce|custody|marriage)/.test(normalizedName)) return BookOpen;
  if (/(corporate|business|company|commercial)/.test(normalizedName)) return Briefcase;
  if (/(criminal|defence|defense|bail)/.test(normalizedName)) return Gavel;
  if (/(civil|litigation|dispute|arbitration)/.test(normalizedName)) return Scale;
  if (/(document|draft|contract|agreement|registration)/.test(normalizedName)) return FileText;

  return Scale;
}

function ServicesSkeleton() {
  return (
    <div className="mt-10 grid gap-5 md:grid-cols-2 lg:mt-12 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
          <div className="space-y-5 p-6">
            <div className="flex justify-between">
              <Skeleton className="h-12 w-12 rounded-xl bg-slate-800" />
            </div>
            <Skeleton className="h-6 w-2/3 bg-slate-800" />
            <Skeleton className="h-4 w-full bg-slate-800" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ErrorState({ message, retry }: { message: string; retry: () => void }) {
  return (
    <div className="mt-12 p-8 rounded-xl bg-red-950/20 border border-red-900/50 text-center max-w-xl mx-auto text-slate-200">
      <p className="text-red-400 font-medium">Failed to load legal services</p>
      <p className="text-sm text-slate-400 mt-1">{message}</p>
      <Button variant="outline" size="sm" className="mt-4 border-slate-700 bg-slate-900" onClick={retry}>
        Try Again
      </Button>
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="mt-12 p-12 rounded-xl border border-dashed border-slate-800 text-center max-w-md mx-auto text-slate-200">
      <p className="font-semibold text-lg">{title}</p>
      <p className="text-sm text-slate-400 mt-2">{description}</p>
    </div>
  );
}

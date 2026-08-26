import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, Mail, MapPin, Phone, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ClinicGallery } from "@/components/ClinicGallery";
import { DoctorProfileCard } from "@/components/DoctorProfileCard";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { FAQSection } from "@/components/FAQSection";
import { HomeAboutSection } from "@/components/HomeAboutSection";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { LAW_FIRM } from "@/lib/clinic-data";
import { useDoctors, useLegalServices, useServiceSections } from "@/hooks/use-supabase-data";
import { getServiceIcon } from "@/lib/service-presentation";
import { getServiceSectionPathSlug } from "@/lib/service-slug";

export function HomeDeferredSections() {
  const {
    data: doctors,
    isLoading: loadingDoctors,
    isError: errorDoctors,
    error: docError,
    refetch: refetchDoctors,
  } = useDoctors();
  const {
    data: services,
    isLoading: loadingServices,
    isError: errorServices,
    error: svcError,
    refetch: refetchServices,
  } = useServiceSections();
  const { data: legalServices } = useLegalServices();

  return (
    <>
      <HomeAboutSection />

      <section
        id="gallery"
        className="bg-[#F8FAFC] border-b border-slate-200 py-16 sm:py-20"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Our Firm Chambers"
            title="Chambers & Office Gallery"
            subtitle="Explore our legal chambers, consultation rooms, conference hall, and research facilities."
          />
          <div className="mt-10">
            <ClinicGallery />
          </div>
        </div>
      </section>

      <section className="bg-[#F1F5F9] border-b border-slate-200 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Advocates"
            title="Meet our lawyers"
            subtitle="Scan specialization, experience, and how to reach each advocate on their own profile."
          />

          {loadingDoctors ? (
            <DoctorsSkeleton />
          ) : errorDoctors ? (
            <ErrorState message={docError?.message || "Unknown error"} retry={refetchDoctors} />
          ) : !doctors || doctors.length === 0 ? (
            <EmptyState
              title="No lawyers found"
              description="There are no lawyers registered in the database yet. Please configure them in the admin dashboard."
            />
          ) : (
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {doctors.slice(0, 4).map((doctor) => (
                <DoctorProfileCard key={doctor.id} doctor={doctor} compact />
              ))}
            </div>
          )}

          <div className="mt-10 text-center">
            <Button asChild variant="outline" className="min-h-11 border-slate-300 bg-white hover:bg-slate-50 text-slate-900 rounded-lg px-6 shadow-sm font-semibold">
              <Link to="/doctors">View all lawyers</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="bg-[#F8FAFC] border-b border-slate-200 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Practice Areas"
            title="Legal Service Sections"
            subtitle="Start with the broader practice area, then open the specific service and its dedicated lawyers."
          />

          {loadingServices ? (
            <ServicesSkeleton />
          ) : errorServices ? (
            <ErrorState message={svcError?.message || "Unknown error"} retry={refetchServices} />
          ) : !services || services.length === 0 ? (
            <EmptyState
              title="No service sections found"
              description="There are no published service sections in the database yet. Please configure them in the admin dashboard."
            />
          ) : (
            <Carousel
              opts={{ align: "start" }}
              className="mt-10"
              aria-label="Featured service sections carousel"
            >
              <CarouselContent className="-ml-5">
                {services.map((section) => (
                  <CarouselItem key={section.id} className="min-w-0 basis-full pl-5 lg:basis-1/3">
                    <HomeServiceCard section={section} allSections={services} allServices={legalServices || []} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="mt-8 flex items-center justify-center gap-3">
                <CarouselPrevious className="static h-11 w-11 translate-y-0 border-slate-300 bg-white text-slate-800 hover:bg-blue-600 hover:text-white shadow-sm" />
                <CarouselNext className="static h-11 w-11 translate-y-0 border-slate-300 bg-white text-slate-800 hover:bg-blue-600 hover:text-white shadow-sm" />
              </div>
            </Carousel>
          )}

          <div className="mt-10 text-center">
            <Button asChild variant="outline" className="min-h-11 border-slate-300 bg-white hover:bg-slate-50 text-slate-900 rounded-lg px-6 shadow-sm font-semibold">
              <Link to="/services">Explore All Practice Areas</Link>
            </Button>
          </div>
        </div>
      </section>

      <FAQSection />
      <TestimonialsSection />

      {/* CTA BANNER */}
      <section className="bg-[#F8FAFC] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-8 rounded-2xl border border-slate-800 bg-[#0B1630] p-8 text-white shadow-2xl lg:grid-cols-2 lg:p-12">
            <div>
              <span className="eyebrow border-blue-400/30 bg-white/[0.05] text-blue-300">Consultation</span>
              <h2 className="mt-4 font-serif text-3xl font-semibold text-white lg:text-4xl">Ready to speak with an advocate?</h2>
              <p className="mt-3 max-w-lg text-slate-300 text-sm leading-relaxed">
                Choose a practice area and advocate, then book a consultation slot. Chambers contact
                details below are for the firm; individual lawyers have their own numbers on their profiles.
              </p>
              <Button asChild size="lg" className="mt-6 min-h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg px-6 shadow-md border border-blue-500/20">
                <Link to="/appointment">
                  Book Consultation
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <ul className="space-y-4 rounded-xl border border-white/10 bg-white/[0.04] p-6 text-sm text-slate-300 backdrop-blur-md">
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-blue-400 shrink-0" aria-hidden="true" />
                <span>Chambers: <strong className="text-white font-medium">{LAW_FIRM.phone}</strong></span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-blue-400 shrink-0" aria-hidden="true" />
                <span>Email: <strong className="text-white font-medium">{LAW_FIRM.email}</strong></span>
              </li>
              <li className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-blue-400 shrink-0" aria-hidden="true" />
                <span>Address: <strong className="text-white font-medium">{LAW_FIRM.address}</strong></span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}

function HomeServiceCard({
  section,
  allSections,
  allServices,
}: {
  section: { id: string; name: string; slug?: string | null; description?: string | null };
  allSections: { id: string; name: string; slug?: string | null; description?: string | null }[];
  allServices?: { id: string; name: string; slug?: string | null }[];
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const description = section.description?.trim() || "Open this section to see the specific services inside it.";
  const Icon = getServiceIcon(section.name);
  const slug = getServiceSectionPathSlug(section, allSections, allServices || []);

  return (
    <Card className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl">
      <Link
        to="/services/$serviceSlug"
        params={{ serviceSlug: slug }}
        className="absolute inset-0 z-0 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 rounded-xl"
        aria-label={`Open ${section.name} section`}
      />
      <CardContent className="relative z-10 flex h-full min-w-0 flex-col p-6 pointer-events-none">
        <div className="flex min-w-0 items-start justify-between gap-4">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-blue-50 border border-blue-100 text-blue-600">
            <Icon className="h-4.5 w-4.5" aria-hidden="true" />
          </div>
          <h3 className="min-w-0 flex-1 font-serif text-lg font-bold leading-snug text-slate-900 pointer-events-auto">
            <Link to="/services/$serviceSlug" params={{ serviceSlug: slug }} className="hover:text-blue-600 transition-colors">
              {section.name}
            </Link>
          </h3>
        </div>
        <p
          className={`mt-3 min-w-0 break-words text-sm leading-relaxed text-slate-600 ${
            isExpanded ? "" : "max-h-[3.75rem] overflow-hidden"
          }`}
        >
          {description}
        </p>
        <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100 pointer-events-auto">
          <button
            type="button"
            className="inline-flex min-h-11 w-fit items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            aria-label={`${isExpanded ? "Collapse" : "Expand"} description for ${section.name}`}
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded((current) => !current);
            }}
          >
            {isExpanded ? "Show Less" : "Read Details"}
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </button>
          <Button asChild size="sm" className="min-h-10 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-xs shadow-sm" onClick={(e) => e.stopPropagation()}>
            <Link to="/services/$serviceSlug" params={{ serviceSlug: slug }}>Open</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">{eyebrow}</div>
      <h2 className="mt-2.5 font-serif text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-3 text-sm leading-relaxed text-slate-600">{subtitle}</p>}
    </div>
  );
}

function DoctorsSkeleton() {
  return (
    <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index} className="overflow-hidden border-slate-800 bg-slate-900">
          <Skeleton className="aspect-square w-full bg-slate-800" />
          <CardContent className="space-y-2 p-5">
            <Skeleton className="h-5 w-2/3 bg-slate-800" />
            <Skeleton className="h-4 w-1/2 bg-slate-800" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ServicesSkeleton() {
  return (
    <div className="mt-10 grid gap-5 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index} className="overflow-hidden border-slate-800 bg-slate-900">
          <CardContent className="space-y-3 p-6">
            <div className="flex items-start justify-between gap-4">
              <Skeleton className="h-6 w-2/3 bg-slate-800" />
              <Skeleton className="h-6 w-1/4 bg-slate-800" />
            </div>
            <Skeleton className="h-4 w-full bg-slate-800" />
            <Skeleton className="h-4 w-5/6 bg-slate-800" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ErrorState({ message, retry }: { message: string; retry: () => void }) {
  return (
    <div className="mx-auto mt-10 max-w-xl rounded-xl border border-red-900/50 bg-red-950/20 p-6 text-center text-slate-200">
      <p className="font-medium text-red-400">Failed to load database records</p>
      <p className="mt-1 text-sm text-slate-400">{message}</p>
      <Button variant="outline" size="sm" className="mt-4 border-slate-700 bg-slate-900" onClick={retry}>
        Try Again
      </Button>
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto mt-10 max-w-md rounded-xl border border-dashed border-slate-800 p-10 text-center text-slate-200">
      <p className="text-lg font-semibold">{title}</p>
      <p className="mt-2 text-sm text-slate-400">{description}</p>
    </div>
  );
}

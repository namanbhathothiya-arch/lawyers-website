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
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Collapsible, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ImageCarousel } from "@/components/ImageCarousel";
import { LAW_FIRM } from "@/lib/clinic-data";
import { getServiceImageList } from "@/lib/image-lists";
import { type DBService, useDoctors, useServices } from "@/hooks/use-supabase-data";

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
  } = useServices();

  return (
    <>
      <section
        id="gallery"
        className="mx-auto max-w-7xl scroll-mt-20 border-b border-slate-800/80 px-4 py-20 sm:px-6 lg:px-8"
      >
        <SectionHeader
          eyebrow="Our Firm Chambers"
          title="Chambers & Office Gallery"
          subtitle="Explore our legal chambers, consultation rooms, conference hall, and research facilities."
        />
        <ClinicGallery />
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Senior Counsel"
          title="Meet Our Featured Advocates"
          subtitle="Experienced legal practitioners committed to strategic representation and client success."
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
          <Button asChild variant="outline" className="border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200 rounded-xl px-6">
            <Link to="/doctors">View All Lawyers</Link>
          </Button>
        </div>
      </section>

      <section className="bg-[#0b1220] py-20 border-y border-slate-800/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Practice Areas"
            title="Legal Solutions Designed Around You"
            subtitle="From strategic legal advice to full litigation representation — transparent fee structure, every time."
          />

          {loadingServices ? (
            <ServicesSkeleton />
          ) : errorServices ? (
            <ErrorState message={svcError?.message || "Unknown error"} retry={refetchServices} />
          ) : !services || services.length === 0 ? (
            <EmptyState
              title="No legal services found"
              description="There are no services registered in the database yet. Please configure them in the admin dashboard."
            />
          ) : (
            <Carousel
              opts={{ align: "start" }}
              className="mt-10"
              aria-label="Featured services carousel"
            >
              <CarouselContent className="-ml-5">
                {services.map((service) => (
                  <CarouselItem key={service.id} className="min-w-0 basis-full pl-5 lg:basis-1/3">
                    <HomeServiceCard service={service} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="mt-8 flex items-center justify-center gap-3">
                <CarouselPrevious className="static h-10 w-10 translate-y-0 border-slate-700 bg-slate-900 text-slate-200 hover:bg-blue-600 hover:text-white" />
                <CarouselNext className="static h-10 w-10 translate-y-0 border-slate-700 bg-slate-900 text-slate-200 hover:bg-blue-600 hover:text-white" />
              </div>
            </Carousel>
          )}

          <div className="mt-10 text-center">
            <Button asChild variant="outline" className="border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200 rounded-xl px-6">
              <Link to="/services">Explore All Practice Areas</Link>
            </Button>
          </div>
        </div>
      </section>

      <FAQSection />
      <TestimonialsSection />

      {/* CTA BANNER */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="grid items-center gap-8 rounded-2xl border border-slate-800 bg-gradient-to-r from-blue-950 via-[#101828] to-slate-900 p-8 text-white shadow-2xl lg:grid-cols-2 lg:p-12">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Direct Consultation</span>
            <h2 className="mt-2 font-serif text-3xl font-bold text-white lg:text-4xl">Ready to consult an advocate?</h2>
            <p className="mt-3 max-w-lg text-slate-300 text-sm leading-relaxed">
              Book your legal consultation online in under a minute. Our chambers will confirm your appointment slot instantly.
            </p>
            <Button asChild size="lg" className="mt-6 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-950 px-6">
              <Link to="/appointment">
                Book Consultation
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <ul className="space-y-4 rounded-xl border border-slate-800/80 bg-slate-900/60 p-6 text-sm text-slate-300 backdrop-blur">
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
      </section>
    </>
  );
}

function HomeServiceCard({ service }: { service: DBService }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const description = service.description?.trim() || "Comprehensive legal evaluation and counsel.";
  const serviceImages = getServiceImageList(service as unknown as Record<string, unknown>).map(
    (src, index) => ({
      src,
      alt: index === 0 ? service.name : `${service.name} image ${index + 1}`,
    }),
  );

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded} asChild>
      <Card className="h-full min-w-0 overflow-hidden border-slate-800 bg-[#121b2d] text-slate-100 transition-all duration-300 hover:border-blue-600/50 hover:shadow-xl">
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
        <CardContent className="flex h-full min-w-0 flex-col p-6">
          <div className="flex min-w-0 items-start justify-between gap-4">
            <h3 className="min-w-0 font-serif text-lg font-bold leading-snug text-white [overflow-wrap:anywhere]">
              {service.name}
            </h3>
            <span className="min-w-0 max-w-[45%] shrink-0 break-words text-right font-bold text-blue-400 [overflow-wrap:anywhere]">
              {service.price}
            </span>
          </div>
          <p
            className={`mt-3 min-w-0 break-words text-sm leading-relaxed text-slate-300 [overflow-wrap:anywhere] ${
              isExpanded ? "" : "max-h-[3.75rem] overflow-hidden"
            }`}
          >
            {description}
          </p>
          <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-800/80">
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="inline-flex w-fit items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                aria-label={`${isExpanded ? "Collapse" : "Expand"} description for ${service.name}`}
              >
                {isExpanded ? "Show Less" : "Read Details"}
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </button>
            </CollapsibleTrigger>
            <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-xs">
              <Link to="/appointment" search={{ service: service.id }}>Book</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </Collapsible>
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
      <div className="text-xs font-bold uppercase tracking-widest text-blue-400">{eyebrow}</div>
      <h2 className="mt-2.5 font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-3 text-sm leading-relaxed text-slate-400">{subtitle}</p>}
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

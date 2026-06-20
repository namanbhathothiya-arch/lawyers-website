import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, Mail, MapPin, Phone } from "lucide-react";
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
import { CLINIC } from "@/lib/clinic-data";
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
        className="mx-auto max-w-7xl scroll-mt-20 border-b border-border px-4 py-20 sm:px-6 lg:px-8"
      >
        <SectionHeader
          eyebrow="Our Clinic"
          title="Clinic Gallery"
          subtitle="Explore our modern facilities, consultation rooms, waiting lounge, and advanced medical equipment."
        />
        <ClinicGallery />
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Our team"
          title="Meet our featured doctors"
          subtitle="A multi-disciplinary team committed to your long-term health."
        />

        {loadingDoctors ? (
          <DoctorsSkeleton />
        ) : errorDoctors ? (
          <ErrorState message={docError?.message || "Unknown error"} retry={refetchDoctors} />
        ) : !doctors || doctors.length === 0 ? (
          <EmptyState
            title="No doctors found"
            description="There are no doctors registered in the database yet. Please configure them in the admin dashboard."
          />
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {doctors.slice(0, 4).map((doctor) => (
              <DoctorProfileCard key={doctor.id} doctor={doctor} compact />
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <Button asChild variant="outline">
            <Link to="/doctors">View all doctors</Link>
          </Button>
        </div>
      </section>

      <section className="bg-secondary/40 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Services"
            title="Care designed around you"
            subtitle="From routine check-ups to specialist consultations - transparent pricing, every time."
          />

          {loadingServices ? (
            <ServicesSkeleton />
          ) : errorServices ? (
            <ErrorState message={svcError?.message || "Unknown error"} retry={refetchServices} />
          ) : !services || services.length === 0 ? (
            <EmptyState
              title="No services found"
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
              <div className="mt-6 flex items-center justify-center gap-3">
                <CarouselPrevious className="static h-10 w-10 translate-y-0 border-primary/20 bg-white/85 text-primary shadow-sm backdrop-blur hover:bg-primary hover:text-primary-foreground" />
                <CarouselNext className="static h-10 w-10 translate-y-0 border-primary/20 bg-white/85 text-primary shadow-sm backdrop-blur hover:bg-primary hover:text-primary-foreground" />
              </div>
            </Carousel>
          )}

          <div className="mt-8 text-center">
            <Button asChild variant="outline">
              <Link to="/services">All services</Link>
            </Button>
          </div>
        </div>
      </section>

      <FAQSection />
      <TestimonialsSection />

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="grid items-center gap-8 rounded-3xl bg-primary p-10 text-primary-foreground lg:grid-cols-2 lg:p-14">
          <div>
            <h2 className="text-3xl font-bold lg:text-4xl">Ready to see a doctor?</h2>
            <p className="mt-3 max-w-lg text-primary-foreground/80">
              Book online in under a minute. We'll confirm your slot instantly.
            </p>
            <Button asChild size="lg" variant="secondary" className="mt-6">
              <Link to="/appointment">Book Appointment</Link>
            </Button>
          </div>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-3">
              <Phone className="h-4 w-4" aria-hidden="true" /> {CLINIC.phone}
            </li>
            <li className="flex items-center gap-3">
              <Mail className="h-4 w-4" aria-hidden="true" /> {CLINIC.email}
            </li>
            <li className="flex items-center gap-3">
              <MapPin className="h-4 w-4" aria-hidden="true" /> {CLINIC.address}
            </li>
          </ul>
        </div>
      </section>
    </>
  );
}

function HomeServiceCard({ service }: { service: DBService }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const description = service.description?.trim() || "No description provided.";
  const serviceImages = getServiceImageList(service as unknown as Record<string, unknown>).map(
    (src, index) => ({
      src,
      alt: index === 0 ? service.name : `${service.name} image ${index + 1}`,
    }),
  );

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded} asChild>
      <Card className="h-full min-w-0 overflow-hidden transition-shadow hover:shadow-lg">
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
        <CardContent className="flex h-full min-w-0 flex-col p-6">
          <div className="flex min-w-0 items-start justify-between gap-4">
            <h3 className="min-w-0 break-words font-semibold [overflow-wrap:anywhere]">
              {service.name}
            </h3>
            <span className="min-w-0 max-w-[45%] shrink-0 break-words text-right font-bold text-primary [overflow-wrap:anywhere]">
              {service.price}
            </span>
          </div>
          <p
            className={`mt-3 min-w-0 break-words text-sm leading-6 text-muted-foreground [overflow-wrap:anywhere] ${
              isExpanded ? "" : "max-h-[3.75rem] overflow-hidden"
            }`}
          >
            {description}
          </p>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="mt-3 inline-flex w-fit items-center gap-1 rounded-md text-xs font-bold text-primary transition-colors hover:text-primary/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label={`${isExpanded ? "Collapse" : "Expand"} description for ${service.name}`}
            >
              {isExpanded ? "Show less" : "Expand"}
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>
          </CollapsibleTrigger>
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
      <div className="text-xs font-semibold uppercase tracking-wider text-primary">{eyebrow}</div>
      <h2 className="mt-2 text-3xl font-bold sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-3 text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

function DoctorsSkeleton() {
  return (
    <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index} className="overflow-hidden">
          <Skeleton className="aspect-square w-full" />
          <CardContent className="space-y-2 p-5">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
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
        <Card key={index} className="overflow-hidden">
          <CardContent className="space-y-3 p-6">
            <div className="flex items-start justify-between gap-4">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-6 w-1/4" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ErrorState({ message, retry }: { message: string; retry: () => void }) {
  return (
    <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-destructive/20 bg-destructive/10 p-6 text-center">
      <p className="font-medium text-destructive">Failed to load database records</p>
      <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      <Button variant="outline" size="sm" className="mt-4" onClick={retry}>
        Try Again
      </Button>
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto mt-10 max-w-md rounded-2xl border border-dashed border-border p-10 text-center">
      <p className="text-lg font-semibold">{title}</p>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

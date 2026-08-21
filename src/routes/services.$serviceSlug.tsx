import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DoctorProfileCard } from "@/components/DoctorProfileCard";
import { ImageCarousel } from "@/components/ImageCarousel";
import { SiteBreadcrumbs } from "@/components/SiteBreadcrumbs";
import { LAW_FIRM } from "@/lib/clinic-data";
import { getServiceImageList } from "@/lib/image-lists";
import { getServiceIcon } from "@/lib/service-presentation";
import {
  findServiceBySlugParam,
  findServiceSectionBySlugParam,
  getServicePathSlug,
  getServiceSectionPathSlug,
  getServiceSummary,
} from "@/lib/service-slug";
import {
  useLawyers,
  useLawyersForService,
  useServiceSections,
  useServicesBySection,
  useLegalServices,
} from "@/hooks/use-supabase-data";

export const Route = createFileRoute("/services/$serviceSlug")({
  head: ({ params }) => ({
    meta: [
      { title: `Legal services — ${LAW_FIRM.name}` },
      {
        name: "description",
        content: `Browse legal service sections and specific services at ${LAW_FIRM.name}.`,
      },
      { property: "og:title", content: `Legal services — ${LAW_FIRM.name}` },
      { property: "og:description", content: `Browse legal service sections and specific services at ${LAW_FIRM.name}.` },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: `https://sharmalaw.in/services/${params.serviceSlug}` }],
  }),
  component: ServicesDetailRoute,
});

function ServicesDetailRoute() {
  const { serviceSlug } = Route.useParams();
  const { data: sections, isLoading: sectionsLoading } = useServiceSections();
  const { data: services, isLoading: servicesLoading } = useLegalServices();

  if (sectionsLoading || servicesLoading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Skeleton className="h-6 w-56 bg-slate-800" />
        <Skeleton className="mt-8 h-12 w-2/3 max-w-xl bg-slate-800" />
        <Skeleton className="mt-6 h-40 w-full bg-slate-800" />
      </section>
    );
  }

  const section = sections ? findServiceSectionBySlugParam(sections, serviceSlug, services || []) : undefined;
  const service = !section && services ? findServiceBySlugParam(services, serviceSlug, sections || []) : undefined;

  if (section) {
    return <ServiceSectionPage section={section} sections={sections || []} />;
  }

  if (service) {
    return <ServiceDetailPage service={service} sections={sections || []} services={services || []} />;
  }

  return (
    <section className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="font-serif text-3xl text-white">Service not found</h1>
      <p className="mt-3 text-sm text-slate-400">
        This legal service or service section is not in the current records. Browse the legal
        services directory to continue.
      </p>
      <Button asChild className="mt-6 bg-[#1f3d5a] hover:bg-[#274c6e] text-white">
        <Link to="/services">View legal services</Link>
      </Button>
    </section>
  );
}

function ServiceSectionPage({
  section,
  sections,
}: {
  section: { id: string; name: string; slug?: string | null; description?: string | null };
  sections: { id: string; name: string; slug?: string | null }[];
}) {
  const { data: services, isLoading, isError, error, refetch } = useServicesBySection(section.id);
  const allServices = services || [];
  const sectionSlug = getServiceSectionPathSlug(section, sections, allServices);
  const SectionIcon = getServiceIcon(section.name);

  const sectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: section.name,
    description: section.description || undefined,
    url: `https://sharmalaw.in/services/${sectionSlug}`,
  };

  return (
    <article className="bg-[#F8FAFC] text-slate-900 min-h-screen">
      <script type="application/ld+json">{JSON.stringify(sectionSchema)}</script>
      <div className="border-b border-slate-800 bg-[#0B1630] text-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          <SiteBreadcrumbs
            items={[
              { label: "Home", to: "/" },
              { label: "Legal Services", to: "/services" },
              { label: section.name },
            ]}
          />

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-3xl">
              <p className="eyebrow border-blue-400/30 bg-white/[0.05] text-blue-300">
                <Scale className="h-3.5 w-3.5" aria-hidden="true" />
                Service section
              </p>
              <div className="mt-4 flex items-start gap-4">
                <span className="mt-1 grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-blue-600/20 border border-blue-400/30 text-blue-300">
                  <SectionIcon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h1 className="font-serif text-4xl font-semibold leading-tight text-white sm:text-5xl">
                    {section.name}
                  </h1>
                  {section.description && (
                    <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
                      {section.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-md">
              <p className="text-sm leading-relaxed text-slate-300 max-w-xs">
                Browse the specific services within this section, then open the exact service page
                to see specialized lawyers and consultation options.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-80 rounded-xl bg-white border border-slate-200" />
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center text-slate-900">
            <p className="font-medium text-red-600">Unable to load services in this section</p>
            <p className="mt-1 text-sm text-slate-600">{error?.message}</p>
            <Button variant="outline" className="mt-4 border-slate-300 bg-white" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        ) : allServices.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {allServices.map((service) => (
              <ServiceTile
                key={service.id}
                service={service}
                section={section}
                sections={sections}
                allServices={allServices}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-700">
            <p className="font-medium text-slate-900">No services have been assigned to this section yet</p>
            <p className="mt-2 text-sm text-slate-600">
              Administrators can add specific services inside the service section manager.
            </p>
          </div>
        )}
      </div>
    </article>
  );
}

function ServiceDetailPage({
  service,
  sections,
  services,
}: {
  service: {
    id: string;
    name: string;
    slug?: string | null;
    section_id?: string | null;
    description?: string | null;
    short_description?: string | null;
    how_we_help?: string | null;
    important_information?: string | null;
    price: string;
  };
  sections: { id: string; name: string; slug?: string | null; description?: string | null }[];
  services: { id: string; name: string; slug?: string | null }[];
}) {
  const { data: lawyers, isLoading: loadingLawyers } = useLawyersForService(service.id);
  const { isLoading: loadingAllLawyers } = useLawyers();
  const section = sections.find((item) => item.id === service.section_id) || null;
  const serviceSlug = getServicePathSlug(service, services, sections);
  const sectionSlug = section ? getServiceSectionPathSlug(section, sections, services) : "";
  const Icon = getServiceIcon(service.name);
  const summary = service.short_description?.trim() || getServiceSummary(service.description);
  const serviceImages = getServiceImageList(service as unknown as Record<string, unknown>).map(
    (src, index) => ({
      src,
      alt: index === 0 ? service.name : `${service.name} image ${index + 1}`,
    }),
  );

  const detailSchema = {
    "@context": "https://schema.org",
    "@type": "LegalService",
    name: service.name,
    description: service.description || service.short_description || undefined,
    url: `https://sharmalaw.in/services/${serviceSlug}`,
    provider: {
      "@type": "LegalService",
      name: LAW_FIRM.name,
    },
  };

  return (
    <article className="bg-[#F8FAFC] text-slate-900 min-h-screen">
      <script type="application/ld+json">{JSON.stringify(detailSchema)}</script>
      <div className="border-b border-slate-800 bg-[#0B1630] text-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          <SiteBreadcrumbs
            items={[
              { label: "Home", to: "/" },
              { label: "Legal Services", to: "/services" },
              ...(section && sectionSlug ? [{ label: section.name, to: `/services/${sectionSlug}` }] : []),
              { label: service.name },
            ]}
          />

          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:items-start">
            <div>
              <p className="eyebrow border-blue-400/30 bg-white/[0.05] text-blue-300">
                <Scale className="h-3.5 w-3.5" aria-hidden="true" />
                Specific service
              </p>
              <div className="mt-4 flex items-start gap-4">
                <span className="mt-1 grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-blue-600/20 border border-blue-400/30 text-blue-300">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  {section && (
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-400">
                      {section.name}
                    </p>
                  )}
                  <h1 className="mt-2 font-serif text-4xl font-semibold leading-tight text-white sm:text-5xl">
                    {service.name}
                  </h1>
                  <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">{summary}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm leading-relaxed text-slate-300">
                Book a consultation with this service already selected, or review the lawyers who
                handle this exact matter.
              </p>
              <Button asChild className="min-h-12 shrink-0 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-md">
                <Link to="/appointment" search={{ service: service.id }}>
                  <CalendarDays className="h-4 w-4" aria-hidden="true" />
                  Book this service
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-start">
          <section className="max-w-3xl space-y-8">
            <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
              <h2 className="font-serif text-2xl font-semibold text-slate-900 sm:text-3xl">Service overview</h2>
              <p className="mt-4 text-base leading-8 text-slate-600">
                {service.short_description?.trim() || service.description?.trim() || "A detailed service overview has not been added yet."}
              </p>
            </div>

            {service.description && (
              <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
                <h2 className="font-serif text-2xl font-semibold text-slate-900 sm:text-3xl">Full description</h2>
                <p className="mt-4 whitespace-pre-line text-base leading-8 text-slate-600">
                  {service.description}
                </p>
              </div>
            )}

            {service.how_we_help && (
              <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
                <h2 className="font-serif text-2xl font-semibold text-slate-900 sm:text-3xl">How we help</h2>
                <p className="mt-4 whitespace-pre-line text-base leading-8 text-slate-600">
                  {service.how_we_help}
                </p>
              </div>
            )}

            {service.important_information && (
              <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
                <h2 className="font-serif text-2xl font-semibold text-slate-900 sm:text-3xl">
                  Important information / terms
                </h2>
                <p className="mt-4 whitespace-pre-line text-base leading-8 text-slate-600">
                  {service.important_information}
                </p>
              </div>
            )}
          </section>

          <div className="space-y-6">
            {serviceImages.length > 0 && (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="aspect-[16/10] bg-slate-900">
                  <ImageCarousel
                    images={serviceImages}
                    label={`${service.name} photographs`}
                    className="h-full"
                    frameClassName="p-3"
                    imageClassName="rounded-lg object-cover"
                    emptyLabel="Photograph coming soon"
                  />
                </div>
              </div>
            )}

            {service.price && (
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
                  Consultation guide
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">
                  Listed consultation fee: <strong className="text-slate-900">{service.price}</strong>
                </p>
              </div>
            )}
          </div>
        </div>

        <section
          className="mt-16 border-t border-slate-200 pt-12"
          aria-labelledby="specialized-lawyers"
        >
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
              Specialized lawyers
            </p>
            <h2 id="specialized-lawyers" className="mt-2 font-serif text-3xl font-semibold text-slate-900">
              Lawyers handling this exact service
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
              These advocates are linked to this specific service in the firm’s records. Open a
              profile to call, message, or continue to consultation.
            </p>
          </div>

          {loadingLawyers || loadingAllLawyers ? (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-80 rounded-xl bg-white border border-slate-200" />
              ))}
            </div>
          ) : lawyers && lawyers.length > 0 ? (
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {lawyers.map((lawyer) => (
                <DoctorProfileCard key={lawyer.id} doctor={lawyer} compact serviceId={service.id} />
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-8">
              <p className="font-medium text-slate-900">No lawyers are mapped to this service yet</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                The booking form can still be opened with this service selected, and lawyers can be
                chosen there from the current records if the service has any available mapping.
              </p>
              <Button asChild className="mt-5 min-h-11 bg-blue-600 text-white hover:bg-blue-700 shadow-sm">
                <Link to="/appointment" search={{ service: service.id }}>
                  Continue to consultation
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          )}
        </section>
      </div>
    </article>
  );
}

function ServiceTile({
  service,
  section,
  sections,
  allServices,
}: {
  service: {
    id: string;
    name: string;
    slug?: string | null;
    description?: string | null;
    short_description?: string | null;
    price: string;
  };
  section: { id: string; name: string; slug?: string | null };
  sections: { id: string; name: string; slug?: string | null }[];
  allServices: {
    id: string;
    name: string;
    slug?: string | null;
    description?: string | null;
    short_description?: string | null;
    price: string;
  }[];
}) {
  const Icon = getServiceIcon(service.name);
  const slug = getServicePathSlug(service, allServices, sections);
  const summary = service.short_description?.trim() || getServiceSummary(service.description);

  return (
    <article className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl">
      <Link
        to="/services/$serviceSlug"
        params={{ serviceSlug: slug }}
        className="absolute inset-0 z-0 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 rounded-xl"
        aria-label={`Open ${service.name} service`}
      />

      <div className="relative z-10 flex min-w-0 flex-1 flex-col p-6 pointer-events-none">
        <div className="flex items-start justify-between gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-blue-50 border border-blue-100 text-blue-600">
            <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
          </div>
          {service.price && (
            <span className="min-w-0 max-w-[50%] break-words text-right text-xs font-semibold uppercase tracking-wider text-blue-600">
              {service.price}
            </span>
          )}
        </div>

        <p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
          {section.name}
        </p>
        <h3 className="mt-2 min-w-0 font-serif text-xl font-semibold leading-snug text-slate-900">
          <Link
            to="/services/$serviceSlug"
            params={{ serviceSlug: slug }}
            className="pointer-events-auto transition-colors hover:text-blue-600"
          >
            {service.name}
          </Link>
        </h3>
        <p className="mt-3 min-w-0 flex-1 text-sm leading-relaxed text-slate-600">
          {summary || "Open the service page for the full description and specialized lawyers."}
        </p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center pointer-events-auto" onClick={(e) => e.stopPropagation()}>
          <Button asChild className="min-h-11 flex-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm">
            <Link to="/services/$serviceSlug" params={{ serviceSlug: slug }}>
              Learn more
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="min-h-11 rounded-lg border-slate-300 bg-white text-slate-800 hover:bg-slate-50 shadow-sm"
          >
            <Link to="/appointment" search={{ service: service.id }}>
              Book
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}

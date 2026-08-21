import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LAW_FIRM } from "@/lib/clinic-data";
import { getServiceIcon } from "@/lib/service-presentation";
import { getServiceSectionPathSlug } from "@/lib/service-slug";
import { useServiceSections, useLegalServices } from "@/hooks/use-supabase-data";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: `Legal Services & Service Sections — ${LAW_FIRM.name}` },
      {
        name: "description",
        content: `Browse legal service sections and the specific services inside each practice area at ${LAW_FIRM.name}.`,
      },
      { property: "og:title", content: `Legal Services & Service Sections — ${LAW_FIRM.name}` },
      {
        property: "og:description",
        content: `Browse legal service sections and the specific services inside each practice area at ${LAW_FIRM.name}.`,
      },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://sharmalaw.in/services" }],
  }),
  component: ServicesRoute,
});

function ServicesRoute() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isNestedServicePath = pathname !== "/services" && pathname.startsWith("/services/");

  if (isNestedServicePath) {
    return <Outlet />;
  }

  return <ServicesPage />;
}

function ServicesPage() {
  const { data: sections, isLoading, isError, error, refetch } = useServiceSections();
  const { data: services } = useLegalServices();

  const sectionsSchema = sections
    ? {
        "@context": "https://schema.org",
        "@graph": sections.map((section) => {
          const slug = getServiceSectionPathSlug(section, sections, services || []);
          return {
            "@type": "CollectionPage",
            "@id": `https://sharmalaw.in/services/${slug}`,
            name: section.name,
            description: section.description,
          };
        }),
      }
    : null;

  return (
    <div className="relative isolate overflow-hidden bg-[#F8FAFC] text-slate-900 min-h-screen">
      {sectionsSchema && <script type="application/ld+json">{JSON.stringify(sectionsSchema)}</script>}

      <section className="relative border-b border-slate-800 bg-[#0B1630] text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1fr_auto] lg:items-end lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-white/[0.05] px-3.5 py-1.5 text-xs font-semibold uppercase tracking-widest text-blue-300">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Legal service sections
            </div>
            <h1 className="mt-6 font-serif text-4xl leading-tight font-semibold text-white sm:text-6xl">
              Find the right <span className="text-blue-400">service section</span>.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg sm:leading-8">
              Start with the broad practice area, open the specific service, and then see the lawyers
              who are mapped to that exact service.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:flex">
            {[
              { value: "Two levels", label: "Section then service" },
              { value: "Direct", label: "Lawyer mapping" },
            ].map((item) => (
              <div
                key={item.label}
                className="min-w-36 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-4 shadow-lg backdrop-blur-md"
              >
                <div className="font-serif text-2xl font-semibold text-blue-400">
                  {item.value}
                </div>
                <div className="mt-1 text-xs font-medium text-slate-300">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-blue-600">
              Service Sections
            </div>
            <h2 className="mt-2 font-serif text-3xl font-semibold text-slate-900 sm:text-4xl">
              Choose a practice area
            </h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-slate-600">
            Open a section to see the specific legal services that belong to it. The database
            controls which services appear here.
          </p>
        </div>

        {isLoading ? (
          <SectionsSkeleton />
        ) : isError ? (
          <ErrorState message={error?.message || "Unknown error"} retry={refetch} />
        ) : !sections || sections.length === 0 ? (
          <EmptyState
            title="No service sections found"
            description="There are no published service sections in the database yet."
          />
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:mt-12 lg:grid-cols-3">
            {sections.map((section) => (
              <SectionCard key={section.id} section={section} sections={sections} services={services || []} />
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8 lg:pb-24">
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white px-6 py-10 text-slate-900 shadow-lg sm:px-10 sm:py-12 lg:grid lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-14 lg:px-14">
          <div className="relative">
            <div className="text-xs font-bold uppercase tracking-widest text-blue-600">
              How this works
            </div>
            <h2 className="mt-3 font-serif text-3xl font-semibold text-slate-900 sm:text-4xl">
              Service section, then specific service, then lawyer
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-600">
              Each specific service keeps the existing lawyer assignment flow, so the consultation
              booking still starts from the exact service the client needs.
            </p>
          </div>
          <ul className="relative mt-8 grid gap-3.5 sm:grid-cols-2 lg:mt-0">
            {[
              "Open the service section",
              "Choose the specific service",
              "Review specialized lawyers",
              "Continue to consultation",
            ].map((step) => (
              <li
                key={step}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-800"
              >
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-blue-100 border border-blue-200 text-blue-600">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
                </span>
                {step}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

function SectionCard({
  section,
  sections,
  services,
}: {
  section: {
    id: string;
    name: string;
    slug?: string | null;
    description?: string | null;
  };
  sections: { id: string; name: string; slug?: string | null }[];
  services: { id: string; name: string; slug?: string | null; section_id?: string | null }[];
}) {
  const Icon = getServiceIcon(section.name);
  const slug = getServiceSectionPathSlug(section, sections, services);
  const serviceCount = services.filter((service) => service.section_id === section.id).length;
  const summary = section.description?.trim() || "Open this practice area to see the specific services inside it.";

  return (
    <article className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl">
      <Link
        to="/services/$serviceSlug"
        params={{ serviceSlug: slug }}
        className="absolute inset-0 z-0 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 rounded-xl"
        aria-label={`Open ${section.name} section`}
      />

      <div className="relative z-10 flex min-w-0 flex-1 flex-col p-6 pointer-events-none">
        <div className="flex items-start justify-between gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-blue-50 border border-blue-100 text-blue-600">
            <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
          </div>
          <span className="min-w-0 max-w-[45%] break-words text-right text-xs font-semibold uppercase tracking-wider text-blue-600">
            {serviceCount} services
          </span>
        </div>

        <h3 className="mt-5 min-w-0 font-serif text-xl font-semibold leading-snug text-slate-900">
          <Link
            to="/services/$serviceSlug"
            params={{ serviceSlug: slug }}
            className="pointer-events-auto transition-colors hover:text-blue-600"
          >
            {section.name}
          </Link>
        </h3>
        <p className="mt-3 min-w-0 flex-1 text-sm leading-relaxed text-slate-600">
          {summary}
        </p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center pointer-events-auto">
          <Button asChild className="min-h-11 flex-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm">
            <Link to="/services/$serviceSlug" params={{ serviceSlug: slug }}>
              View section
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}

function SectionsSkeleton() {
  return (
    <div className="mt-10 grid gap-5 md:grid-cols-2 lg:mt-12 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-[var(--site-border)] bg-[var(--site-bg-card)]">
          <div className="space-y-5 p-6">
            <Skeleton className="h-12 w-12 rounded-lg bg-slate-800" />
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
      <p className="text-red-400 font-medium">Failed to load legal service sections</p>
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

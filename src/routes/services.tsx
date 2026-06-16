import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useServices } from "@/hooks/use-supabase-data";
import { Check } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CLINIC } from "@/lib/clinic-data";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services & Pricing — Advanced Care Medical Clinic" },
      {
        name: "description",
        content:
          "Transparent pricing for consultations, screenings and health check-ups at Advanced Care Medical Clinic.",
      },
      { property: "og:title", content: "Services & Pricing — Advanced Care Medical Clinic" },
      {
        property: "og:description",
        content:
          "Transparent pricing for consultations, screenings and health check-ups at Advanced Care Medical Clinic.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://advancedcareclinic.com/services" },
      { property: "og:image", content: "https://advancedcareclinic.com/og-image.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Services & Pricing — Advanced Care Medical Clinic" },
      {
        name: "twitter:description",
        content:
          "Transparent pricing for consultations, screenings and health check-ups at Advanced Care Medical Clinic.",
      },
      { name: "twitter:image", content: "https://advancedcareclinic.com/og-image.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://advancedcareclinic.com/services" }],
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
          "@id": `https://advancedcareclinic.com/services#${s.id}`,
          "name": s.name,
          "description": s.description,
          "provider": {
            "@type": "MedicalClinic",
            "name": CLINIC.name,
            "address": CLINIC.address
          },
          "offers": {
            "@type": "Offer",
            "price": priceNum,
            "priceCurrency": "INR"
          }
        };
      })
    };
  }, [services]);

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
      {servicesSchema && (
        <script type="application/ld+json">
          {JSON.stringify(servicesSchema)}
        </script>
      )}
      <div className="max-w-2xl">
        <div className="text-xs font-semibold uppercase tracking-wider text-primary">Services</div>
        <h1 className="mt-2 text-4xl sm:text-5xl font-bold">Care, clearly priced</h1>
        <p className="mt-3 text-muted-foreground">
          No surprises. Every service includes a full consultation and a clear follow-up plan.
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
        <>
          <h2 className="sr-only">Our Services Catalog</h2>
          <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s) => (
              <Card key={s.id} className="flex flex-col hover:shadow-lg transition-shadow">
                <CardContent className="p-6 flex flex-col flex-1">
                  <h3 className="text-lg font-semibold">{s.name}</h3>
                  <p className="text-sm text-muted-foreground mt-2 flex-1">{s.description}</p>
                  <div className="mt-4 pt-4 border-t border-border flex items-end justify-between">
                    <div>
                      <div className="text-xs text-muted-foreground">Starting at</div>
                      <div className="text-2xl font-bold text-primary">{s.price}</div>
                    </div>
                    <Button asChild size="sm">
                      <Link to="/appointment" search={{ service: s.id }}>
                        Book
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <div className="mt-14 rounded-2xl bg-secondary/50 p-8 grid md:grid-cols-2 gap-6 items-center">
        <div>
          <h2 className="text-2xl font-bold">What's always included</h2>
          <p className="mt-2 text-muted-foreground text-sm">
            Every consultation comes with these promises.
          </p>
        </div>
        <ul className="space-y-2 text-sm">
          {[
            "Unhurried 20+ minute consultations",
            "Digital prescription & records",
            "Free 7-day follow-up message",
            "Transparent, all-inclusive pricing",
          ].map((p) => (
            <li key={p} className="flex items-start gap-2">
              <Check className="h-4 w-4 text-success mt-0.5" /> {p}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function ServicesSkeleton() {
  return (
    <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6 space-y-3">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <div className="mt-4 pt-4 border-t border-border flex items-end justify-between">
              <div>
                <Skeleton className="h-3 w-12 mb-1" />
                <Skeleton className="h-6 w-16" />
              </div>
              <Skeleton className="h-9 w-16" />
            </div>
          </CardContent>
        </Card>
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

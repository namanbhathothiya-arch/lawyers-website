import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDoctorImage, CLINIC } from "@/lib/clinic-data";
import { useDoctors } from "@/hooks/use-supabase-data";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/doctors")({
  head: () => ({
    meta: [
      { title: "Our Doctors — Advanced Care Medical Clinic" },
      {
        name: "description",
        content:
          "Meet the specialists at Advanced Care Medical Clinic and book your appointment online.",
      },
      { property: "og:title", content: "Our Doctors — Advanced Care Medical Clinic" },
      {
        property: "og:description",
        content:
          "Meet the specialists at Advanced Care Medical Clinic and book your appointment online.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://advancedcareclinic.com/doctors" },
      { property: "og:image", content: "https://advancedcareclinic.com/og-image.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Our Doctors — Advanced Care Medical Clinic" },
      {
        name: "twitter:description",
        content:
          "Meet the specialists at Advanced Care Medical Clinic and book your appointment online.",
      },
      { name: "twitter:image", content: "https://advancedcareclinic.com/og-image.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://advancedcareclinic.com/doctors" }],
  }),
  component: DoctorsPage,
});

function DoctorsPage() {
  const { data: doctors, isLoading, isError, error, refetch } = useDoctors();

  const doctorsSchema = useMemo(() => {
    if (!doctors) return null;
    return {
      "@context": "https://schema.org",
      "@graph": doctors.map((d) => ({
        "@type": "Physician",
        "@id": `https://advancedcareclinic.com/doctors#${d.id}`,
        "name": d.name,
        "image": getDoctorImage(d.id, d.photo),
        "medicalSpecialty": d.specialization,
        "description": d.bio || `Specialist at ${CLINIC.name}`,
        "telephone": CLINIC.phone,
        "worksFor": {
          "@type": "MedicalClinic",
          "name": CLINIC.name,
          "address": CLINIC.address
        }
      }))
    };
  }, [doctors]);

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
      {doctorsSchema && (
        <script type="application/ld+json">
          {JSON.stringify(doctorsSchema)}
        </script>
      )}
      <div className="max-w-2xl">
        <div className="text-xs font-semibold uppercase tracking-wider text-primary">Our team</div>
        <h1 className="mt-2 text-4xl sm:text-5xl font-bold">Our doctors</h1>
        <p className="mt-3 text-muted-foreground">
          Board-certified specialists who combine clinical expertise with genuine warmth.
        </p>
      </div>

      {isLoading ? (
        <DoctorsSkeleton />
      ) : isError ? (
        <ErrorState message={error?.message || "Unknown error"} retry={refetch} />
      ) : !doctors || doctors.length === 0 ? (
        <EmptyState
          title="No doctors found"
          description="There are no doctors registered in the database yet. Please configure them in the admin dashboard."
        />
      ) : (
        <>
          <h2 className="sr-only">Specialist Practitioners List</h2>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map((d) => (
              <Card key={d.id} className="overflow-hidden group">
                <div className="aspect-[4/3] overflow-hidden bg-muted">
                  <img
                    src={getDoctorImage(d.id, d.photo)}
                    alt={d.name}
                    width={768}
                    height={768}
                    loading="lazy"
                    className="h-full w-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold">{d.name}</h3>
                  <p className="text-sm text-primary font-medium">{d.specialization}</p>
                  <p className="text-xs text-muted-foreground mt-1">{d.experience} experience</p>
                  <p className="text-sm text-foreground/80 mt-3">{d.bio}</p>
                  <Button asChild className="w-full mt-5">
                    <Link to="/appointment" search={{ doctor: d.id }}>
                      Book Appointment
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function DoctorsSkeleton() {
  return (
    <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className="aspect-[4/3] w-full" />
          <CardContent className="p-6 space-y-3">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full mt-5" />
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

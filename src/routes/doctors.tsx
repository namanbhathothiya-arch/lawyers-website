import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDoctorImage, CLINIC } from "@/lib/clinic-data";
import { useDoctors } from "@/hooks/use-supabase-data";
import { Skeleton } from "@/components/ui/skeleton";
import { DoctorProfileCard } from "@/components/DoctorProfileCard";

export const Route = createFileRoute("/doctors")({
  head: () => ({
    meta: [
      { title: "Our Doctors — HeartCare Advanced Clinic" },
      {
        name: "description",
        content:
          "Meet Dr. Raj Sharma, specialist in Interventional Cardiology at HeartCare Advanced Clinic.",
      },
      { property: "og:title", content: "Our Doctors — HeartCare Advanced Clinic" },
      {
        property: "og:description",
        content:
          "Meet Dr. Raj Sharma, specialist in Interventional Cardiology at HeartCare Advanced Clinic.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://heartcareclinic.com/doctors" },
      { property: "og:image", content: "https://heartcareclinic.com/og-image.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Our Doctors — HeartCare Advanced Clinic" },
      {
        name: "twitter:description",
        content:
          "Meet Dr. Raj Sharma, specialist in Interventional Cardiology at HeartCare Advanced Clinic.",
      },
      { name: "twitter:image", content: "https://heartcareclinic.com/og-image.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://heartcareclinic.com/doctors" }],
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
        "@id": `https://heartcareclinic.com/doctors#${d.id}`,
        name: d.name,
        image: getDoctorImage(d.id, d.photo),
        medicalSpecialty: d.specialization,
        description: d.bio || `Specialist at ${CLINIC.name}`,
        telephone: CLINIC.phone,
        worksFor: {
          "@type": "MedicalClinic",
          name: CLINIC.name,
          address: CLINIC.address,
        },
      })),
    };
  }, [doctors]);

  return (
    <section className="relative overflow-hidden py-16 sm:py-20">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(circle_at_top_left,var(--color-primary-light),transparent_58%)]" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {doctorsSchema && (
          <script type="application/ld+json">{JSON.stringify(doctorsSchema)}</script>
        )}
        <div className="max-w-3xl">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Our team</div>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Expertise you can trust.
            <span className="block text-primary">Care you can feel.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
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
            <div className="mt-12 grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {doctors.map((d) => (
                <DoctorProfileCard key={d.id} doctor={d} />
              ))}
            </div>
          </>
        )}
      </div>
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

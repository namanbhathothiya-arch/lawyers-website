import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDoctorImage, LAW_FIRM } from "@/lib/clinic-data";
import { useLawyers } from "@/hooks/use-supabase-data";
import { Skeleton } from "@/components/ui/skeleton";
import { DoctorProfileCard } from "@/components/DoctorProfileCard";

export const Route = createFileRoute("/doctors")({
  head: () => ({
    meta: [
      { title: `Our Lawyers — ${LAW_FIRM.name}` },
      {
        name: "description",
        content: `Meet our team of legal advocates and consultants at ${LAW_FIRM.name}.`,
      },
      { property: "og:title", content: `Our Lawyers — ${LAW_FIRM.name}` },
      {
        property: "og:description",
        content: `Meet our team of legal advocates and consultants at ${LAW_FIRM.name}.`,
      },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://sharmalaw.in/doctors" }],
  }),
  component: DoctorsPage,
});

function DoctorsPage() {
  const { data: lawyers, isLoading, isError, error, refetch } = useLawyers();

  const lawyersSchema = useMemo(() => {
    if (!lawyers) return null;
    return {
      "@context": "https://schema.org",
      "@graph": lawyers.map((d) => ({
        "@type": "Person",
        "@id": `https://sharmalaw.in/doctors#${d.id}`,
        name: d.name,
        image: getDoctorImage(d.id, d.photo),
        jobTitle: d.specialization,
        description: d.bio || `Advocate at ${LAW_FIRM.name}`,
        telephone: LAW_FIRM.phone,
        worksFor: {
          "@type": "LegalService",
          name: LAW_FIRM.name,
          address: LAW_FIRM.address,
        },
      })),
    };
  }, [lawyers]);

  return (
    <section className="relative overflow-hidden py-16 sm:py-24 bg-[#070c14] text-slate-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.15),transparent_58%)]" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {lawyersSchema && (
          <script type="application/ld+json">{JSON.stringify(lawyersSchema)}</script>
        )}
        <div className="max-w-3xl">
          <div className="text-xs font-bold uppercase tracking-widest text-blue-400">Our Legal Advocates</div>
          <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Legal Expertise You Can Trust.
            <span className="block text-blue-500 mt-1">Counsel You Can Rely On.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
            Experienced legal practitioners offering focused advice, thorough preparation, and court representation.
          </p>
        </div>

        {isLoading ? (
          <DoctorsSkeleton />
        ) : isError ? (
          <ErrorState message={error?.message || "Unknown error"} retry={refetch} />
        ) : !lawyers || lawyers.length === 0 ? (
          <EmptyState
            title="No lawyers listed"
            description="There are no lawyers configured in the database yet."
          />
        ) : (
          <>
            <h2 className="sr-only">Lawyers List</h2>
            <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {lawyers.map((d) => (
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
        <Card key={i} className="overflow-hidden border-slate-800 bg-slate-900">
          <Skeleton className="aspect-[4/3] w-full bg-slate-800" />
          <CardContent className="p-6 space-y-3">
            <Skeleton className="h-6 w-2/3 bg-slate-800" />
            <Skeleton className="h-4 w-1/3 bg-slate-800" />
            <Skeleton className="h-10 w-full mt-5 bg-slate-800" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ErrorState({ message, retry }: { message: string; retry: () => void }) {
  return (
    <div className="mt-12 p-8 rounded-xl bg-red-950/20 border border-red-900/50 text-center max-w-xl mx-auto text-slate-200">
      <p className="text-red-400 font-medium">Failed to load lawyer records</p>
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

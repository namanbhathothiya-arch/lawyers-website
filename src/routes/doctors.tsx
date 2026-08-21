import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDoctorImage, LAW_FIRM } from "@/lib/clinic-data";
import { useLawyers } from "@/hooks/use-supabase-data";
import { Skeleton } from "@/components/ui/skeleton";
import { DoctorProfileCard } from "@/components/DoctorProfileCard";
import { getLawyerDirectContact } from "@/lib/lawyer-contact";

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
  component: DoctorsRoute,
});

function DoctorsRoute() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isProfile = pathname !== "/doctors" && pathname.startsWith("/doctors/");
  if (isProfile) return <Outlet />;
  return <DoctorsPage />;
}

function DoctorsPage() {
  const { data: lawyers, isLoading, isError, error, refetch } = useLawyers();

  const lawyersSchema = useMemo(() => {
    if (!lawyers) return null;
    return {
      "@context": "https://schema.org",
      "@graph": lawyers.map((d) => {
        const contact = getLawyerDirectContact(d as unknown as Record<string, unknown>);
        return {
        "@type": "Person",
        "@id": `https://sharmalaw.in/doctors#${d.id}`,
        name: d.name,
        image: getDoctorImage(d.id, d.photo),
        jobTitle: d.specialization,
        description: d.bio || `Advocate at ${LAW_FIRM.name}`,
        ...(contact.hasPhone ? { telephone: contact.phoneDisplay } : {}),
        worksFor: {
          "@type": "LegalService",
          name: LAW_FIRM.name,
          address: LAW_FIRM.address,
        },
      };
      }),
    };
  }, [lawyers]);

  return (
    <div className="bg-[#F8FAFC] text-slate-900 min-h-screen">
      {lawyersSchema && (
        <script type="application/ld+json">{JSON.stringify(lawyersSchema)}</script>
      )}

      <section className="relative overflow-hidden py-16 sm:py-20 bg-[#0B1630] text-white border-b border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="eyebrow border-blue-400/30 bg-white/[0.05] text-blue-300">Our advocates</div>
            <h1 className="mt-4 font-serif text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Meet the lawyers who will work on your matter.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
              Review each advocate’s practice focus, experience, and profile. Contact details on a
              profile belong to that lawyer — not a shared firm number.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {lawyers.map((d) => (
                  <DoctorProfileCard key={d.id} doctor={d} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
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

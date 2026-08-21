import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Briefcase,
  CalendarDays,
  Check,
  Scale,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LawyerContactActions } from "@/components/LawyerContactActions";
import { ImageCarousel } from "@/components/ImageCarousel";
import { SiteBreadcrumbs } from "@/components/SiteBreadcrumbs";
import { getDoctorImage, LAW_FIRM } from "@/lib/clinic-data";
import { getDoctorImageList } from "@/lib/image-lists";
import { getLawyerDirectContact } from "@/lib/lawyer-contact";
import { getServicePathSlug, getServiceSectionPathSlug } from "@/lib/service-slug";
import {
  useLawyer,
  useLawyerPracticeAreas,
  useLegalServices,
  useServiceSections,
} from "@/hooks/use-supabase-data";

const lawyerProfileSearchSchema = z.object({
  service: z.string().optional(),
});

export const Route = createFileRoute("/doctors/$lawyerId")({
  validateSearch: lawyerProfileSearchSchema,
  head: ({ params }) => ({
    meta: [
      { title: `Advocate Profile — ${LAW_FIRM.name}` },
      {
        name: "description",
        content: `Review this advocate’s practice focus, experience, and consultation options at ${LAW_FIRM.name}.`,
      },
      { property: "og:title", content: `Advocate Profile — ${LAW_FIRM.name}` },
      { property: "og:type", content: "profile" },
    ],
    links: [{ rel: "canonical", href: `https://sharmalaw.in/doctors/${params.lawyerId}` }],
  }),
  component: LawyerProfilePage,
});

function LawyerProfilePage() {
  const { lawyerId } = Route.useParams();
  const { service: serviceIdFromSearch } = Route.useSearch();
  const { data: lawyer, isLoading, isError, error, refetch } = useLawyer(lawyerId);
  const { data: practiceAreas } = useLawyerPracticeAreas(lawyerId);
  const { data: services } = useLegalServices();
  const { data: sections } = useServiceSections();

  if (isLoading) {
    return (
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <Skeleton className="h-6 w-36 bg-slate-800" />
        <div className="mt-6 rounded-2xl border border-[#D6A85F]/20 bg-[#061A35]/80 p-6 backdrop-blur-xl">
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <Skeleton className="aspect-[4/5] w-full rounded-xl bg-slate-800" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-1/2 bg-slate-800" />
              <Skeleton className="h-5 w-1/3 bg-slate-800" />
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-16 w-full bg-slate-800" />
                <Skeleton className="h-16 w-full bg-slate-800" />
              </div>
              <Skeleton className="h-20 w-full bg-slate-800" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="mx-auto max-w-xl px-4 py-20 text-center">
        <p className="font-medium text-red-400">Unable to load this advocate’s profile</p>
        <p className="mt-2 text-sm text-slate-400">{error?.message}</p>
        <Button variant="outline" className="mt-5 border-white/15 bg-transparent" onClick={() => refetch()}>
          Try again
        </Button>
      </section>
    );
  }

  if (!lawyer) {
    return (
      <section className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="font-serif text-3xl text-white">Advocate Not Found</h1>
        <p className="mt-3 text-sm text-slate-400">
          This profile is not available. Browse the current advocates at the firm.
        </p>
        <Button asChild className="mt-6 bg-[#D6A85F] text-[#061A35] hover:bg-[#E5B86E] font-bold">
          <Link to="/doctors">View all lawyers</Link>
        </Button>
      </section>
    );
  }

  const contact = getLawyerDirectContact(lawyer as unknown as Record<string, unknown>);
  const contextService = services?.find((item) => item.id === serviceIdFromSearch);
  const contextSection = contextService?.section_id
    ? sections?.find((item) => item.id === contextService.section_id)
    : undefined;
  const bookingSearch = contextService
    ? { lawyer: lawyer.id, doctor: lawyer.id, service: contextService.id }
    : { lawyer: lawyer.id, doctor: lawyer.id };
  const breadcrumbItems = [
    { label: "Home", to: "/" },
    ...(contextService && services
      ? [
          { label: "Legal Services", to: "/services" },
          ...(contextSection
            ? [
                {
                  label: contextSection.name,
                  to: `/services/${getServiceSectionPathSlug(contextSection, sections || [], services)}`,
                },
              ]
            : []),
          {
            label: contextService.name,
            to: `/services/${getServicePathSlug(contextService, services, sections || [])}`,
          },
        ]
      : [{ label: "Lawyers", to: "/doctors" }]),
    { label: lawyer.name },
  ];
  const images = getDoctorImageList(
    lawyer as unknown as Record<string, unknown>,
    getDoctorImage(lawyer.id, lawyer.photo),
  ).map((src, index) => ({
    src,
    alt: index === 0 ? `${lawyer.name}, ${lawyer.specialization}` : `${lawyer.name} photograph ${index + 1}`,
  }));
  const experienceLabel = /experience/i.test(lawyer.experience)
    ? lawyer.experience
    : `${lawyer.experience} of practice`;

  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: lawyer.name,
    jobTitle: lawyer.specialization,
    description: lawyer.bio || `Advocate at ${LAW_FIRM.name}`,
    image: getDoctorImage(lawyer.id, lawyer.photo),
    ...(contact.hasPhone ? { telephone: contact.phoneDisplay } : {}),
    worksFor: {
      "@type": "LegalService",
      name: LAW_FIRM.name,
    },
  };

  const isFeatured = Boolean(lawyer.is_featured_hero);

  return (
    <article className="relative overflow-hidden bg-[#03142B] text-slate-100 min-h-screen pb-24 lg:pb-16">
      <script type="application/ld+json">{JSON.stringify(personSchema)}</script>

      {/* AMBIENT BACKGROUND GLOW & GRID */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse at 35% 20%, #082142 0%, #03142B 65%, #020C1B 100%)",
        }}
      >
        <div className="private-hero-grid absolute inset-0 opacity-25" />
        <div className="absolute -left-20 top-16 h-80 w-80 rounded-full bg-[#12345A]/40 blur-3xl" />
        <div className="absolute -right-20 top-40 h-96 w-96 rounded-full bg-[#D6A85F]/5 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 lg:px-8">
        {/* BREADCRUMBS & NAVIGATION */}
        <SiteBreadcrumbs items={breadcrumbItems} />

        <div className="mt-3 flex items-center justify-between">
          <Link
            to="/doctors"
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-[#D6A85F]" aria-hidden="true" />
            <span>Back to Advocates Catalog</span>
          </Link>
        </div>

        {/* MAIN COMPACT HERO PROFILE CARD */}
        <div className="mt-5 rounded-2xl border border-[#D6A85F]/30 bg-[#061A35]/85 p-5 sm:p-7 backdrop-blur-xl shadow-2xl">
          <div className="grid gap-6 lg:grid-cols-[280px_1fr] xl:grid-cols-[300px_1fr] items-start">
            
            {/* LEFT: COMPACT PORTRAIT CARD */}
            <div className="relative mx-auto w-full max-w-[280px] lg:max-w-[300px] shrink-0">
              <div className="group relative overflow-hidden rounded-2xl border-2 border-[#D6A85F]/40 bg-gradient-to-b from-[#0A2647] to-[#03142B] p-1.5 shadow-2xl transition-all duration-300 hover:border-[#D6A85F]/70 hover:shadow-[#D6A85F]/15 hover:shadow-xl">
                <div className="aspect-[4/5] overflow-hidden rounded-xl bg-slate-900">
                  <ImageCarousel
                    images={images}
                    label={`${lawyer.name} photographs`}
                    className="h-full"
                    frameClassName="p-2 sm:p-3"
                    imageClassName="rounded-lg object-cover filter brightness-[0.97] contrast-[1.03]"
                    emptyLabel="Photograph coming soon"
                  />
                </div>

                {isFeatured && (
                  <div className="absolute left-3.5 top-3.5 inline-flex items-center gap-1.5 rounded-full border border-[#D6A85F]/60 bg-[#03142B]/90 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-wider text-[#D6A85F] shadow-lg backdrop-blur-md">
                    <Sparkles className="h-3 w-3 text-[#D6A85F] fill-[#D6A85F]" />
                    <span>Featured Advocate</span>
                  </div>
                )}
              </div>

              {/* Quick Status Pill beneath portrait */}
              <div className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] py-2 px-3 text-center text-xs text-slate-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-medium text-[#E6ECF3]">Available for Consultation</span>
              </div>
            </div>

            {/* RIGHT: LAWYER INFORMATION, CONTACT & BOOKING */}
            <div className="flex flex-col justify-between space-y-5">
              {/* Header info */}
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-[#D6A85F]/35 bg-[#D6A85F]/10 px-3 py-0.5 text-xs font-semibold uppercase tracking-wider text-[#D6A85F]">
                    <Scale className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Legal Counsel</span>
                  </div>
                </div>

                <h1 className="mt-2.5 font-serif text-2xl font-bold tracking-tight text-[#F5F4EF] sm:text-3xl lg:text-4xl">
                  {lawyer.name}
                </h1>
                <p className="mt-1 font-serif text-base sm:text-lg font-medium text-[#D6A85F]">
                  {lawyer.specialization}
                </p>
              </div>

              {/* CREDENTIAL CARDS (COMPACT HORIZONTAL BAR) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur-md">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#D6A85F]/15 text-[#D6A85F] border border-[#D6A85F]/30">
                    <Briefcase className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[0.62rem] font-bold uppercase tracking-widest text-[#D6A85F]">
                      Experience
                    </span>
                    <p className="truncate text-xs font-semibold text-[#F5F4EF]">
                      {experienceLabel}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur-md">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#D6A85F]/15 text-[#D6A85F] border border-[#D6A85F]/30">
                    <Award className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[0.62rem] font-bold uppercase tracking-widest text-[#D6A85F]">
                      Practice Focus
                    </span>
                    <p className="truncate text-xs font-semibold text-[#F5F4EF]">
                      {lawyer.specialization}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur-md sm:col-span-2 lg:col-span-1">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#D6A85F]/15 text-[#D6A85F] border border-[#D6A85F]/30">
                    <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[0.62rem] font-bold uppercase tracking-widest text-[#D6A85F]">
                      Privilege
                    </span>
                    <p className="truncate text-xs font-semibold text-[#F5F4EF]">
                      100% Confidential
                    </p>
                  </div>
                </div>
              </div>

              {/* PRACTICE AREA TAGS (IF AVAILABLE) */}
              {practiceAreas && practiceAreas.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-400">
                    Specialized Legal Services
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {practiceAreas.map((area) => (
                      <span
                        key={area.id}
                        className="inline-flex items-center gap-1 rounded-md border border-[#D6A85F]/20 bg-white/[0.05] px-2.5 py-1 text-xs font-medium text-slate-200"
                      >
                        <Check className="h-3 w-3 text-[#D6A85F]" />
                        {area.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* PROFESSIONAL BIO */}
              {lawyer.bio && (
                <p className="text-xs sm:text-sm leading-relaxed text-[#E6ECF3]/90">
                  {lawyer.bio.trim()}
                </p>
              )}

              {/* CONTEXT SERVICE BANNER */}
              {contextService && (
                <div className="rounded-xl border border-[#D6A85F]/30 bg-[#F5F4EF]/10 px-4 py-2.5 text-xs text-[#E6ECF3]">
                  Selected service:{" "}
                  <strong className="font-semibold text-white">{contextService.name}</strong>.
                  Consultation request will include this service context.
                </div>
              )}

              {/* CONTACT & BOOKING ACTIONS BLOCK */}
              <div className="space-y-3 border-t border-white/10 pt-4">
                <span className="text-[0.68rem] font-bold uppercase tracking-wider text-[#D6A85F]">
                  Direct Contact & Booking
                </span>

                {/* Row 1: Call Now & Chat on WhatsApp */}
                <LawyerContactActions
                  lawyer={lawyer as unknown as Record<string, unknown>}
                  lawyerName={lawyer.name}
                />

                {/* Row 2: Book Consultation Primary CTA */}
                <Button
                  asChild
                  size="lg"
                  className="group min-h-[48px] w-full rounded-xl bg-[#D6A85F] text-[#061A35] hover:bg-[#E5B86E] hover:shadow-xl hover:shadow-[#D6A85F]/20 font-bold text-base transition-all duration-200 hover:-translate-y-0.5 border-0"
                >
                  <Link to="/appointment" search={bookingSearch} className="inline-flex items-center justify-center gap-2">
                    <CalendarDays className="h-4.5 w-4.5 text-[#061A35]" aria-hidden="true" />
                    <span>Book a Consultation with {lawyer.name}</span>
                    <ArrowRight
                      className="ml-1 h-4 w-4 text-[#061A35] transition-transform duration-200 group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </Link>
                </Button>
              </div>

            </div>
          </div>
        </div>

        {/* DETAILS & PRACTICE AREAS SECTION BELOW HERO */}
        <div className="mt-7 grid gap-6 lg:grid-cols-2">
          {/* PRACTICE AREAS DETAILS */}
          <section className="rounded-2xl border border-white/10 bg-[#061A35]/60 p-6 backdrop-blur-xl shadow-lg">
            <h2 className="font-serif text-xl font-semibold text-[#F5F4EF]">Practice Areas & Legal Expertise</h2>
            {practiceAreas && practiceAreas.length > 0 ? (
              <ul className="mt-4 space-y-2.5">
                {practiceAreas.map((area) => (
                  <li key={area.id} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    <p className="font-semibold text-xs sm:text-sm text-[#F5F4EF]">{area.name}</p>
                    {area.description && (
                      <p className="mt-1 text-xs leading-relaxed text-[#E6ECF3]/80">{area.description}</p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-xs sm:text-sm leading-relaxed text-[#E6ECF3]">
                Specialization: <strong className="text-white">{lawyer.specialization}</strong>. Explore legal services at our firm to book a consultation for specific matters.
              </p>
            )}
            <Button asChild variant="outline" className="mt-4 border border-[#F5F4EF]/25 bg-transparent text-[#F5F4EF] hover:bg-[#F5F4EF]/10 text-xs">
              <Link to="/services">View All Legal Services</Link>
            </Button>
          </section>

          {/* CONFIDENTIALITY & ASSURANCES */}
          <section className="rounded-2xl border border-white/10 bg-[#061A35]/60 p-6 backdrop-blur-xl shadow-lg flex flex-col justify-between space-y-4">
            <div>
              <h2 className="font-serif text-xl font-semibold text-[#F5F4EF]">Confidentiality & Privileged Counsel</h2>
              <p className="mt-3 text-xs sm:text-sm leading-relaxed text-[#E6ECF3]">
                All communications and consultation details with {lawyer.name} are strictly confidential and protected by advocate-client privilege.
              </p>
            </div>

            <div className="space-y-2.5 pt-3 border-t border-white/10">
              {[
                "100% Attorney-Client Privileged Communications",
                `Consultations available ${LAW_FIRM.workingDays}`,
                "Direct Advocate Contact & Responsive Support",
              ].map((point) => (
                <div key={point} className="flex items-center gap-2.5">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#D6A85F]/20 text-[#D6A85F] border border-[#D6A85F]/40">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-[#F5F4EF]">{point}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1 text-xs text-[#D6A85F]">
              <ShieldCheck className="h-4 w-4" />
              <span>Sharma & Associates Law Firm Protection Guarantee</span>
            </div>
          </section>
        </div>
      </div>

      {/* MOBILE STICKY ACTION BAR */}
      {(contact.hasPhone || contact.hasWhatsApp) && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/15 bg-[#03142B]/95 p-3 backdrop-blur-lg lg:hidden shadow-2xl">
          <div className="flex items-center gap-2">
            <LawyerContactActions
              lawyer={lawyer as unknown as Record<string, unknown>}
              lawyerName={lawyer.name}
              compact
              className="flex-1"
            />
            <Button asChild size="sm" className="bg-[#D6A85F] text-[#061A35] font-bold hover:bg-[#E5B86E] rounded-xl text-xs h-10 px-4">
              <Link to="/appointment" search={bookingSearch}>
                Book
              </Link>
            </Button>
          </div>
        </div>
      )}
    </article>
  );
}

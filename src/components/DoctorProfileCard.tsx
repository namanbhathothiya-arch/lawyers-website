import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Award, Briefcase, CalendarDays, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DBLawyer } from "@/hooks/use-supabase-data";
import { getDoctorImage } from "@/lib/clinic-data";
import { cn } from "@/lib/utils";
import { ImageCarousel } from "@/components/ImageCarousel";
import { getDoctorImageList } from "@/lib/image-lists";
import { LawyerContactActions } from "@/components/LawyerContactActions";

type DoctorProfileCardProps = {
  doctor: DBLawyer;
  compact?: boolean;
  serviceId?: string;
};

function getSpecializationChips(specialization: string) {
  const chips = specialization
    .split(/[,/&|]+/)
    .map((item) => item.trim())
    .filter(Boolean);

  return chips.length > 0 ? chips.slice(0, 3) : ["Legal Practice"];
}

function formatExperience(experience: string) {
  return /experience/i.test(experience) ? experience : `${experience} Experience`;
}

export function DoctorProfileCard({
  doctor,
  compact = false,
  serviceId,
}: DoctorProfileCardProps) {
  const specializationChips = getSpecializationChips(doctor.specialization);
  const profileSearch = serviceId ? { service: serviceId } : {};
  const bookingSearch = serviceId
    ? { lawyer: doctor.id, doctor: doctor.id, service: serviceId }
    : { lawyer: doctor.id, doctor: doctor.id };
  const doctorImages = getDoctorImageList(
    doctor as unknown as Record<string, unknown>,
    getDoctorImage(doctor.id, doctor.photo),
  ).map((src, index) => ({
    src,
    alt:
      index === 0
        ? `${doctor.name}, ${doctor.specialization}`
        : `${doctor.name} profile image ${index + 1}`,
  }));

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl">
      <Link
        to="/doctors/$lawyerId"
        params={{ lawyerId: doctor.id }}
        search={profileSearch}
        className="absolute inset-0 z-0 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 rounded-xl"
        aria-label={`View profile for ${doctor.name}`}
      />

      <div
        className={cn(
          "relative z-10 overflow-hidden bg-slate-900",
          compact ? "aspect-[4/3]" : "aspect-[5/4] sm:aspect-[4/3]",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <ImageCarousel
          images={doctorImages}
          label={`${doctor.name} image gallery`}
          className="h-full"
          frameClassName="p-3 sm:p-4"
          imageClassName="rounded-lg filter brightness-[0.96] contrast-[1.02]"
          emptyLabel="Lawyer photo coming soon"
        />
        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-slate-900/80 to-transparent" />

        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/30 bg-slate-900/80 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-wider text-blue-300 backdrop-blur-md">
            <Award className="h-3.5 w-3.5" aria-hidden="true" />
            Advocate
          </span>
        </div>

        <div className="absolute bottom-4 left-4 right-4">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-slate-900/85 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md">
            <Briefcase className="h-3.5 w-3.5 text-blue-400" aria-hidden="true" />
            {formatExperience(doctor.experience)}
          </span>
        </div>
      </div>

      <div className={cn("relative z-10 flex flex-1 flex-col pointer-events-none", compact ? "p-5" : "p-5 sm:p-6")}>
        <div>
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-blue-600">
            {doctor.specialization}
          </p>
          <h3 className="mt-1.5 font-serif text-xl font-semibold leading-tight text-slate-900 sm:text-2xl">
            <Link
              to="/doctors/$lawyerId"
              params={{ lawyerId: doctor.id }}
              search={profileSearch}
              className="pointer-events-auto transition-colors duration-200 hover:text-blue-600"
            >
              {doctor.name}
            </Link>
          </h3>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5" aria-label="Practice focus">
          {specializationChips.map((chip) => (
            <span
              key={chip}
              className="rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
            >
              {chip}
            </span>
          ))}
        </div>

        {!compact && doctor.bio && (
          <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-slate-600">{doctor.bio}</p>
        )}

        <div
          className="mt-auto space-y-3 pt-5 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <LawyerContactActions
            lawyer={doctor as unknown as Record<string, unknown>}
            lawyerName={doctor.name}
            compact
          />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button
              asChild
              variant="outline"
              className="min-h-11 rounded-lg border-slate-300 bg-white text-slate-800 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-400"
            >
              <Link to="/doctors/$lawyerId" params={{ lawyerId: doctor.id }} search={profileSearch}>
                <UserRound className="h-4 w-4 text-slate-600" aria-hidden="true" />
                View profile
              </Link>
            </Button>
            <Button
              asChild
              className="min-h-11 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
            >
              <Link to="/appointment" search={bookingSearch}>
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
                Book
                <ArrowUpRight
                  className="ml-auto h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

export const LawyerProfileCard = DoctorProfileCard;

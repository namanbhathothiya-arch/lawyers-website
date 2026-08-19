import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Award, Briefcase, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DBLawyer } from "@/hooks/use-supabase-data";
import { getDoctorImage } from "@/lib/clinic-data";
import { cn } from "@/lib/utils";
import { ImageCarousel } from "@/components/ImageCarousel";
import { getDoctorImageList } from "@/lib/image-lists";

type DoctorProfileCardProps = {
  doctor: DBLawyer;
  compact?: boolean;
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

export function DoctorProfileCard({ doctor, compact = false }: DoctorProfileCardProps) {
  const specializationChips = getSpecializationChips(doctor.specialization);
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
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-800 bg-[#121b2d] text-slate-100 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-blue-600/50 hover:shadow-2xl">
      <div
        className={cn(
          "relative overflow-hidden bg-slate-950",
          compact ? "aspect-[4/3]" : "aspect-[5/4] sm:aspect-[4/3]",
        )}
      >
        <ImageCarousel
          images={doctorImages}
          label={`${doctor.name} image gallery`}
          className="h-full"
          frameClassName="p-3 sm:p-4"
          imageClassName="rounded-xl filter brightness-[0.9] contrast-[1.05]"
          emptyLabel="Lawyer photo coming soon"
        />
        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[#121b2d] to-transparent" />

        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-950/80 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-wider text-blue-400 shadow-md backdrop-blur-md">
            <Award className="h-3.5 w-3.5" aria-hidden="true" />
            Advocate
          </span>
        </div>

        <div className="absolute bottom-4 left-4 right-4">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900/90 px-3 py-1.5 text-xs font-medium text-amber-400 shadow-md backdrop-blur-md">
            <Briefcase className="h-3.5 w-3.5" aria-hidden="true" />
            {formatExperience(doctor.experience)}
          </span>
        </div>
      </div>

      <div className={cn("flex flex-1 flex-col", compact ? "p-5" : "p-5 sm:p-6")}>
        <div>
          <p className="text-[0.68rem] font-bold uppercase tracking-widest text-blue-400">
            Legal Advocate
          </p>
          <h3 className="mt-1 font-serif text-xl font-bold leading-tight text-white sm:text-2xl">
            {doctor.name}
          </h3>
          <p className="mt-1 text-sm font-medium leading-relaxed text-slate-300">
            {doctor.specialization}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5" aria-label="Specializations">
          {specializationChips.map((chip) => (
            <span
              key={chip}
              className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-300"
            >
              {chip}
            </span>
          ))}
        </div>

        {!compact && doctor.bio && (
          <p className="mt-4 line-clamp-3 text-xs leading-relaxed text-slate-400">{doctor.bio}</p>
        )}

        <div className="mt-auto pt-5">
          <Button
            asChild
            size="lg"
            className="h-11 w-full rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-md shadow-blue-950 transition-all duration-300"
          >
            <Link to="/appointment" search={{ lawyer: doctor.id, doctor: doctor.id }}>
              <CalendarDays className="h-4 w-4 mr-1.5" aria-hidden="true" />
              Book Consultation
              <ArrowUpRight
                className="ml-auto h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}

export const LawyerProfileCard = DoctorProfileCard;

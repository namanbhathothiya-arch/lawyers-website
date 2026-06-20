import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Award, BriefcaseMedical, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DBDoctor } from "@/hooks/use-supabase-data";
import { getDoctorImage } from "@/lib/clinic-data";
import { cn } from "@/lib/utils";
import { ImageCarousel } from "@/components/ImageCarousel";
import { getDoctorImageList } from "@/lib/image-lists";

type DoctorProfileCardProps = {
  doctor: DBDoctor;
  compact?: boolean;
};

function getSpecializationChips(specialization: string) {
  const chips = specialization
    .split(/[,/&|]+/)
    .map((item) => item.trim())
    .filter(Boolean);

  return chips.length > 0 ? chips.slice(0, 3) : ["Specialist care"];
}

function formatExperience(experience: string) {
  return /experience/i.test(experience) ? experience : `${experience} experience`;
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
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-primary/10 bg-card shadow-[0_18px_50px_-32px_rgba(20,69,123,0.55)] transition-all duration-500 hover:-translate-y-1.5 hover:border-primary/25 hover:shadow-[0_28px_70px_-32px_rgba(20,69,123,0.5)]">
      <div
        className={cn(
          "relative overflow-hidden bg-[linear-gradient(145deg,var(--color-primary-light),var(--color-muted))]",
          compact ? "aspect-[4/3]" : "aspect-[5/4] sm:aspect-[4/3]",
        )}
      >
        <ImageCarousel
          images={doctorImages}
          label={`${doctor.name} image gallery`}
          className="h-full"
          frameClassName="p-3 sm:p-4"
          imageClassName="rounded-[1.15rem]"
          emptyLabel="Doctor image coming soon"
        />
        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-slate-950/55 to-transparent" />

        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/90 px-3 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-primary shadow-sm backdrop-blur-md">
            <Award className="h-3.5 w-3.5" aria-hidden="true" />
            Specialist
          </span>
        </div>

        <div className="absolute bottom-4 left-4 right-4">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-slate-950/45 px-3 py-1.5 text-xs font-semibold text-white shadow-sm backdrop-blur-md">
            <BriefcaseMedical className="h-3.5 w-3.5" aria-hidden="true" />
            {formatExperience(doctor.experience)}
          </span>
        </div>
      </div>

      <div className={cn("flex flex-1 flex-col", compact ? "p-5" : "p-5 sm:p-6")}>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary/75">
            Medical professional
          </p>
          <h3 className="mt-1.5 font-display text-xl font-bold leading-tight text-foreground sm:text-2xl">
            {doctor.name}
          </h3>
          <p className="mt-1.5 text-sm font-semibold leading-relaxed text-primary">
            {doctor.specialization}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2" aria-label="Specializations">
          {specializationChips.map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-primary/10 bg-primary-light px-3 py-1 text-xs font-semibold text-secondary-foreground"
            >
              {chip}
            </span>
          ))}
        </div>

        {!compact && doctor.bio && (
          <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted-foreground">{doctor.bio}</p>
        )}

        <div className="mt-auto pt-5">
          <Button
            asChild
            size="lg"
            className="h-11 w-full rounded-xl shadow-[0_12px_26px_-14px_rgba(20,69,123,0.9)] transition-all duration-300 group-hover:shadow-[0_16px_30px_-14px_rgba(20,69,123,0.75)]"
          >
            <Link to="/appointment" search={{ doctor: doctor.id }}>
              <CalendarDays aria-hidden="true" />
              Book Appointment
              <ArrowUpRight
                className="ml-auto transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}

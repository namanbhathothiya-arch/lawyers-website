import { MessageCircle, Phone } from "lucide-react";
import { getLawyerDirectContact } from "@/lib/lawyer-contact";
import { cn } from "@/lib/utils";

type LawyerContactActionsProps = {
  lawyer: Record<string, unknown>;
  lawyerName: string;
  compact?: boolean;
  className?: string;
};

export function LawyerContactActions({
  lawyer,
  lawyerName,
  compact = false,
  className,
}: LawyerContactActionsProps) {
  const contact = getLawyerDirectContact(lawyer);

  if (!contact.hasPhone && !contact.hasWhatsApp) {
    if (compact) return null;
    return (
      <p className={cn("text-xs leading-relaxed text-slate-400", className)}>
        Direct Call and WhatsApp for {lawyerName} are not listed on this profile. You can still
        request a consultation with this advocate.
      </p>
    );
  }

  return (
    <div
      className={cn(
        "grid gap-3",
        compact
          ? "grid-cols-1 sm:grid-cols-2"
          : contact.hasPhone && contact.hasWhatsApp
          ? "grid-cols-1 sm:grid-cols-2"
          : "grid-cols-1",
        className,
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {contact.hasPhone && (
        <a
          href={contact.phoneHref}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "group inline-flex min-h-[48px] items-center gap-3 rounded-xl border border-white/20 bg-[#F5F4EF] px-4 py-2.5 text-sm font-semibold text-[#061A35] transition-all duration-200 hover:bg-white hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6A85F]",
            compact ? "min-h-10 px-3 py-2 text-xs gap-2" : "w-full",
          )}
          aria-label={`Call ${lawyerName} at ${contact.phoneDisplay}`}
        >
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#061A35] text-[#F5F4EF] shadow-sm transition-transform duration-200 group-hover:scale-105">
            <Phone className="h-4 w-4 text-[#D6A85F]" aria-hidden="true" />
          </div>
          <div className="flex flex-col text-left leading-tight min-w-0">
            <span className="font-bold text-[#061A35]">Call Now</span>
            {contact.phoneDisplay && (
              <span className="truncate text-[0.72rem] font-medium text-[#2d4766]">
                {contact.phoneDisplay}
              </span>
            )}
          </div>
        </a>
      )}

      {contact.hasWhatsApp && (
        <a
          href={contact.whatsappHref}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "group inline-flex min-h-[48px] items-center gap-3 rounded-xl border border-emerald-400/40 bg-[#064e3b]/80 px-4 py-2.5 text-sm font-semibold text-emerald-100 transition-all duration-200 hover:bg-[#047857] hover:border-emerald-300/60 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 backdrop-blur-md",
            compact ? "min-h-10 px-3 py-2 text-xs gap-2" : "w-full",
          )}
          aria-label={`Chat with ${lawyerName} on WhatsApp`}
        >
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald-500 text-slate-950 shadow-sm transition-transform duration-200 group-hover:scale-105">
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="flex flex-col text-left leading-tight min-w-0">
            <span className="font-bold text-emerald-50">Chat on WhatsApp</span>
            <span className="truncate text-[0.72rem] font-medium text-emerald-200/90">
              {contact.whatsappDisplay || "Direct WhatsApp"}
            </span>
          </div>
        </a>
      )}
    </div>
  );
}

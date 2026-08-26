import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Lock,
  MessageSquare,
  Scale,
  Shield,
  Target,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAboutContent } from "@/hooks/use-about-content";
import { Skeleton } from "@/components/ui/skeleton";

/* -----------------------------------------------------------------------
 * Static fallback shown when DB record is unavailable (graceful degradation)
 * --------------------------------------------------------------------- */
const FALLBACK = {
  eyebrow: "ABOUT OUR FIRM",
  headline: "Experienced counsel. Clear strategy. Trusted representation.",
  subheadline:
    "A client-focused legal practice built around thoughtful advice, careful preparation, and direct communication.",
  mission:
    "We help individuals, families, and businesses understand their legal position, evaluate their options, and move forward with confidence.",
  primary_cta_label: "Book a Consultation",
  primary_cta_url: "/appointment",
  secondary_cta_label: "Meet Our Lawyers",
  secondary_cta_url: "/doctors",
};

const APPROACH_CARDS = [
  {
    icon: MessageSquare,
    title: "Clear Advice",
    body: "We explain your legal position plainly so you can make informed decisions without unnecessary jargon.",
  },
  {
    icon: BookOpen,
    title: "Careful Preparation",
    body: "Every matter receives thorough document review and statutory analysis before any step is taken.",
  },
  {
    icon: Users,
    title: "Direct Access",
    body: "You speak directly with your advocate throughout your engagement, not a junior representative.",
  },
  {
    icon: Lock,
    title: "Strict Confidentiality",
    body: "All communications and case details are protected by legal professional privilege.",
  },
  {
    icon: Target,
    title: "Practical Strategy",
    body: "We focus on workable solutions that reflect your actual circumstances and stated objectives.",
  },
];

/* -----------------------------------------------------------------------
 * Home About Section – compact two-column layout inserted after trust strip
 * --------------------------------------------------------------------- */
export function HomeAboutSection() {
  const { data: about, isLoading, isError } = useAboutContent();

  const content = about ?? FALLBACK;

  return (
    <section
      aria-labelledby="home-about-heading"
      className="bg-white border-b border-slate-200"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* ── LEFT COLUMN ── */}
          <div>
            {isLoading ? (
              <AboutLoadingSkeleton />
            ) : (
              <>
                {/* eyebrow */}
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5">
                  <Scale className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
                  <span className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-blue-700">
                    {content.eyebrow}
                  </span>
                </div>

                {/* headline */}
                <h2
                  id="home-about-heading"
                  className="mt-5 font-serif text-3xl font-semibold leading-snug tracking-tight text-[#061A35] sm:text-4xl"
                >
                  {content.headline}
                </h2>

                {/* subheadline */}
                <p className="mt-4 text-base leading-relaxed text-slate-600">
                  {content.subheadline}
                </p>

                {/* mission */}
                <p className="mt-4 text-sm leading-relaxed text-slate-500">
                  {content.mission}
                </p>

                {/* CTAs */}
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button
                    asChild
                    size="lg"
                    className="group min-h-11 rounded-[10px] bg-[#061A35] hover:bg-[#0d2847] text-white px-6 font-semibold shadow-md transition-all duration-200 hover:-translate-y-0.5"
                  >
                    <Link
                      to={content.primary_cta_url as "/appointment"}
                      className="inline-flex items-center gap-2"
                    >
                      <CalendarDays className="h-4 w-4" aria-hidden="true" />
                      {content.primary_cta_label}
                      <ArrowRight
                        className="ml-0.5 h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1"
                        aria-hidden="true"
                      />
                    </Link>
                  </Button>

                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="min-h-11 rounded-[10px] border-slate-300 bg-white text-slate-800 hover:bg-slate-50 px-6 font-semibold shadow-sm transition-all duration-200 hover:-translate-y-0.5"
                  >
                    <Link to="/about" className="inline-flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-600" aria-hidden="true" />
                      About Our Firm
                    </Link>
                  </Button>
                </div>

                {/* link to full about page */}
                <p className="mt-4 text-xs text-slate-400">
                  Learn more about our practice approach and values on our{" "}
                  <Link
                    to="/about"
                    className="text-blue-600 hover:text-blue-700 underline underline-offset-2 font-medium"
                  >
                    About page
                  </Link>
                  .
                </p>
              </>
            )}
          </div>

          {/* ── RIGHT COLUMN: approach cards ── */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
            {APPROACH_CARDS.map((card) => (
              <article
                key={card.title}
                className="group flex gap-4 rounded-xl border border-slate-200 bg-[#F8FAFC] p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-md"
              >
                <div
                  className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-blue-100 bg-blue-50 text-blue-600 transition-colors duration-200 group-hover:bg-blue-600 group-hover:text-white"
                  aria-hidden="true"
                >
                  <card.icon className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-serif text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors duration-200">
                    {card.title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{card.body}</p>
                </div>
              </article>
            ))}

            {/* "Learn more" footer card */}
            {!isLoading && (
              <Link
                to="/about"
                aria-label="Learn more about our firm"
                className="group flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-blue-200 bg-blue-50/60 p-5 text-center text-blue-700 transition-all duration-200 hover:-translate-y-1 hover:border-blue-400 hover:bg-blue-50 sm:col-span-2 lg:col-span-1 xl:col-span-2"
              >
                <span className="text-sm font-semibold">Learn About Our Firm</span>
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
            )}

            {isError && (
              <p className="col-span-full text-xs text-slate-400 text-center mt-2">
                Content is temporarily unavailable.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function AboutLoadingSkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      <Skeleton className="h-7 w-32 rounded-full" />
      <Skeleton className="h-10 w-5/6 rounded-lg" />
      <Skeleton className="h-10 w-2/3 rounded-lg" />
      <Skeleton className="h-4 w-full rounded" />
      <Skeleton className="h-4 w-4/5 rounded" />
      <div className="flex gap-3 mt-6">
        <Skeleton className="h-11 w-40 rounded-[10px]" />
        <Skeleton className="h-11 w-36 rounded-[10px]" />
      </div>
    </div>
  );
}

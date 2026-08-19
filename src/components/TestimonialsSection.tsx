import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, Scale, Quote, ShieldCheck, Star } from "lucide-react";
import type { CarouselApi } from "@/components/ui/carousel";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useTestimonials, type DBTestimonial } from "@/hooks/use-supabase-data";

const FALLBACK_TESTIMONIALS: DBTestimonial[] = [
  {
    id: "priya-shah",
    client_name: "Priya Shah",
    client_label: "Corporate Law Client",
    patient_name: "Priya Shah",
    patient_label: "Corporate Law Client",
    review:
      "The advocate made a complex commercial legal dispute manageable. They listened carefully, explained every legal option under Indian law, and gave our board complete confidence.",
    rating: 5,
    image_url:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=320&q=85",
    sort_order: 0,
    is_published: true,
  },
  {
    id: "rohan-mehta",
    client_name: "Rohan Mehta",
    client_label: "Property & Civil Client",
    patient_name: "Rohan Mehta",
    patient_label: "Property & Civil Client",
    review:
      "The entire legal consultation was punctual, confidential, and genuinely thorough. My options were explained clearly without legal jargon, and the litigation strategy was solid.",
    rating: 5,
    image_url:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=320&q=85",
    sort_order: 1,
    is_published: true,
  },
  {
    id: "meera-jain",
    client_name: "Meera Jain",
    client_label: "Arbitration Client",
    patient_name: "Meera Jain",
    patient_label: "Arbitration Client",
    review:
      "What stands out is the dedication and strategic foresight of the advocates. I never felt rushed, every detail was reviewed carefully, and our interests were fiercely protected.",
    rating: 5,
    image_url:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=320&q=85",
    sort_order: 2,
    is_published: true,
  },
];

function ClientImage({ testimonial }: { testimonial: DBTestimonial }) {
  const [failed, setFailed] = useState(false);
  const displayName = testimonial.client_name || testimonial.patient_name || "Client";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

  if (!testimonial.image_url || failed) {
    return (
      <div className="grid h-12 w-12 place-items-center rounded-full bg-blue-600 text-xs font-bold text-white ring-2 ring-blue-500/30">
        {initials}
      </div>
    );
  }

  return (
    <img
      src={testimonial.image_url}
      alt={`${displayName}, client`}
      className="h-12 w-12 rounded-full object-cover object-top ring-2 ring-blue-500/30"
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

function TestimonialCard({ testimonial }: { testimonial: DBTestimonial }) {
  const reviewRef = useRef<HTMLQuoteElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const displayName = testimonial.client_name || testimonial.patient_name || "Client";
  const displayLabel = testimonial.client_label || testimonial.patient_label || "Verified Client";

  useEffect(() => {
    setIsExpanded(false);
  }, [testimonial.id, testimonial.review]);

  useEffect(() => {
    const review = reviewRef.current;
    if (!review) return;

    const measureOverflow = () => {
      if (!isExpanded) {
        setCanExpand(review.scrollHeight > review.clientHeight + 1);
      }
    };

    measureOverflow();
    const observer = new ResizeObserver(measureOverflow);
    observer.observe(review);
    return () => observer.disconnect();
  }, [isExpanded, testimonial.review]);

  return (
    <article className="group relative flex h-full min-h-80 min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-800 bg-[#121b2d] p-6 text-slate-100 shadow-xl backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-blue-600/40 hover:shadow-2xl sm:p-7">
      <div className="absolute right-5 top-5 text-blue-500/10 transition-colors duration-300 group-hover:text-blue-500/20">
        <Quote className="h-16 w-16 fill-current" aria-hidden="true" />
      </div>

      <div
        className="relative flex gap-1 text-amber-400"
        aria-label={`${testimonial.rating} out of 5 stars`}
      >
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            className={cn("h-4 w-4", index < testimonial.rating ? "fill-current" : "text-slate-700")}
            aria-hidden="true"
          />
        ))}
      </div>

      <div className="relative mt-5 min-w-0 flex-1">
        <blockquote
          ref={reviewRef}
          id={`testimonial-review-${testimonial.id}`}
          className={cn(
            "min-w-0 max-w-full whitespace-normal break-words font-serif text-[0.98rem] leading-relaxed text-slate-200 [overflow-wrap:anywhere]",
            !isExpanded && "line-clamp-5",
          )}
        >
          “{testimonial.review}”
        </blockquote>

        {canExpand && (
          <button
            type="button"
            onClick={() => setIsExpanded((current) => !current)}
            className="mx-auto mt-2 grid h-8 w-8 place-items-center rounded-full text-blue-400 transition-colors hover:bg-slate-800"
            aria-expanded={isExpanded}
            aria-controls={`testimonial-review-${testimonial.id}`}
            aria-label={`${isExpanded ? "Collapse" : "Show full"} testimonial from ${displayName}`}
          >
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform duration-300",
                isExpanded && "rotate-180",
              )}
              aria-hidden="true"
            />
          </button>
        )}
      </div>

      <div className="relative mt-6 flex min-w-0 items-center gap-3.5 border-t border-slate-800/80 pt-4">
        <ClientImage testimonial={testimonial} />
        <div className="min-w-0">
          <div className="truncate font-serif font-bold text-white text-base">{displayName}</div>
          <div className="mt-0.5 truncate text-xs font-medium text-slate-400">
            {displayLabel}
          </div>
        </div>
        <span className="ml-auto grid h-6 w-6 shrink-0 place-items-center rounded-full bg-blue-950 text-blue-400 border border-blue-800/50">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
      </div>
    </article>
  );
}

export function TestimonialsSection() {
  const { data, isLoading } = useTestimonials();
  const testimonials = data?.length ? data : FALLBACK_TESTIMONIALS;
  const [api, setApi] = useState<CarouselApi>();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const syncSelectedIndex = useCallback((carouselApi: CarouselApi) => {
    if (carouselApi) setSelectedIndex(carouselApi.selectedScrollSnap());
  }, []);

  useEffect(() => {
    if (!api) return;
    syncSelectedIndex(api);
    api.on("select", syncSelectedIndex);
    api.on("reInit", syncSelectedIndex);
    return () => {
      api.off("select", syncSelectedIndex);
      api.off("reInit", syncSelectedIndex);
    };
  }, [api, syncSelectedIndex]);

  useEffect(() => {
    if (!api || isPaused || testimonials.length < 2) return;
    const timer = window.setInterval(() => api.scrollNext(), 5500);
    return () => window.clearInterval(timer);
  }, [api, isPaused, testimonials.length]);

  return (
    <section className="testimonial-section relative isolate overflow-hidden border-y border-slate-800/80 py-20 sm:py-24 bg-[#080d17]">
      <div className="testimonial-grid absolute inset-0 -z-20" />
      <div className="absolute -left-24 top-16 -z-10 h-72 w-72 rounded-full bg-blue-600/10 blur-3xl" />
      <div className="absolute -right-24 bottom-0 -z-10 h-80 w-80 rounded-full bg-blue-900/15 blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-end gap-8 lg:grid-cols-[1fr_auto]">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/25 bg-blue-950/60 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-widest text-blue-400 shadow-sm backdrop-blur">
              <Scale className="h-3.5 w-3.5" aria-hidden="true" />
              Client Testimonials & Case Results
            </div>
            <h2 className="hero-display mt-5 font-serif text-3xl font-bold leading-tight text-white sm:text-5xl">
              Legal Representation <span className="text-blue-500">Clients Trust.</span>
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300">
              Verifiable feedback from corporate leaders, property owners, and individuals represented by our chambers.
            </p>
          </div>

          <div className="hidden items-center gap-2 text-sm font-medium text-slate-400 sm:flex">
            <ShieldCheck className="h-4 w-4 text-blue-400" aria-hidden="true" />
            Confidential Client Representation
          </div>
        </div>

        {isLoading ? (
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-80 rounded-2xl bg-slate-900" />
            ))}
          </div>
        ) : (
          <Carousel
            setApi={setApi}
            opts={{ align: "start", loop: testimonials.length > 2, duration: 32 }}
            className="mt-12"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onFocusCapture={() => setIsPaused(true)}
            onBlurCapture={() => setIsPaused(false)}
            aria-label="Client testimonials"
          >
            <CarouselContent className="-ml-5">
              {testimonials.map((testimonial) => (
                <CarouselItem key={testimonial.id} className="pl-5 md:basis-1/2 lg:basis-1/3">
                  <TestimonialCard testimonial={testimonial} />
                </CarouselItem>
              ))}
            </CarouselContent>

            {testimonials.length > 1 && (
              <>
                <div className="mt-8 flex items-center justify-between">
                  <div className="flex items-center gap-2" aria-label="Choose testimonial slide">
                    {testimonials.map((testimonial, index) => (
                      <button
                        key={testimonial.id}
                        type="button"
                        onClick={() => api?.scrollTo(index)}
                        className={cn(
                          "h-2 rounded-full transition-all duration-300",
                          selectedIndex === index
                            ? "w-8 bg-blue-500"
                            : "w-2 bg-slate-800 hover:bg-slate-700",
                        )}
                        aria-label={`Go to testimonial ${index + 1}`}
                        aria-current={selectedIndex === index ? "true" : undefined}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <CarouselPrevious className="static h-10 w-10 translate-y-0 border-slate-700 bg-slate-900 text-slate-200 hover:bg-blue-600 hover:text-white" />
                    <CarouselNext className="static h-10 w-10 translate-y-0 border-slate-700 bg-slate-900 text-slate-200 hover:bg-blue-600 hover:text-white" />
                  </div>
                </div>
              </>
            )}
          </Carousel>
        )}
      </div>
    </section>
  );
}

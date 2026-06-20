import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, HeartPulse, Quote, ShieldCheck, Star } from "lucide-react";
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
    patient_name: "Priya Shah",
    patient_label: "Cardiac care patient",
    review:
      "Dr. Sharma made a frightening diagnosis feel manageable. He listened carefully, explained every option, and gave our family complete confidence in the next step.",
    rating: 5,
    image_url:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=320&q=85",
    sort_order: 0,
    is_published: true,
  },
  {
    id: "rohan-mehta",
    patient_name: "Rohan Mehta",
    patient_label: "Preventive screening patient",
    review:
      "The entire experience was calm, punctual, and genuinely personal. My results were explained in plain language and the follow-up plan was exceptionally clear.",
    rating: 5,
    image_url:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=320&q=85",
    sort_order: 1,
    is_published: true,
  },
  {
    id: "meera-jain",
    patient_name: "Meera Jain",
    patient_label: "Long-term care patient",
    review:
      "What stands out is the continuity of care. I never feel rushed, every concern is taken seriously, and the team remembers the details that matter.",
    rating: 5,
    image_url:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=320&q=85",
    sort_order: 2,
    is_published: true,
  },
];

function PatientImage({ testimonial }: { testimonial: DBTestimonial }) {
  const [failed, setFailed] = useState(false);
  const initials = testimonial.patient_name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

  if (!testimonial.image_url || failed) {
    return (
      <div className="grid h-14 w-14 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground ring-4 ring-white">
        {initials}
      </div>
    );
  }

  return (
    <img
      src={testimonial.image_url}
      alt={`${testimonial.patient_name}, patient`}
      className="h-14 w-14 rounded-full object-cover object-top ring-4 ring-white"
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
    <article className="group relative flex h-full min-h-80 min-w-0 flex-col overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/90 p-6 shadow-[0_24px_70px_-38px_rgba(16,45,75,0.55)] backdrop-blur transition-all duration-500 hover:-translate-y-1 hover:border-primary/20 hover:shadow-[0_30px_80px_-35px_rgba(16,45,75,0.65)] sm:p-7">
      <div className="absolute right-5 top-5 text-primary/8 transition-colors duration-500 group-hover:text-primary/12">
        <Quote className="h-20 w-20 fill-current" aria-hidden="true" />
      </div>

      <div
        className="relative flex gap-1 text-amber-400"
        aria-label={`${testimonial.rating} out of 5 stars`}
      >
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            className={cn("h-4 w-4", index < testimonial.rating ? "fill-current" : "text-border")}
            aria-hidden="true"
          />
        ))}
      </div>

      <div className="relative mt-6 min-w-0 flex-1">
        <blockquote
          ref={reviewRef}
          id={`testimonial-review-${testimonial.id}`}
          className={cn(
            "min-w-0 max-w-full whitespace-normal break-all text-[0.98rem] leading-7 text-foreground/85 [overflow-wrap:anywhere]",
            !isExpanded && "line-clamp-5",
          )}
        >
          “{testimonial.review}”
        </blockquote>

        {canExpand && (
          <button
            type="button"
            onClick={() => setIsExpanded((current) => !current)}
            className="mx-auto mt-2 grid h-8 w-8 place-items-center rounded-full text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-expanded={isExpanded}
            aria-controls={`testimonial-review-${testimonial.id}`}
            aria-label={`${isExpanded ? "Collapse" : "Show full"} testimonial from ${testimonial.patient_name}`}
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

      <div className="relative mt-7 flex min-w-0 items-center gap-4 border-t border-primary/10 pt-5">
        <PatientImage testimonial={testimonial} />
        <div className="min-w-0">
          <div className="truncate font-bold text-foreground">{testimonial.patient_name}</div>
          <div className="mt-0.5 truncate text-xs font-medium text-muted-foreground">
            {testimonial.patient_label || "Verified patient"}
          </div>
        </div>
        <span className="ml-auto grid h-7 w-7 shrink-0 place-items-center rounded-full bg-success/10 text-success">
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
    <section className="testimonial-section relative isolate overflow-hidden border-y border-primary/10 py-20 sm:py-24">
      <div className="testimonial-grid absolute inset-0 -z-20" />
      <div className="absolute -left-24 top-16 -z-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -right-24 bottom-0 -z-10 h-80 w-80 rounded-full bg-accent/80 blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-end gap-8 lg:grid-cols-[1fr_auto]">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/75 px-3.5 py-2 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-primary shadow-sm backdrop-blur">
              <HeartPulse className="h-3.5 w-3.5" aria-hidden="true" />
              Patient stories
            </div>
            <h2 className="hero-display mt-5 text-4xl leading-tight text-foreground sm:text-5xl">
              Care that patients <span className="text-primary">feel and remember.</span>
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              Real experiences from patients who trusted us with the health of their hearts.
            </p>
          </div>

          <div className="hidden items-center gap-2 text-sm font-medium text-foreground/70 sm:flex">
            <ShieldCheck className="h-4 w-4 text-success" aria-hidden="true" />
            Patient-first, consultant-led care
          </div>
        </div>

        {isLoading ? (
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-80 rounded-[1.75rem]" />
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
            aria-label="Patient testimonials"
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
                            ? "w-8 bg-primary"
                            : "w-2 bg-primary/20 hover:bg-primary/40",
                        )}
                        aria-label={`Go to testimonial ${index + 1}`}
                        aria-current={selectedIndex === index ? "true" : undefined}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <CarouselPrevious className="static h-11 w-11 translate-y-0 border-primary/15 bg-white/90 shadow-sm hover:bg-primary hover:text-primary-foreground" />
                    <CarouselNext className="static h-11 w-11 translate-y-0 border-primary/15 bg-white/90 shadow-sm hover:bg-primary hover:text-primary-foreground" />
                  </div>
                </div>
                <div className="sr-only" aria-live="polite">
                  Testimonial {selectedIndex + 1} of {testimonials.length}
                </div>
              </>
            )}
          </Carousel>
        )}
      </div>
    </section>
  );
}

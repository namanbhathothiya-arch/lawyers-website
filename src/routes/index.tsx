import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ShieldCheck,
  Clock,
  HeartPulse,
  Award,
  Star,
  Phone,
  Mail,
  MapPin,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import heroImg from "@/assets/hero-clinic.jpg";
import { TESTIMONIALS, CLINIC, getDoctorImage } from "@/lib/clinic-data";
import { useDoctors, useServices } from "@/hooks/use-supabase-data";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Advanced Care Medical Clinic — Expert Multi-Specialty Care" },
      {
        name: "description",
        content:
          "Book trusted doctors across general medicine, cardiology, dermatology and orthopedics at Advanced Care Medical Clinic.",
      },
      { property: "og:title", content: "Advanced Care Medical Clinic — Expert Multi-Specialty Care" },
      {
        property: "og:description",
        content:
          "Book trusted doctors across general medicine, cardiology, dermatology and orthopedics at Advanced Care Medical Clinic.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://advancedcareclinic.com/" },
      { property: "og:image", content: "https://advancedcareclinic.com/og-image.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Advanced Care Medical Clinic — Expert Multi-Specialty Care" },
      {
        name: "twitter:description",
        content:
          "Book trusted doctors across general medicine, cardiology, dermatology and orthopedics at Advanced Care Medical Clinic.",
      },
      { name: "twitter:image", content: "https://advancedcareclinic.com/og-image.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://advancedcareclinic.com/" }],
  }),
  component: HomePage,
});

type GalleryImage = {
  id: string;
  image_url: string;
  title: string | null;
  sort_order: number;
  created_at: string;
};

function HomePage() {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [isFullGalleryOpen, setIsFullGalleryOpen] = useState(false);
  const [activeDot, setActiveDot] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  const { data: galleryImages, isLoading: loadingGallery } = useQuery({
    queryKey: ["gallery-images"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_images")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data || []) as GalleryImage[];
    },
  });

  const handleScroll = () => {
    if (!carouselRef.current) return;
    const container = carouselRef.current;
    const scrollLeft = container.scrollLeft;
    const itemWidth = container.clientWidth * 0.85;
    const idx = Math.round(scrollLeft / itemWidth);
    setActiveDot(Math.max(0, Math.min(3, idx)));
  };

  const scrollCarousel = (direction: "left" | "right") => {
    if (!carouselRef.current) return;
    const container = carouselRef.current;
    const cardWidth = container.clientWidth / 3;
    container.scrollBy({
      left: direction === "left" ? -cardWidth : cardWidth,
      behavior: "smooth"
    });
  };

  // Keyboard navigation for Lightbox and Full Gallery Overlay
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (lightboxIdx !== null) {
          setLightboxIdx(null);
        } else if (isFullGalleryOpen) {
          setIsFullGalleryOpen(false);
        }
      } else if (lightboxIdx !== null && galleryImages) {
        if (e.key === "ArrowLeft") {
          setLightboxIdx((prev) => (prev !== null && prev > 0 ? prev - 1 : galleryImages.length - 1));
        } else if (e.key === "ArrowRight") {
          setLightboxIdx((prev) => (prev !== null && prev < galleryImages.length - 1 ? prev + 1 : 0));
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [lightboxIdx, isFullGalleryOpen, galleryImages]);

  // Touch Swipe for Lightbox on mobile
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd || !galleryImages) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      setLightboxIdx((prev) => (prev !== null && prev < galleryImages.length - 1 ? prev + 1 : 0));
    } else if (isRightSwipe) {
      setLightboxIdx((prev) => (prev !== null && prev > 0 ? prev - 1 : galleryImages.length - 1));
    }
  };

  // Prevent background scrolling when modal/lightbox is open
  useEffect(() => {
    if (isFullGalleryOpen || lightboxIdx !== null) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isFullGalleryOpen, lightboxIdx]);

  const {
    data: doctors,
    isLoading: loadingDoctors,
    isError: errorDoctors,
    error: docError,
    refetch: refetchDoctors,
  } = useDoctors();
  const {
    data: services,
    isLoading: loadingServices,
    isError: errorServices,
    error: svcError,
    refetch: refetchServices,
  } = useServices();

  const clinicSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "MedicalClinic",
        "@id": "https://advancedcareclinic.com/#clinic",
        "name": CLINIC.name,
        "url": "https://advancedcareclinic.com",
        "logo": "https://advancedcareclinic.com/favicon.svg",
        "image": "https://advancedcareclinic.com/og-image.jpg",
        "description": "Premium multi-doctor clinic offering compassionate, expert care across general medicine, cardiology, dermatology and orthopedics.",
        "telephone": CLINIC.phone,
        "email": CLINIC.email,
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "12 Wellness Avenue, MG Road",
          "addressLocality": "Bengaluru",
          "addressRegion": "KA",
          "postalCode": "560001",
          "addressCountry": "IN"
        },
        "openingHoursSpecification": [
          {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            "opens": "09:00",
            "closes": "20:00"
          }
        ]
      },
      {
        "@type": "LocalBusiness",
        "@id": "https://advancedcareclinic.com/#business",
        "name": CLINIC.name,
        "image": "https://advancedcareclinic.com/og-image.jpg",
        "telephone": CLINIC.phone,
        "url": "https://advancedcareclinic.com",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "12 Wellness Avenue, MG Road",
          "addressLocality": "Bengaluru",
          "addressRegion": "KA",
          "postalCode": "560001",
          "addressCountry": "IN"
        },
        "priceRange": "$$"
      }
    ]
  };

  return (
    <>
      <script type="application/ld+json">
        {JSON.stringify(clinicSchema)}
      </script>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary-light via-background to-background" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-light text-primary px-3 py-1 text-xs font-semibold">
              <ShieldCheck className="h-3.5 w-3.5" /> NABH-aligned clinical standards
            </span>
            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] text-foreground">
              Compassionate care, <span className="text-primary">advanced medicine.</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-xl">
              {CLINIC.name} brings together specialists across medicine, cardiology, dermatology and
              orthopedics — under one calm, modern roof.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/appointment">
                  Book Appointment <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/doctors">Meet our doctors</Link>
              </Button>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-6 max-w-md">
              {[
                { n: "25+", l: "Specialists" },
                { n: "40k+", l: "Patients cared" },
                { n: "4.9★", l: "Patient rating" },
              ].map((s) => (
                <div key={s.l}>
                  <div className="text-2xl font-bold text-foreground">{s.n}</div>
                  <div className="text-xs text-muted-foreground">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 bg-primary/10 rounded-3xl blur-2xl" />
            <img
              src={heroImg}
              alt="Modern interior of Advanced Care Medical Clinic"
              width={1600}
              height={1024}
              className="relative rounded-2xl shadow-2xl object-cover w-full aspect-[4/3]"
            />
            <Card className="absolute -bottom-6 -left-6 hidden sm:block w-56 shadow-xl">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-success/15 text-success grid place-items-center">
                  <HeartPulse className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Open today</div>
                  <div className="text-xs text-muted-foreground">9:00 AM – 8:00 PM</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="border-y border-border bg-secondary/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: ShieldCheck, t: "Verified Specialists" },
            { icon: Clock, t: "On-time Appointments" },
            { icon: Award, t: "Evidence-based Care" },
            { icon: HeartPulse, t: "Patient-first Approach" },
          ].map((f) => (
            <div key={f.t} className="flex items-center gap-3">
              <f.icon className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">{f.t}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CLINIC GALLERY */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 border-b border-border">
        <SectionHeader
          eyebrow="Our Clinic"
          title="Clinic Gallery"
          subtitle="Explore our modern facilities, consultation rooms, waiting lounge, and advanced medical equipment."
        />

        {loadingGallery ? (
          <GallerySkeleton />
        ) : !galleryImages || galleryImages.length === 0 ? (
          <EmptyState
            title="Gallery is empty"
            description="Photos of the clinic and facilities will be displayed here soon."
          />
        ) : (
          (() => {
            const total = galleryImages.length;
            const hasMoreThan6 = total > 6;

            return (
              <div className="mt-10">
                {hasMoreThan6 ? (
                  /* Carousel Layout when > 6 images exist */
                  <div className="relative group/carousel">
                    {/* Left Scroll Arrow (Desktop only, visible on hover) */}
                    <button
                      onClick={() => scrollCarousel("left")}
                      className="absolute -left-5 top-1/2 -translate-y-1/2 z-10 hidden md:flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/80 backdrop-blur-sm shadow-md transition-all duration-300 opacity-0 group-hover/carousel:opacity-100 hover:bg-background hover:scale-105 active:scale-95 cursor-pointer"
                      aria-label="Scroll left"
                    >
                      <ChevronLeft className="h-5 w-5 text-foreground" />
                    </button>

                    {/* Right Scroll Arrow (Desktop only, visible on hover) */}
                    <button
                      onClick={() => scrollCarousel("right")}
                      className="absolute -right-5 top-1/2 -translate-y-1/2 z-10 hidden md:flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/80 backdrop-blur-sm shadow-md transition-all duration-300 opacity-0 group-hover/carousel:opacity-100 hover:bg-background hover:scale-105 active:scale-95 cursor-pointer"
                      aria-label="Scroll right"
                    >
                      <ChevronRight className="h-5 w-5 text-foreground" />
                    </button>

                    {/* Scroll Container */}
                    <div
                      ref={carouselRef}
                      onScroll={handleScroll}
                      className="flex overflow-x-auto snap-x snap-mandatory gap-4 scrollbar-none pb-4 scroll-smooth px-1 -mx-1"
                    >
                      {galleryImages.slice(0, 6).map((img, idx) => (
                        <div
                          key={img.id}
                          onClick={() => setLightboxIdx(idx)}
                          className={`w-[85%] sm:w-[48%] md:w-[calc((100%-32px)/3)] shrink-0 snap-start aspect-[4/3] rounded-2xl overflow-hidden relative shadow border border-border bg-muted cursor-pointer group hover:shadow-lg transition-all duration-300 ${
                            idx >= 4 ? "hidden md:block" : ""
                          }`}
                        >
                          <img
                            src={img.image_url}
                            alt={img.title || "Clinic Gallery Image"}
                            loading="lazy"
                            className="h-full w-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                          />
                          {img.title && (
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <p className="text-sm font-semibold">{img.title}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Swipe dots for mobile */}
                    <div className="flex justify-center gap-1.5 mt-3 md:hidden">
                      {galleryImages.slice(0, 4).map((_, idx) => (
                        <div
                          key={idx}
                          className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${
                            activeDot === idx ? "bg-primary w-3" : "bg-muted-foreground/35"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Grid Layout when <= 6 images exist */
                  <>
                    {total < 6 ? (
                      /* Simple Grid Layout */
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {galleryImages.map((img, idx) => (
                          <div
                            key={img.id}
                            onClick={() => setLightboxIdx(idx)}
                            className={`relative group overflow-hidden rounded-2xl shadow-sm border border-border aspect-[4/3] bg-muted cursor-pointer hover:shadow-md transition-all duration-300 ${
                              idx >= 4 ? "hidden md:block" : ""
                            }`}
                          >
                            <img
                              src={img.image_url}
                              alt={img.title || "Clinic Gallery Image"}
                              loading="lazy"
                              className="h-full w-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                            />
                            {img.title && (
                              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <p className="text-sm font-semibold">{img.title}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* Featured Grid Layout for exactly 6 images */
                      <div className="hidden md:grid grid-cols-3 gap-4 mt-10 auto-rows-[220px]">
                        {/* Image 0 (Featured) */}
                        <div
                          onClick={() => setLightboxIdx(0)}
                          className="col-span-2 row-span-2 relative group overflow-hidden rounded-2xl shadow-md border border-border bg-muted cursor-pointer hover:shadow-lg transition-all duration-300"
                        >
                          <img
                            src={galleryImages[0].image_url}
                            alt={galleryImages[0].title || "Clinic Gallery Image"}
                            loading="lazy"
                            className="h-full w-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                          />
                          {galleryImages[0].title && (
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <p className="text-base font-bold">{galleryImages[0].title}</p>
                            </div>
                          )}
                        </div>

                        {/* Image 1 to 5 */}
                        {galleryImages.slice(1, 6).map((img, idx) => (
                          <div
                            key={img.id}
                            onClick={() => setLightboxIdx(idx + 1)}
                            className="relative group overflow-hidden rounded-2xl shadow-md border border-border bg-muted cursor-pointer hover:shadow-lg transition-all duration-300"
                          >
                            <img
                              src={img.image_url}
                              alt={img.title || "Clinic Gallery Image"}
                              loading="lazy"
                              className="h-full w-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                            />
                            {img.title && (
                              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <p className="text-sm font-semibold">{img.title}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Mobile swipe carousel when <= 6 images exist but > 4 images exist (so we show first 4 on mobile) */}
                    {total > 4 && (
                      <div className="md:hidden">
                        <div
                          ref={carouselRef}
                          onScroll={handleScroll}
                          className="flex overflow-x-auto snap-x snap-mandatory gap-4 scrollbar-none pb-4 px-4 -mx-4 mt-8"
                        >
                          {galleryImages.slice(0, 6).map((img, idx) => (
                            <div
                              key={img.id}
                              onClick={() => setLightboxIdx(idx)}
                              className={`min-w-[85%] sm:min-w-[65%] snap-center shrink-0 aspect-[4/3] rounded-2xl overflow-hidden relative shadow border border-border bg-muted cursor-pointer ${
                                idx >= 4 ? "hidden" : ""
                              }`}
                            >
                              <img
                                src={img.image_url}
                                alt={img.title || "Clinic Gallery Image"}
                                loading="lazy"
                                className="h-full w-full object-cover object-top"
                              />
                              {img.title && (
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 text-white">
                                  <p className="text-sm font-semibold">{img.title}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-center gap-1.5 mt-3">
                          {galleryImages.slice(0, 4).map((_, idx) => (
                            <div
                              key={idx}
                              className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${
                                activeDot === idx ? "bg-primary w-3" : "bg-muted-foreground/35"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Mobile view if total <= 4 (no carousel needed, simple mobile list or grid) */}
                    {total <= 4 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden mt-8">
                        {galleryImages.map((img, idx) => (
                          <div
                            key={img.id}
                            onClick={() => setLightboxIdx(idx)}
                            className="relative overflow-hidden rounded-2xl shadow border border-border aspect-[4/3] bg-muted cursor-pointer"
                          >
                            <img
                              src={img.image_url}
                              alt={img.title || "Clinic Gallery Image"}
                              loading="lazy"
                              className="h-full w-full object-cover object-top"
                            />
                            {img.title && (
                              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 text-white">
                                <p className="text-sm font-semibold">{img.title}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* Footer Controls: Counter and "View All" Button */}
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/60 pt-6">
                  <div className="text-sm text-muted-foreground font-medium">
                    <span className="hidden md:inline">
                      Showing {Math.min(6, total)} of {total} Photos
                    </span>
                    <span className="inline md:hidden">
                      Showing {Math.min(4, total)} of {total} Photos
                    </span>
                  </div>
                  {/* View All button shows if total > 6, or if on mobile and total > 4 */}
                  <Button
                    onClick={() => setIsFullGalleryOpen(true)}
                    variant="outline"
                    className={`gap-2 group transition-all duration-300 hover:bg-primary/5 hover:border-primary/30 cursor-pointer ${
                      total > 6
                        ? "flex"
                        : total > 4
                        ? "flex md:hidden"
                        : "hidden"
                    }`}
                  >
                    View All Photos{" "}
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            );
          })()
        )}
      </section>

      {/* FULL GALLERY OVERLAY */}
      {isFullGalleryOpen && galleryImages && (
        <div className="fixed inset-0 z-40 bg-background flex flex-col transition-all duration-300 animate-in fade-in">
          {/* Header */}
          <div className="sticky top-0 z-50 flex items-center justify-between border-b border-border bg-background/85 backdrop-blur-md px-6 py-4">
            <div>
              <h2 className="text-xl font-bold text-foreground">Clinic Gallery</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Showing all {galleryImages.length} photos of our clinic
              </p>
            </div>
            <button
              onClick={() => setIsFullGalleryOpen(false)}
              className="text-muted-foreground hover:text-foreground p-2 rounded-full hover:bg-muted transition-all duration-200 cursor-pointer"
              aria-label="Close gallery"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Grid Container */}
          <div className="flex-1 overflow-y-auto px-6 py-8">
            <div className="mx-auto max-w-7xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-12">
                {galleryImages.map((img, idx) => (
                  <div
                    key={img.id}
                    onClick={() => setLightboxIdx(idx)}
                    className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-muted cursor-pointer shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300"
                  >
                    <img
                      src={img.image_url}
                      alt={img.title || "Clinic Gallery Image"}
                      loading="lazy"
                      className="h-full w-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Caption Overlay */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <p className="text-xs font-semibold line-clamp-1">{img.title || "Clinic Photo"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL */}
      {lightboxIdx !== null && galleryImages && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between items-center py-6 px-4 md:px-8 transition-all duration-300 animate-in fade-in"
          onClick={() => setLightboxIdx(null)}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Lightbox Header */}
          <div className="w-full flex items-center justify-between z-10 max-w-7xl">
            <span className="text-white/80 text-sm font-medium">
              Photo {lightboxIdx + 1} of {galleryImages.length}
            </span>
            <button
              onClick={() => setLightboxIdx(null)}
              className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-all duration-200 cursor-pointer"
              aria-label="Close lightbox"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Main Content (Image & Navigation) */}
          <div className="relative w-full flex-1 flex items-center justify-center max-w-5xl my-4">
            {/* Left Arrow (Desktop only) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIdx((prev) => (prev !== null && prev > 0 ? prev - 1 : galleryImages.length - 1));
              }}
              className="absolute left-0 z-10 hidden md:flex text-white/70 hover:text-white p-3 rounded-full hover:bg-white/10 transition-all duration-200 cursor-pointer bg-black/30 backdrop-blur-xs"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            {/* Image Container with aspect ratio constraint and no layout shift */}
            <div
              className="relative max-w-full max-h-[75vh] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={galleryImages[lightboxIdx].image_url}
                alt={galleryImages[lightboxIdx].title || "Clinic Gallery Image"}
                className="max-w-full max-h-[70vh] object-contain rounded-xl select-none shadow-2xl transition-all duration-300 animate-in zoom-in-95"
              />
            </div>

            {/* Right Arrow (Desktop only) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIdx((prev) => (prev !== null && prev < galleryImages.length - 1 ? prev + 1 : 0));
              }}
              className="absolute right-0 z-10 hidden md:flex text-white/70 hover:text-white p-3 rounded-full hover:bg-white/10 transition-all duration-200 cursor-pointer bg-black/30 backdrop-blur-xs"
              aria-label="Next image"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>

          {/* Caption Footer */}
          <div className="w-full flex justify-center z-10">
            {galleryImages[lightboxIdx].title ? (
              <p className="text-white text-sm md:text-base font-medium text-center bg-black/60 backdrop-blur-md px-6 py-2.5 rounded-full border border-white/10 max-w-md md:max-w-lg shadow-lg truncate">
                {galleryImages[lightboxIdx].title}
              </p>
            ) : (
              <div className="h-10" />
            )}
          </div>
        </div>
      )}

      {/* DOCTORS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <SectionHeader
          eyebrow="Our team"
          title="Meet our featured doctors"
          subtitle="A multi-disciplinary team committed to your long-term health."
        />

        {loadingDoctors ? (
          <DoctorsSkeleton />
        ) : errorDoctors ? (
          <ErrorState message={docError?.message || "Unknown error"} retry={refetchDoctors} />
        ) : !doctors || doctors.length === 0 ? (
          <EmptyState
            title="No doctors found"
            description="There are no doctors registered in the database yet. Please configure them in the admin dashboard."
          />
        ) : (
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {doctors.slice(0, 4).map((d) => (
              <Card key={d.id} className="overflow-hidden group">
                <div className="aspect-square overflow-hidden bg-muted">
                  <img
                    src={getDoctorImage(d.id, d.photo)}
                    alt={d.name}
                    width={768}
                    height={768}
                    loading="lazy"
                    className="h-full w-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <CardContent className="p-5">
                  <h3 className="font-semibold">{d.name}</h3>
                  <p className="text-sm text-primary">{d.specialization}</p>
                  <p className="text-xs text-muted-foreground mt-1">{d.experience} experience</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <Button asChild variant="outline">
            <Link to="/doctors">View all doctors</Link>
          </Button>
        </div>
      </section>

      {/* SERVICES */}
      <section className="bg-secondary/40 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Services"
            title="Care designed around you"
            subtitle="From routine check-ups to specialist consultations — transparent pricing, every time."
          />

          {loadingServices ? (
            <ServicesSkeleton />
          ) : errorServices ? (
            <ErrorState message={svcError?.message || "Unknown error"} retry={refetchServices} />
          ) : !services || services.length === 0 ? (
            <EmptyState
              title="No services found"
              description="There are no services registered in the database yet. Please configure them in the admin dashboard."
            />
          ) : (
            <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.slice(0, 6).map((s) => (
                <Card key={s.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="font-semibold">{s.name}</h3>
                      <span className="text-primary font-bold whitespace-nowrap">{s.price}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{s.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="mt-8 text-center">
            <Button asChild variant="outline">
              <Link to="/services">All services</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <SectionHeader eyebrow="Patient stories" title="Loved by our patients" />
        <div className="mt-10 grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <Card key={t.name}>
              <CardContent className="p-6">
                <div className="flex gap-0.5 text-yellow-500 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed">"{t.text}"</p>
                <div className="mt-4 text-sm">
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-muted-foreground text-xs">{t.role}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA / CONTACT */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-20">
        <div className="rounded-3xl bg-primary text-primary-foreground p-10 lg:p-14 grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-3xl lg:text-4xl font-bold">Ready to see a doctor?</h2>
            <p className="mt-3 text-primary-foreground/80 max-w-lg">
              Book online in under a minute. We'll confirm your slot instantly.
            </p>
            <Button asChild size="lg" variant="secondary" className="mt-6">
              <Link to="/appointment">Book Appointment</Link>
            </Button>
          </div>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-3">
              <Phone className="h-4 w-4" /> {CLINIC.phone}
            </li>
            <li className="flex items-center gap-3">
              <Mail className="h-4 w-4" /> {CLINIC.email}
            </li>
            <li className="flex items-center gap-3">
              <MapPin className="h-4 w-4" /> {CLINIC.address}
            </li>
          </ul>
        </div>
      </section>
    </>
  );
}

function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="text-center max-w-2xl mx-auto">
      <div className="text-xs font-semibold uppercase tracking-wider text-primary">{eyebrow}</div>
      <h2 className="mt-2 text-3xl sm:text-4xl font-bold">{title}</h2>
      {subtitle && <p className="mt-3 text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

function DoctorsSkeleton() {
  return (
    <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className="aspect-square w-full" />
          <CardContent className="p-5 space-y-2">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ServicesSkeleton() {
  return (
    <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-6 w-1/4" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ErrorState({ message, retry }: { message: string; retry: () => void }) {
  return (
    <div className="mt-10 p-6 rounded-2xl bg-destructive/10 border border-destructive/20 text-center max-w-xl mx-auto">
      <p className="text-destructive font-medium">Failed to load database records</p>
      <p className="text-sm text-muted-foreground mt-1">{message}</p>
      <Button variant="outline" size="sm" className="mt-4" onClick={retry}>
        Try Again
      </Button>
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="mt-10 p-10 rounded-2xl border border-dashed border-border text-center max-w-md mx-auto">
      <p className="font-semibold text-lg">{title}</p>
      <p className="text-sm text-muted-foreground mt-2">{description}</p>
    </div>
  );
}

function GallerySkeleton() {
  return (
    <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[220px]">
      <div className="md:col-span-2 md:row-span-2 rounded-2xl bg-muted animate-pulse" />
      <div className="rounded-2xl bg-muted animate-pulse" />
      <div className="rounded-2xl bg-muted animate-pulse" />
      <div className="rounded-2xl bg-muted animate-pulse" />
      <div className="rounded-2xl bg-muted animate-pulse" />
      <div className="rounded-2xl bg-muted animate-pulse" />
    </div>
  );
}

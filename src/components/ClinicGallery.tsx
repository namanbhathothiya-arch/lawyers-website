import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronLeft, ChevronRight, Expand, Images, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PUBLIC_CONTENT_QUERY_OPTIONS } from "@/hooks/use-supabase-data";

type GalleryImage = {
  id: string;
  image_url: string;
  title: string | null;
  description: string | null;
  sort_order: number;
  created_at: string;
};

const fallbackTitle = "Chambers photo";

export function ClinicGallery({ showAll = false }: { showAll?: boolean }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchCurrentX = useRef<number | null>(null);

  const { data: images, isLoading } = useQuery({
    queryKey: ["gallery-images"],
    ...PUBLIC_CONTENT_QUERY_OPTIONS,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_images")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as GalleryImage[];
    },
  });

  const showPrevious = useCallback(() => {
    if (!images?.length) return;
    setLightboxIndex((current) =>
      current === null || current === 0 ? images.length - 1 : current - 1,
    );
  }, [images]);

  const showNext = useCallback(() => {
    if (!images?.length) return;
    setLightboxIndex((current) =>
      current === null || current === images.length - 1 ? 0 : current + 1,
    );
  }, [images]);

  useEffect(() => {
    if (lightboxIndex === null) return;

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => closeButtonRef.current?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightboxIndex(null);
      if (lightboxIndex !== null && event.key === "ArrowLeft") showPrevious();
      if (lightboxIndex !== null && event.key === "ArrowRight") showNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      previouslyFocusedRef.current?.focus();
    };
  }, [lightboxIndex, showNext, showPrevious]);

  const openLightbox = (index: number) => setLightboxIndex(index);

  const handleTouchEnd = () => {
    if (touchStartX.current !== null && touchCurrentX.current !== null) {
      const distance = touchStartX.current - touchCurrentX.current;
      if (Math.abs(distance) >= 50) {
        if (distance > 0) showNext();
        else showPrevious();
      }
    }
    touchStartX.current = null;
    touchCurrentX.current = null;
  };

  const scrollCarousel = (direction: "previous" | "next") => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    carousel.scrollBy({
      left: direction === "previous" ? -carousel.clientWidth : carousel.clientWidth,
      behavior: "smooth",
    });
  };

  if (isLoading) return <GallerySkeleton />;

  if (!images?.length) {
    return (
      <div className="mt-10 rounded-2xl border border-dashed border-slate-800 bg-slate-900/60 px-6 py-14 text-center text-slate-300">
        <Images className="mx-auto h-8 w-8 text-blue-400" aria-hidden="true" />
        <p className="mt-4 text-lg font-semibold">Gallery is empty</p>
        <p className="mt-2 text-sm text-slate-400">
          Photos of our legal chambers and consultation facilities will be displayed here.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className={showAll ? "" : "mt-10"}>
        {showAll ? (
          <div
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
            aria-label="Office gallery"
          >
            {images.map((image, index) => (
              <GalleryCard key={image.id} image={image} onOpen={() => openLightbox(index)} />
            ))}
          </div>
        ) : (
          <div className="relative">
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => scrollCarousel("previous")}
                  className="absolute -left-5 top-[30%] z-10 hidden h-11 w-11 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-200 shadow-xl hover:bg-blue-600 hover:text-white lg:flex"
                  aria-label="Show previous gallery photos"
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollCarousel("next")}
                  className="absolute -right-5 top-[30%] z-10 hidden h-11 w-11 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-200 shadow-xl hover:bg-blue-600 hover:text-white lg:flex"
                  aria-label="Show next gallery photos"
                >
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </>
            )}

            <div
              ref={carouselRef}
              className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              aria-label="Office gallery carousel"
            >
              {images.map((image, index) => (
                <GalleryCard
                  key={image.id}
                  image={image}
                  onOpen={() => openLightbox(index)}
                  className="w-full shrink-0 snap-start lg:w-[calc((100%-2.5rem)/3)]"
                />
              ))}
            </div>
          </div>
        )}

        {!showAll && (
          <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-slate-800/80 pt-6 sm:flex-row">
            <p className="text-sm text-slate-400">
              Explore our {images.length} office and legal chamber {" "}
              {images.length === 1 ? "photo" : "photos"}
            </p>
            <Button
              asChild
              variant="outline"
              className="min-h-11 w-full gap-2 rounded-xl border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 sm:w-auto"
            >
              <Link to="/gallery">
                View All Chambers Photos
                <ArrowRight className="h-4 w-4 text-blue-400" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        )}
      </div>

      {lightboxIndex !== null && images[lightboxIndex] && (
        <div
          className="fixed inset-0 z-[100] flex touch-none flex-col overscroll-none bg-slate-950/95 text-white backdrop-blur-xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="lightbox-title"
          aria-describedby={images[lightboxIndex].description ? "lightbox-description" : undefined}
          onTouchStart={(event) => {
            touchStartX.current = event.touches[0].clientX;
            touchCurrentX.current = null;
          }}
          onTouchMove={(event) => {
            touchCurrentX.current = event.touches[0].clientX;
          }}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
        >
          <div className="flex items-center justify-between px-4 py-3 sm:px-6 border-b border-slate-800">
            <span className="text-xs font-semibold text-slate-400">
              Photo {lightboxIndex + 1} of {images.length}
            </span>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => setLightboxIndex(null)}
              className="grid h-10 w-10 place-items-center rounded-full text-slate-300 hover:bg-slate-800 hover:text-white"
              aria-label="Close image viewer"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center px-3 sm:px-16">
            <button
              type="button"
              onClick={showPrevious}
              className="absolute left-4 z-10 hidden h-12 w-12 place-items-center rounded-full bg-slate-900/80 border border-slate-700 text-slate-200 backdrop-blur transition hover:bg-blue-600 hover:text-white sm:grid"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-6 w-6" aria-hidden="true" />
            </button>
            <img
              src={images[lightboxIndex].image_url}
              alt={images[lightboxIndex].title || fallbackTitle}
              decoding="async"
              className="pointer-events-none block h-full w-full select-none object-contain p-4"
              draggable={false}
            />
            <button
              type="button"
              onClick={showNext}
              className="absolute right-4 z-10 hidden h-12 w-12 place-items-center rounded-full bg-slate-900/80 border border-slate-700 text-slate-200 backdrop-blur transition hover:bg-blue-600 hover:text-white sm:grid"
              aria-label="Next image"
            >
              <ChevronRight className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <div className="border-t border-slate-800 bg-[#070c14]/90 px-4 py-4 text-center backdrop-blur sm:px-6">
            <h2 id="lightbox-title" className="font-serif text-base font-bold text-white sm:text-lg">
              {images[lightboxIndex].title || fallbackTitle}
            </h2>
            {images[lightboxIndex].description && (
              <p
                id="lightbox-description"
                className="mx-auto mt-1 max-w-2xl text-xs leading-relaxed text-slate-300"
              >
                {images[lightboxIndex].description}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function GalleryCard({
  image,
  onOpen,
  className = "",
}: {
  image: GalleryImage;
  onOpen: () => void;
  className?: string;
}) {
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
  const description =
    image.description || "Chambers, conference rooms, and client consultation facilities.";
  const canExpand = description.length > 110;

  return (
    <article
      className={`group flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-[#121b2d] text-slate-100 shadow-xl transition duration-300 hover:-translate-y-1 hover:border-blue-600/50 hover:shadow-2xl ${className}`}
    >
      <button
        type="button"
        onClick={onOpen}
        className="block w-full text-left focus-visible:outline-none"
        aria-label={`Open ${image.title || fallbackTitle} in full-screen viewer`}
      >
        <span className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden bg-slate-950 p-2 sm:p-3">
          <img
            src={image.image_url}
            alt={image.title || fallbackTitle}
            loading="lazy"
            decoding="async"
            className="block h-full w-full object-contain filter brightness-[0.9]"
          />
          <span className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-slate-900/80 border border-slate-700 text-white shadow-lg backdrop-blur">
            <Expand className="h-4 w-4" aria-hidden="true" />
          </span>
        </span>
      </button>
      <div className="flex flex-1 flex-col border-t border-slate-800/80 bg-[#121b2d] px-5 py-5">
        <h3 className="font-serif text-base font-bold text-white">
          {image.title || fallbackTitle}
        </h3>
        <p
          id={`gallery-description-${image.id}`}
          className={`mt-2 text-xs leading-relaxed text-slate-300 ${
            isDescriptionOpen ? "" : "line-clamp-3"
          }`}
        >
          {description}
        </p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-4 border-t border-slate-800/80">
          {canExpand ? (
            <button
              type="button"
              onClick={() => setIsDescriptionOpen((current) => !current)}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300"
              aria-expanded={isDescriptionOpen}
              aria-controls={`gallery-description-${image.id}`}
            >
              {isDescriptionOpen ? "Less" : "More"}
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={onOpen}
            className="text-xs font-bold uppercase tracking-wider text-blue-400 hover:text-blue-300"
          >
            View Photo
          </button>
        </div>
      </div>
    </article>
  );
}

function GallerySkeleton() {
  return (
    <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
          <Skeleton className="aspect-[4/3] w-full rounded-none bg-slate-800" />
          <div className="space-y-3 p-5">
            <Skeleton className="h-5 w-2/3 bg-slate-800" />
            <Skeleton className="h-4 w-full bg-slate-800" />
          </div>
        </div>
      ))}
    </div>
  );
}

export const FirmGallery = ClinicGallery;

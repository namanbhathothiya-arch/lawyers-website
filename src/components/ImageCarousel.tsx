import { useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Images } from "lucide-react";
import { cn } from "@/lib/utils";

export type CarouselImage = {
  src: string;
  alt: string;
  title?: string;
};

type ImageCarouselProps = {
  images: CarouselImage[];
  className?: string;
  imageClassName?: string;
  frameClassName?: string;
  showArrows?: boolean;
  showDots?: boolean;
  label: string;
  emptyLabel?: string;
  priority?: boolean;
};

export function ImageCarousel({
  images,
  className,
  imageClassName,
  frameClassName,
  showArrows = true,
  showDots = true,
  label,
  emptyLabel = "No image available",
  priority = false,
}: ImageCarouselProps) {
  const normalizedImages = useMemo(
    () => images.filter((image) => image.src.trim().length > 0),
    [images],
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchCurrentX = useRef<number | null>(null);
  const hasMultipleImages = normalizedImages.length > 1;

  const goTo = (nextIndex: number) => {
    if (!normalizedImages.length) return;
    setActiveIndex((nextIndex + normalizedImages.length) % normalizedImages.length);
  };

  const handleTouchEnd = () => {
    if (touchStartX.current !== null && touchCurrentX.current !== null) {
      const distance = touchStartX.current - touchCurrentX.current;
      if (Math.abs(distance) >= 42) {
        goTo(activeIndex + (distance > 0 ? 1 : -1));
      }
    }

    touchStartX.current = null;
    touchCurrentX.current = null;
  };

  if (!normalizedImages.length) {
    return (
      <div
        className={cn(
          "flex h-full min-h-44 w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-primary-light to-muted p-6 text-center text-muted-foreground",
          className,
        )}
      >
        <Images className="h-8 w-8 text-primary/60" aria-hidden="true" />
        <span className="text-sm font-medium">{emptyLabel}</span>
      </div>
    );
  }

  return (
    <div
      className={cn("relative h-full w-full overflow-hidden", className)}
      aria-roledescription="carousel"
      aria-label={label}
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
      <div
        className="flex h-full transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${activeIndex * 100}%)` }}
      >
        {normalizedImages.map((image, index) => (
          <div
            key={`${image.src}-${index}`}
            className={cn(
              "flex h-full min-w-full items-center justify-center bg-gradient-to-br from-primary-light to-muted p-2",
              frameClassName,
            )}
            aria-hidden={index !== activeIndex}
          >
            <img
              src={image.src}
              alt={image.alt}
              loading={priority && index === 0 ? "eager" : "lazy"}
              decoding="async"
              fetchPriority={priority && index === 0 ? "high" : "auto"}
              draggable={false}
              className={cn(
                "block h-full w-full select-none object-contain object-center",
                imageClassName,
              )}
            />
          </div>
        ))}
      </div>

      {hasMultipleImages && showArrows && (
        <>
          <button
            type="button"
            onClick={() => goTo(activeIndex - 1)}
            className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/70 bg-white/90 text-foreground shadow-lg backdrop-blur transition hover:bg-white lg:grid"
            aria-label={`Previous image in ${label}`}
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => goTo(activeIndex + 1)}
            className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/70 bg-white/90 text-foreground shadow-lg backdrop-blur transition hover:bg-white lg:grid"
            aria-label={`Next image in ${label}`}
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </>
      )}

      {hasMultipleImages && showDots && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
          {normalizedImages.map((image, index) => (
            <button
              key={`${image.src}-dot-${index}`}
              type="button"
              onClick={() => goTo(index)}
              className={cn(
                "h-2 rounded-full transition-all",
                index === activeIndex ? "w-5 bg-primary" : "w-2 bg-white/80",
              )}
              aria-label={`Show image ${index + 1} of ${normalizedImages.length}`}
              aria-current={index === activeIndex ? "true" : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}

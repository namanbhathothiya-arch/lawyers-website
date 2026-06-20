import { useEffect, useRef, useState, type ReactNode } from "react";

type DeferredSectionProps = {
  children: ReactNode;
  fallback?: ReactNode;
  rootMargin?: string;
};

export function DeferredSection({
  children,
  fallback = null,
  rootMargin = "500px",
}: DeferredSectionProps) {
  const [shouldRender, setShouldRender] = useState(false);
  const markerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (shouldRender) return;

    if (!("IntersectionObserver" in window)) {
      setShouldRender(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldRender(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );

    const marker = markerRef.current;
    if (marker) observer.observe(marker);

    return () => observer.disconnect();
  }, [rootMargin, shouldRender]);

  return <div ref={markerRef}>{shouldRender ? children : fallback}</div>;
}

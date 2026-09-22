"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function GalleryLightbox({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  const [active, setActive] = useState<number | null>(null);

  const close = useCallback(() => setActive(null), []);
  const step = useCallback(
    (dir: 1 | -1) =>
      setActive((a) => (a === null ? a : (a + dir + images.length) % images.length)),
    [images.length],
  );

  useEffect(() => {
    if (active === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [active, close, step]);

  if (images.length === 0) return null;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        {images.map((src, i) => (
          <button
            key={src + i}
            onClick={() => setActive(i)}
            aria-label={`Open ${title} screenshot ${i + 1} in lightbox`}
            className="group relative aspect-[16/10] overflow-hidden rounded-card border border-border bg-surface-2 shadow-card transition-all duration-250 hover:-translate-y-0.5 hover:shadow-card-hover"
          >
            <Image
              src={src}
              alt={`${title} screenshot ${i + 1}`}
              fill
              sizes="(max-width: 640px) 100vw, 50vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-ink/0 transition-colors duration-250 group-hover:bg-ink/25">
              <span className="rounded-full bg-surface/95 p-2.5 text-ink opacity-0 shadow-md transition-opacity duration-250 group-hover:opacity-100">
                <Expand size={16} />
              </span>
            </span>
          </button>
        ))}
      </div>

      {active !== null &&
        createPortal(
          <div
            className="animate-modal-in fixed inset-0 z-[95] flex items-center justify-center bg-ink/70 p-4 backdrop-blur-xl"
            role="dialog"
            aria-modal="true"
            aria-label={`${title} screenshot ${active + 1} of ${images.length}`}
            onClick={close}
          >
            <button
              className="glass absolute right-4 top-4 rounded-full p-2.5 text-ink transition-transform hover:scale-105"
              onClick={close}
              aria-label="Close lightbox"
            >
              <X size={18} />
            </button>
            {images.length > 1 && (
              <>
                <button
                  className="glass absolute left-3 top-1/2 -translate-y-1/2 rounded-full p-3 text-ink transition-transform hover:scale-105 sm:left-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    step(-1);
                  }}
                  aria-label="Previous image"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  className="glass absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-3 text-ink transition-transform hover:scale-105 sm:right-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    step(1);
                  }}
                  aria-label="Next image"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element -- deliberate: full-res lightbox view */}
            <img
              src={images[active]}
              alt={`${title} screenshot ${active + 1}`}
              className={cn("max-h-[86vh] w-auto max-w-[94vw] rounded-card shadow-lg")}
              onClick={(e) => e.stopPropagation()}
            />
            <p className="glass absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full px-3.5 py-1.5 text-xs font-medium text-ink">
              {active + 1} / {images.length}
            </p>
          </div>,
          document.body,
        )}
    </>
  );
}

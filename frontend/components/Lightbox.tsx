"use client";

import { useEffect } from "react";
import { ChevronLeft, ChevronRight, Flag, X } from "lucide-react";
import { Photo } from "@/types";
import { PHOTO_CATEGORY_LABEL } from "@/utils/format";

type Props = {
  photos: Photo[];
  index: number;
  onClose: () => void;
  onChange: (index: number) => void;
  onReport?: (photo: Photo) => void;
};

export default function Lightbox({ photos, index, onClose, onChange, onReport }: Props) {
  const count = photos.length;
  const photo = photos[index];

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (count === 0) return;
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") onChange((index - 1 + count) % count);
      else if (e.key === "ArrowRight") onChange((index + 1) % count);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [index, count, onClose, onChange]);

  if (!photo) return null;
  const categoryLabel = PHOTO_CATEGORY_LABEL[photo.category] ?? photo.category;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
    >
      <button
        onClick={onClose}
        aria-label="Close photo viewer"
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
      >
        <X className="h-6 w-6" />
      </button>

      {count > 1 && (
        <>
          <button
            aria-label="Previous photo"
            onClick={(e) => {
              e.stopPropagation();
              onChange((index - 1 + count) % count);
            }}
            className="absolute left-3 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            aria-label="Next photo"
            onClick={(e) => {
              e.stopPropagation();
              onChange((index + 1) % count);
            }}
            className="absolute right-3 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      <div className="flex max-h-full max-w-5xl flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.url}
          alt={`${photo.label} - ${categoryLabel}`}
          className="max-h-[75vh] max-w-full rounded-lg object-contain"
        />
        <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-white">
          <span className="font-semibold">{photo.label}</span>
          <span className="text-white/70">
            {categoryLabel} · {index + 1} / {count}
          </span>
          {onReport && !photo.isOfficial && (
            <button
              onClick={() => onReport(photo)}
              className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 hover:bg-white/20"
            >
              <Flag className="h-3.5 w-3.5" /> Report photo
            </button>
          )}
        </div>
        {photo.aiObservation && (
          <div className="max-w-xl rounded-lg bg-white/10 p-3 text-center text-sm text-white/90">
            <p className="whitespace-pre-line">{photo.aiObservation}</p>
            <p className="mt-1 text-xs text-white/60">AI-generated observation. Please verify personally.</p>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Building2, Maximize2 } from "lucide-react";
import Lightbox from "@/components/Lightbox";
import { Photo } from "@/types";

type Props = { photos: Photo[]; name: string };

export default function PhotoGallery({ photos, name }: Props) {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);

  if (photos.length === 0) {
    return (
      <div className="flex aspect-[16/9] w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-100 text-slate-400">
        <Building2 className="h-12 w-12" />
        <p className="text-sm">No official photos yet</p>
      </div>
    );
  }

  const current = photos[Math.min(active, photos.length - 1)];

  return (
    <div>
      <button
        onClick={() => setOpen(true)}
        className="group relative block aspect-[16/9] w-full overflow-hidden rounded-2xl bg-slate-100"
        aria-label="Open photo viewer"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={current.url} alt={`${name} official photo`} className="h-full w-full object-cover" />
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-indigo-700">
          {current.label}
        </span>
        <span className="absolute bottom-3 right-3 rounded-full bg-black/60 p-2 text-white opacity-0 transition group-hover:opacity-100">
          <Maximize2 className="h-4 w-4" />
        </span>
      </button>

      {photos.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {photos.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setActive(i)}
              aria-label={`Show photo ${i + 1}`}
              className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 ${i === active ? "border-indigo-600" : "border-transparent"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {open && <Lightbox photos={photos} index={active} onClose={() => setOpen(false)} onChange={setActive} />}
    </div>
  );
}

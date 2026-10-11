"use client";

import { useMemo, useState } from "react";
import { Camera, Flag, Info, Upload } from "lucide-react";
import Lightbox from "@/components/Lightbox";
import ReportModal from "@/components/ReportModal";
import UploadPhotoModal from "@/components/UploadPhotoModal";
import { useRequireLogin } from "@/hooks/useRequireLogin";
import { Photo } from "@/types";
import { PHOTO_CATEGORY_LABEL } from "@/utils/format";

type Props = { propertyId: string; photos: Photo[]; notice: string };

export default function CommunityPhotoGallery({ propertyId, photos, notice }: Props) {
  const requireLogin = useRequireLogin();
  const [filter, setFilter] = useState("ALL");
  const [viewer, setViewer] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [reportPhoto, setReportPhoto] = useState<Photo | null>(null);

  const categories = useMemo(() => Array.from(new Set(photos.map((p) => p.category))), [photos]);
  const visible = useMemo(
    () => (filter === "ALL" ? photos : photos.filter((p) => p.category === filter)),
    [photos, filter]
  );

  function handleReport(photo: Photo) {
    if (!requireLogin()) return;
    setViewer(null);
    setReportPhoto(photo);
  }

  return (
    <section id="community-photos" className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Camera className="h-5 w-5 text-indigo-600" /> Community Photos
          </h2>
          <p className="mt-1 text-sm text-slate-500">Shared anonymously by students. Uploader identity is never shown.</p>
        </div>
        <button
          onClick={() => {
            if (requireLogin()) setUploading(true);
          }}
          className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
        >
          <Upload className="h-4 w-4" /> Share a photo
        </button>
      </div>

      <p className="mt-4 flex gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
        <Info className="mt-0.5 h-4 w-4 shrink-0" /> {notice}
      </p>

      {categories.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {["ALL", ...categories].map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`rounded-full px-3 py-1 text-sm transition ${
                filter === c ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {c === "ALL" ? "All" : PHOTO_CATEGORY_LABEL[c] ?? c}
            </button>
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-slate-300 py-10 text-center text-sm text-slate-500">
          No community photos yet. Be the first to share how this place really looks.
        </p>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {visible.map((p, i) => (
            <div key={p.id} className="group relative overflow-hidden rounded-xl bg-slate-100">
              <button onClick={() => setViewer(i)} className="block aspect-[4/3] w-full" aria-label={`Open ${p.label}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={`${p.label} - ${PHOTO_CATEGORY_LABEL[p.category] ?? p.category}`} className="h-full w-full object-cover" loading="lazy" />
              </button>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 pt-6">
                <p className="text-xs font-medium text-white">{p.label}</p>
                <p className="text-xs text-white/70">{PHOTO_CATEGORY_LABEL[p.category] ?? p.category}</p>
              </div>
              <button
                onClick={() => handleReport(p)}
                aria-label="Report this photo"
                className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-slate-600 opacity-0 shadow transition hover:text-red-600 group-hover:opacity-100 focus:opacity-100"
              >
                <Flag className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {viewer !== null && (
        <Lightbox photos={visible} index={viewer} onClose={() => setViewer(null)} onChange={setViewer} onReport={handleReport} />
      )}
      {uploading && <UploadPhotoModal propertyId={propertyId} onClose={() => setUploading(false)} />}
      {reportPhoto && (
        <ReportModal
          title="Report this photo"
          target={{ photoId: reportPhoto.id }}
          defaultType="INAPPROPRIATE_PHOTO"
          onClose={() => setReportPhoto(null)}
        />
      )}
    </section>
  );
}

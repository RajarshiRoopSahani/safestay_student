"use client";

import { useRef, useState } from "react";
import { Loader2, Trash2, Upload } from "lucide-react";
import { deleteAdminPhoto } from "@/services/adminService";
import { getErrorMessage } from "@/services/api";
import { uploadOfficialPhoto } from "@/services/photoService";
import { Photo, PhotoCategory } from "@/types";
import { PHOTO_CATEGORY_LABEL } from "@/utils/format";

type Props = { propertyId: string; photos: Photo[]; onChanged: () => void | Promise<void> };

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const CATEGORIES = Object.keys(PHOTO_CATEGORY_LABEL) as PhotoCategory[];

export default function OfficialPhotosManager({ propertyId, photos, onChanged }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<PhotoCategory>("BUILDING");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const f = e.target.files?.[0] ?? null;
    if (!f) return setFile(null);
    if (!ALLOWED.includes(f.type)) {
      e.target.value = "";
      setFile(null);
      return setError("Please choose a JPG, PNG or WebP image.");
    }
    if (f.size > MAX_BYTES) {
      e.target.value = "";
      setFile(null);
      return setError("That image is larger than 5 MB.");
    }
    setFile(f);
  }

  async function upload() {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      await uploadOfficialPhoto(propertyId, file, category);
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      await onChanged();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this photo permanently?")) return;
    setBusyId(id);
    setError(null);
    try {
      await deleteAdminPhoto(id);
      await onChanged();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="text-base font-bold text-slate-900">Official photos</h2>
      <p className="mt-1 text-sm text-slate-500">
        Photos you upload here are published immediately and labelled Official Photo. Student photos are moderated
        separately.
      </p>

      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="op-cat" className="mb-1 block text-xs font-medium text-slate-600">
            Category
          </label>
          <select
            id="op-cat"
            value={category}
            onChange={(e) => setCategory(e.target.value as PhotoCategory)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {PHOTO_CATEGORY_LABEL[c]}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-0 flex-1">
          <label htmlFor="op-file" className="mb-1 block text-xs font-medium text-slate-600">
            Image (JPG, PNG or WebP, up to 5 MB)
          </label>
          <input
            id="op-file"
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={onPick}
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
          />
        </div>
        <button
          onClick={upload}
          disabled={!file || uploading}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload
        </button>
      </div>

      {photos.length === 0 ? (
        <p className="mt-5 rounded-xl border border-dashed border-slate-300 py-8 text-center text-sm text-slate-500">
          No official photos yet.
        </p>
      ) : (
        <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((p) => (
            <li key={p.id} className="overflow-hidden rounded-xl border border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={`${PHOTO_CATEGORY_LABEL[p.category]} official photo`} className="aspect-[4/3] w-full object-cover" loading="lazy" />
              <div className="flex items-center justify-between gap-2 p-2">
                <span className="text-xs text-slate-600">{PHOTO_CATEGORY_LABEL[p.category]}</span>
                <button
                  onClick={() => remove(p.id)}
                  disabled={busyId === p.id}
                  aria-label="Delete photo"
                  className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

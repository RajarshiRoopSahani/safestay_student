"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import Modal from "@/components/Modal";
import { getErrorMessage } from "@/services/api";
import { uploadPhoto } from "@/services/photoService";
import { PhotoCategory } from "@/types";
import { PHOTO_CATEGORY_LABEL } from "@/utils/format";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const CATEGORIES = Object.keys(PHOTO_CATEGORY_LABEL) as PhotoCategory[];

type Props = { propertyId: string; onClose: () => void };

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

export default function UploadPhotoModal({ propertyId, onClose }: Props) {
  const [category, setCategory] = useState<PhotoCategory>("ROOM");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [doneMessage, setDoneMessage] = useState<string | null>(null);
  const previewRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, []);

  function setPicked(f: File | null) {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = f ? URL.createObjectURL(f) : null;
    setPreview(previewRef.current);
    setFile(f);
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const f = e.target.files?.[0] ?? null;
    if (!f) {
      setPicked(null);
      return;
    }
    if (!ALLOWED.includes(f.type)) {
      e.target.value = "";
      setPicked(null);
      setError("Please choose a JPG, PNG or WebP image.");
      return;
    }
    if (f.size > MAX_BYTES) {
      e.target.value = "";
      setPicked(null);
      setError("That image is larger than 5 MB. Please choose a smaller one.");
      return;
    }
    setPicked(f);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Please choose a photo to upload.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await uploadPhoto(propertyId, file, category);
      setDoneMessage(res.message);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Share a community photo" onClose={onClose}>
      {doneMessage ? (
        <div className="space-y-4 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
          <p className="text-sm text-slate-700">{doneMessage}</p>
          <button onClick={onClose} className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            Done
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="flex gap-2 rounded-lg bg-indigo-50 p-3 text-sm text-indigo-800">
            <ShieldCheck className="h-5 w-5 shrink-0" />
            <span>
              Your identity is never shown publicly. Only upload photos you took yourself, and avoid faces, ID cards,
              phone numbers or other personal details.
            </span>
          </p>

          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div>
            <label htmlFor="photo-category" className="mb-1.5 block text-sm font-medium text-slate-700">
              What does the photo show?
            </label>
            <select id="photo-category" value={category} onChange={(e) => setCategory(e.target.value as PhotoCategory)} className={inputClass}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {PHOTO_CATEGORY_LABEL[c]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="photo-file" className="mb-1.5 block text-sm font-medium text-slate-700">
              Photo (JPG, PNG or WebP, up to 5 MB)
            </label>
            <input
              id="photo-file"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={onPick}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
            />
          </div>

          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Selected photo preview" className="max-h-56 w-full rounded-lg object-cover" />
          )}

          <button
            type="submit"
            disabled={submitting || !file}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />} Upload for review
          </button>
          <p className="text-center text-xs text-slate-500">Photos are checked by a moderator before they appear.</p>
        </form>
      )}
    </Modal>
  );
}

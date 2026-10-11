"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Flag, Sparkles } from "lucide-react";
import AdminHeader from "@/components/AdminHeader";
import EmptyState from "@/components/EmptyState";
import ErrorMessage from "@/components/ErrorMessage";
import FilterChips from "@/components/FilterChips";
import LoadingSpinner from "@/components/LoadingSpinner";
import ModerationActions from "@/components/ModerationActions";
import Pagination from "@/components/Pagination";
import StatusBadge from "@/components/StatusBadge";
import { useAdminData } from "@/hooks/useAdminData";
import { analyzePhoto, clearPhotoAnalysis, deleteAdminPhoto, fetchAdminPhotos, moderatePhoto } from "@/services/adminService";
import { getErrorMessage } from "@/services/api";
import { ModerationStatus } from "@/types";
import { formatDate, PHOTO_CATEGORY_LABEL } from "@/utils/format";

const TABS = [
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

export default function AdminPhotosPage() {
  const [status, setStatus] = useState("PENDING");
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetcher = useCallback(() => fetchAdminPhotos({ status, page }), [status, page]);
  const { data, loading, error, reload } = useAdminData(fetcher);

  useEffect(() => {
    if (data && data.photos.length === 0 && page > 1) setPage(data.totalPages);
  }, [data, page]);

  async function act(id: string, action: () => Promise<void>) {
    setBusyId(id);
    setActionError(null);
    try {
      await action();
      await reload();
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <AdminHeader
        title="Photo moderation"
        description="Only approved photos appear publicly, always labelled as community photos. Uploader identity is never shown to students."
      />

      <FilterChips
        options={TABS}
        value={status}
        onChange={(v) => {
          setStatus(v);
          setPage(1);
        }}
      />

      <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-600">
        <li>Approve photos that honestly show the property, even if the condition is poor.</li>
        <li>Reject photos with faces, ID cards, phone numbers, nudity or anything unrelated to the property.</li>
        <li>Do not reject a photo only because it makes a property look bad.</li>
      </ul>

      {actionError && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {actionError}
        </p>
      )}

      <div className="mt-5">
        {error ? (
          <ErrorMessage message={error} onRetry={reload} />
        ) : !data ? (
          <LoadingSpinner label="Loading photos..." />
        ) : data.photos.length === 0 ? (
          <EmptyState title="No photos here" description="Nothing matches this filter right now." />
        ) : (
          <div className={loading ? "opacity-60 transition" : "transition"}>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {data.photos.map((p) => (
                <article key={p.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="block aspect-[4/3] bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.url} alt={`${PHOTO_CATEGORY_LABEL[p.category]} upload`} className="h-full w-full object-cover" loading="lazy" />
                  </a>
                  <div className="space-y-3 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={p.status} />
                      {p.isOfficial && <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700">Official</span>}
                      {p._count.reports > 0 && (
                        <span className="flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                          <Flag className="h-3 w-3" /> {p._count.reports} reported
                        </span>
                      )}
                    </div>
                    <div>
                      <Link href={`/admin/properties/${p.property.id}`} className="font-medium text-slate-900 hover:text-indigo-600">
                        {p.property.name}
                      </Link>
                      <p className="text-xs text-slate-500">
                        {PHOTO_CATEGORY_LABEL[p.category]} · {formatDate(p.createdAt)} · uploader ref {p.uploaderId.slice(-8)}
                      </p>
                    </div>
                    {p.aiObservation && (
                      <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                        <p className="whitespace-pre-line">{p.aiObservation}</p>
                        <p className="mt-1 text-xs text-slate-500">AI-generated observation. Please verify personally.</p>
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        disabled={busyId === p.id}
                        onClick={() =>
                          void act(p.id, async () => {
                            const result = await analyzePhoto(p.id);
                            if (result.privacyConcern) {
                              window.alert(
                                "The AI noticed possible people, documents or personal details in this photo. Please check it carefully before approving."
                              );
                            }
                          })
                        }
                        className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      >
                        <Sparkles className="h-4 w-4" /> {p.aiObservation ? "Re-run AI observation" : "AI observation"}
                      </button>
                      {p.aiObservation && (
                        <button
                          disabled={busyId === p.id}
                          onClick={() => void act(p.id, () => clearPhotoAnalysis(p.id))}
                          className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                        >
                          Remove observation
                        </button>
                      )}
                    </div>
                    <ModerationActions
                      status={p.status}
                      busy={busyId === p.id}
                      onStatus={(s: ModerationStatus) => void act(p.id, () => moderatePhoto(p.id, s))}
                      onDelete={() => {
                        if (window.confirm("Delete this photo permanently? It is also removed from cloud storage.")) {
                          void act(p.id, () => deleteAdminPhoto(p.id));
                        }
                      }}
                    />
                  </div>
                </article>
              ))}
            </div>
            <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
          </div>
        )}
      </div>
    </>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { BadgeCheck, Flag, Star } from "lucide-react";
import AdminHeader from "@/components/AdminHeader";
import EmptyState from "@/components/EmptyState";
import ErrorMessage from "@/components/ErrorMessage";
import FilterChips from "@/components/FilterChips";
import LoadingSpinner from "@/components/LoadingSpinner";
import ModerationActions from "@/components/ModerationActions";
import Pagination from "@/components/Pagination";
import StatusBadge from "@/components/StatusBadge";
import { useAdminData } from "@/hooks/useAdminData";
import { deleteAdminReview, fetchAdminReviews, moderateReview } from "@/services/adminService";
import { getErrorMessage } from "@/services/api";
import { ModerationStatus } from "@/types";
import { formatDate } from "@/utils/format";

const TABS = [
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

export default function AdminReviewsPage() {
  const [status, setStatus] = useState("PENDING");
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetcher = useCallback(() => fetchAdminReviews({ status, page }), [status, page]);
  const { data, loading, error, reload } = useAdminData(fetcher);

  useEffect(() => {
    if (data && data.reviews.length === 0 && page > 1) setPage(data.totalPages);
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
        title="Review moderation"
        description="Approved reviews count toward a property's rating. Reject spam, abuse and personal information, not honest negative feedback."
      />

      <FilterChips
        options={TABS}
        value={status}
        onChange={(v) => {
          setStatus(v);
          setPage(1);
        }}
      />

      {actionError && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {actionError}
        </p>
      )}

      <div className="mt-5">
        {error ? (
          <ErrorMessage message={error} onRetry={reload} />
        ) : !data ? (
          <LoadingSpinner label="Loading reviews..." />
        ) : data.reviews.length === 0 ? (
          <EmptyState title="No reviews here" description="Nothing matches this filter right now." />
        ) : (
          <div className={loading ? "opacity-60 transition" : "transition"}>
            <ul className="space-y-4">
              {data.reviews.map((r) => (
                <li key={r.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <Link href={`/admin/properties/${r.property.id}`} className="font-semibold text-slate-900 hover:text-indigo-600">
                        {r.property.name}
                      </Link>
                      <p className="text-xs text-slate-500">
                        {r.property.area} · {formatDate(r.createdAt)} · reviewer ref {r.userId.slice(-8)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {r.verified && (
                        <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          <BadgeCheck className="h-3.5 w-3.5" /> Verified
                        </span>
                      )}
                      {r._count.reports > 0 && (
                        <span className="flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                          <Flag className="h-3 w-3" /> {r._count.reports} reported
                        </span>
                      )}
                      <StatusBadge status={r.status} />
                    </div>
                  </div>

                  <div className="mt-3 flex" aria-label={`Rated ${r.rating} out of 5`}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className={`h-4 w-4 ${i <= r.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
                    ))}
                  </div>
                  <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{r.text}</p>

                  <div className="mt-4 border-t border-slate-100 pt-3">
                    <ModerationActions
                      status={r.status}
                      busy={busyId === r.id}
                      onStatus={(s: ModerationStatus) => void act(r.id, () => moderateReview(r.id, s))}
                      onDelete={() => {
                        if (window.confirm("Delete this review permanently?")) void act(r.id, () => deleteAdminReview(r.id));
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
            <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
          </div>
        )}
      </div>
    </>
  );
}

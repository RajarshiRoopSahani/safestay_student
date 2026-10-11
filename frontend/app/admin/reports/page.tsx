"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import AdminHeader from "@/components/AdminHeader";
import EmptyState from "@/components/EmptyState";
import ErrorMessage from "@/components/ErrorMessage";
import FilterChips from "@/components/FilterChips";
import LoadingSpinner from "@/components/LoadingSpinner";
import Pagination from "@/components/Pagination";
import StatusBadge from "@/components/StatusBadge";
import { useAdminData } from "@/hooks/useAdminData";
import { fetchAdminReports, moderatePhoto, moderateReview, ReportStatus, updateProperty, updateReport } from "@/services/adminService";
import { getErrorMessage } from "@/services/api";
import { formatDate, PHOTO_CATEGORY_LABEL, REPORT_TYPE_LABEL } from "@/utils/format";

const STATUS_OPTIONS = [
  { value: "OPEN", label: "Open" },
  { value: "IN_REVIEW", label: "In review" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "", label: "All" },
];

const smallBtn = "rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50";

export default function AdminReportsPage() {
  const [status, setStatus] = useState("OPEN");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetcher = useCallback(() => fetchAdminReports({ status, type, page }), [status, type, page]);
  const { data, loading, error, reload } = useAdminData(fetcher);

  useEffect(() => {
    if (data && data.reports.length === 0 && page > 1) setPage(data.totalPages);
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
      <AdminHeader title="Reports" description="Review what students have flagged, take action, then close the report." />

      <div className="flex flex-wrap items-center gap-3">
        <FilterChips
          options={STATUS_OPTIONS}
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
        />
        <select
          aria-label="Filter by report type"
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-500"
        >
          <option value="">All types</option>
          {Object.entries(REPORT_TYPE_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {actionError && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {actionError}
        </p>
      )}

      <div className="mt-5">
        {error ? (
          <ErrorMessage message={error} onRetry={reload} />
        ) : !data ? (
          <LoadingSpinner label="Loading reports..." />
        ) : data.reports.length === 0 ? (
          <EmptyState title="No reports here" description="Nothing matches this filter right now." />
        ) : (
          <div className={loading ? "opacity-60 transition" : "transition"}>
            <ul className="space-y-4">
              {data.reports.map((r) => {
                const busy = busyId === r.id;
                const setStatusTo = (s: ReportStatus) => void act(r.id, () => updateReport(r.id, s));
                return (
                  <li key={r.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="font-semibold text-slate-900">{REPORT_TYPE_LABEL[r.type]}</h2>
                        <p className="text-xs text-slate-500">
                          {formatDate(r.createdAt)} · reported by {r.reporter.name} ({r.reporter.email})
                        </p>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>

                    <p className="mt-3 whitespace-pre-line rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{r.details}</p>

                    <div className="mt-4 space-y-3">
                      {r.property && (
                        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 p-3">
                          <div>
                            <p className="text-xs text-slate-500">Property</p>
                            <Link href={`/admin/properties/${r.property.id}`} className="text-sm font-medium text-slate-900 hover:text-indigo-600">
                              {r.property.name}
                            </Link>
                            <span className="ml-2 text-xs text-slate-500">{r.property.isActive ? "Active" : "Inactive"}</span>
                          </div>
                          {r.property.isActive && (
                            <button
                              disabled={busy}
                              className={smallBtn}
                              onClick={() => {
                                if (window.confirm("Deactivate this property? Students will no longer see it.")) {
                                  void act(r.id, () => updateProperty(r.property!.id, { isActive: false }));
                                }
                              }}
                            >
                              Deactivate property
                            </button>
                          )}
                        </div>
                      )}

                      {r.photo && (
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3">
                          <div className="flex items-center gap-3">
                            <a href={r.photo.url} target="_blank" rel="noopener noreferrer">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={r.photo.url} alt="Reported photo" className="h-16 w-20 rounded-lg object-cover" />
                            </a>
                            <div>
                              <p className="text-xs text-slate-500">Photo · {PHOTO_CATEGORY_LABEL[r.photo.category]}</p>
                              <StatusBadge status={r.photo.status} />
                            </div>
                          </div>
                          {r.photo.status !== "REJECTED" && (
                            <button disabled={busy} className={smallBtn} onClick={() => void act(r.id, () => moderatePhoto(r.photo!.id, "REJECTED"))}>
                              Reject photo
                            </button>
                          )}
                        </div>
                      )}

                      {r.review && (
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-slate-500">Review · {r.review.rating} / 5</p>
                            <p className="line-clamp-3 whitespace-pre-line text-sm text-slate-700">{r.review.text}</p>
                            <StatusBadge status={r.review.status} />
                          </div>
                          {r.review.status !== "REJECTED" && (
                            <button disabled={busy} className={smallBtn} onClick={() => void act(r.id, () => moderateReview(r.review!.id, "REJECTED"))}>
                              Hide review
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                      {r.status === "OPEN" && (
                        <button disabled={busy} className={smallBtn} onClick={() => setStatusTo("IN_REVIEW")}>
                          Start review
                        </button>
                      )}
                      {(r.status === "OPEN" || r.status === "IN_REVIEW") && (
                        <>
                          <button
                            disabled={busy}
                            onClick={() => setStatusTo("RESOLVED")}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            Resolve
                          </button>
                          <button disabled={busy} className={smallBtn} onClick={() => setStatusTo("REJECTED")}>
                            Reject report
                          </button>
                        </>
                      )}
                      {(r.status === "RESOLVED" || r.status === "REJECTED") && (
                        <button disabled={busy} className={smallBtn} onClick={() => setStatusTo("OPEN")}>
                          Reopen
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
            <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
          </div>
        )}
      </div>
    </>
  );
}

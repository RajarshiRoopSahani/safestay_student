"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import AdminHeader from "@/components/AdminHeader";
import EmptyState from "@/components/EmptyState";
import ErrorMessage from "@/components/ErrorMessage";
import FilterChips from "@/components/FilterChips";
import LoadingSpinner from "@/components/LoadingSpinner";
import Pagination from "@/components/Pagination";
import StatusBadge from "@/components/StatusBadge";
import { useAdminData } from "@/hooks/useAdminData";
import { getErrorMessage } from "@/services/api";
import { fetchBookings, updateBookingStatus } from "@/services/bookingService";
import { formatDate, formatDateUtc, formatRent, ROOM_TYPE_LABEL } from "@/utils/format";

const FILTERS = [
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "", label: "All" },
];

export default function AdminBookingsPage() {
  const [status, setStatus] = useState("PENDING");
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetcher = useCallback(() => fetchBookings({ status: status || undefined, page }), [status, page]);
  const { data, loading, error, reload } = useAdminData(fetcher);

  useEffect(() => {
    if (data && data.bookings.length === 0 && page > 1) setPage(data.totalPages);
  }, [data, page]);

  async function decide(id: string, next: "APPROVED" | "REJECTED") {
    if (next === "REJECTED" && !window.confirm("Reject this booking request?")) return;
    setBusyId(id);
    setActionError(null);
    try {
      await updateBookingStatus(id, next);
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
        title="Booking requests"
        description="Approving a request reserves the beds. Students are told the request is not a payment or a guarantee."
      />

      <FilterChips
        options={FILTERS}
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
          <LoadingSpinner label="Loading bookings..." />
        ) : data.bookings.length === 0 ? (
          <EmptyState title="No booking requests here" description="Nothing matches this filter right now." />
        ) : (
          <div className={loading ? "opacity-60 transition" : "transition"}>
            <ul className="space-y-4">
              {data.bookings.map((b) => (
                <li key={b.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <Link href={`/admin/properties/${b.property.id}`} className="text-lg font-semibold text-slate-900 hover:text-indigo-600">
                        {b.property.name}
                      </Link>
                      <p className="text-sm text-slate-500">
                        {b.property.area}, {b.property.city} · listed {formatRent(b.property.rent)}/month
                      </p>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>

                  <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                    <div>
                      <dt className="text-slate-500">Room type</dt>
                      <dd className="font-medium text-slate-800">{ROOM_TYPE_LABEL[b.roomType]}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Move-in</dt>
                      <dd className="font-medium text-slate-800">{formatDateUtc(b.moveInDate)}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Occupants</dt>
                      <dd className="font-medium text-slate-800">{b.occupants}</dd>
                    </div>
                  </dl>

                  <p className="mt-3 text-sm text-slate-600">
                    Contact: {b.contactName} · {b.contactPhone}
                  </p>
                  {b.user && (
                    <p className="text-sm text-slate-500">
                      Account: {b.user.name} ({b.user.email})
                    </p>
                  )}
                  {b.note && <p className="mt-1 text-sm text-slate-500">Note: {b.note}</p>}

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                    <p className="text-xs text-slate-500">Requested {formatDate(b.createdAt)}</p>
                    {b.status === "PENDING" && (
                      <div className="flex gap-2">
                        <button
                          disabled={busyId === b.id}
                          onClick={() => decide(b.id, "APPROVED")}
                          className="flex items-center gap-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          <Check className="h-4 w-4" /> Approve
                        </button>
                        <button
                          disabled={busyId === b.id}
                          onClick={() => decide(b.id, "REJECTED")}
                          className="flex items-center gap-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                          <X className="h-4 w-4" /> Reject
                        </button>
                      </div>
                    )}
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

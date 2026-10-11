"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CalendarCheck } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import ErrorMessage from "@/components/ErrorMessage";
import LoadingSpinner from "@/components/LoadingSpinner";
import RequireAuth from "@/components/RequireAuth";
import StatusBadge from "@/components/StatusBadge";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/services/api";
import { BookingsResponse, cancelBooking, fetchBookings } from "@/services/bookingService";
import { formatDate, formatDateUtc, formatRent, PROPERTY_TYPE_LABEL, ROOM_TYPE_LABEL } from "@/utils/format";

const FILTERS = [
  { value: "", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "CANCELLED", label: "Cancelled" },
];

const STATUS_NOTE: Record<string, string> = {
  PENDING: "Waiting for review. This is not a reservation yet.",
  APPROVED: "Approved. Please contact the property, visit and verify everything before paying anything.",
  REJECTED: "This request was not approved. You can send a new request or look at other properties.",
  CANCELLED: "This request was cancelled.",
};

function BookingsContent() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<BookingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchBookings({ status: status || undefined, page }));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCancel(id: string) {
    if (!window.confirm("Cancel this booking request?")) return;
    setActionError(null);
    setBusyId(id);
    try {
      await cancelBooking(id);
      await load();
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
        <CalendarCheck className="h-6 w-6 text-indigo-600" /> {isAdmin ? "All booking requests" : "My bookings"}
      </h1>
      {isAdmin && (
        <p className="mt-2 rounded-lg bg-indigo-50 p-3 text-sm text-indigo-800">
          You are viewing every student&apos;s requests. Approving and rejecting will be in the admin panel.
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => {
              setStatus(f.value);
              setPage(1);
            }}
            className={`rounded-full px-3 py-1.5 text-sm transition ${
              status === f.value ? "bg-indigo-600 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {actionError && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {actionError}
        </p>
      )}

      <div className="mt-5">
        {error ? (
          <ErrorMessage message={error} onRetry={load} />
        ) : !data ? (
          <LoadingSpinner label="Loading bookings..." />
        ) : data.bookings.length === 0 ? (
          <EmptyState
            title="No booking requests"
            description={status ? "No requests with this status." : "When you request a booking, it will appear here."}
            actionLabel="Find a place"
            actionHref="/search"
          />
        ) : (
          <div className={loading ? "opacity-60 transition" : "transition"}>
            <ul className="space-y-4">
              {data.bookings.map((b) => (
                <li key={b.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <Link href={`/property/${b.property.id}`} className="text-lg font-semibold text-slate-900 hover:text-indigo-600">
                        {b.property.name}
                      </Link>
                      <p className="text-sm text-slate-500">
                        {PROPERTY_TYPE_LABEL[b.property.type]} · {b.property.area}, {b.property.city}
                      </p>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>

                  <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-4">
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
                    <div>
                      <dt className="text-slate-500">Listed rent</dt>
                      <dd className="font-medium text-slate-800">{formatRent(b.property.rent)}/month</dd>
                    </div>
                  </dl>

                  <p className="mt-3 text-sm text-slate-600">
                    Contact: {b.contactName} · {b.contactPhone}
                  </p>
                  {b.note && <p className="mt-1 text-sm text-slate-500">Note: {b.note}</p>}
                  {isAdmin && b.user && (
                    <p className="mt-1 text-sm text-slate-500">
                      Account: {b.user.name} ({b.user.email})
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                    <p className="text-xs text-slate-500">
                      Requested {formatDate(b.createdAt)}. {STATUS_NOTE[b.status]}
                    </p>
                    {!isAdmin && (b.status === "PENDING" || b.status === "APPROVED") && (
                      <button
                        onClick={() => handleCancel(b.id)}
                        disabled={busyId === b.id}
                        className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                      >
                        {busyId === b.id ? "Cancelling..." : "Cancel request"}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            {data.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-sm text-slate-600">
                  Page {data.page} of {data.totalPages}
                </span>
                <button
                  disabled={page >= data.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BookingsPage() {
  return (
    <RequireAuth>
      <BookingsContent />
    </RequireAuth>
  );
}

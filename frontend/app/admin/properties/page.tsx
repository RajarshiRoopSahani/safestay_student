"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Pencil, Plus, Search, Trash2 } from "lucide-react";
import AdminHeader from "@/components/AdminHeader";
import EmptyState from "@/components/EmptyState";
import ErrorMessage from "@/components/ErrorMessage";
import FilterChips from "@/components/FilterChips";
import LoadingSpinner from "@/components/LoadingSpinner";
import Pagination from "@/components/Pagination";
import StatusBadge from "@/components/StatusBadge";
import { useAdminData } from "@/hooks/useAdminData";
import { AdminPropertyRow, deleteProperty, fetchAdminProperties, updateProperty } from "@/services/adminService";
import { getErrorMessage } from "@/services/api";
import { formatRent, PROPERTY_TYPE_LABEL } from "@/utils/format";

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export default function AdminPropertiesPage() {
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetcher = useCallback(() => fetchAdminProperties({ q, status, page }), [q, status, page]);
  const { data, loading, error, reload } = useAdminData(fetcher);

  useEffect(() => {
    if (data && data.properties.length === 0 && page > 1) setPage(data.totalPages);
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

  function toggleActive(p: AdminPropertyRow) {
    const msg = p.isActive
      ? `Deactivate "${p.name}"? Students will no longer see it.`
      : `Activate "${p.name}"? It will become visible to students.`;
    if (!window.confirm(msg)) return;
    void act(p.id, () => updateProperty(p.id, { isActive: !p.isActive }));
  }

  function remove(p: AdminPropertyRow) {
    const msg = `Permanently delete "${p.name}"?\n\nThis also deletes its rooms, reviews, photos, bookings and reports. Consider deactivating instead.`;
    if (!window.confirm(msg)) return;
    void act(p.id, () => deleteProperty(p.id));
  }

  return (
    <>
      <AdminHeader
        title="Properties"
        description="Add, edit, deactivate or delete listings."
        action={
          <Link
            href="/admin/properties/new"
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" /> Add property
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setQ(qInput.trim());
            setPage(1);
          }}
          className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3"
        >
          <Search className="h-4 w-4 text-slate-400" />
          <input
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder="Search name, area or city"
            aria-label="Search properties"
            className="w-56 bg-transparent py-2 text-sm outline-none"
          />
        </form>
        <FilterChips
          options={STATUS_OPTIONS}
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
        />
      </div>

      {actionError && (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {actionError}
        </p>
      )}

      {error ? (
        <ErrorMessage message={error} onRetry={reload} />
      ) : !data ? (
        <LoadingSpinner label="Loading properties..." />
      ) : data.properties.length === 0 ? (
        <EmptyState title="No properties found" description="Try a different search or filter." />
      ) : (
        <div className={loading ? "opacity-60 transition" : "transition"}>
          <p className="mb-2 text-sm text-slate-500">{data.total} total</p>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="p-3 font-medium">Property</th>
                  <th className="p-3 font-medium">Type</th>
                  <th className="p-3 font-medium">Rent</th>
                  <th className="p-3 font-medium">Beds free</th>
                  <th className="p-3 font-medium">Activity</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.properties.map((p) => {
                  const free = p.rooms.reduce((s, r) => s + r.availableBeds, 0);
                  const total = p.rooms.reduce((s, r) => s + r.totalBeds, 0);
                  return (
                    <tr key={p.id} className="border-b border-slate-100 align-top last:border-0">
                      <td className="p-3">
                        <p className="font-medium text-slate-900">{p.name}</p>
                        <p className="text-xs text-slate-500">
                          {p.area}, {p.city}
                          {p.isDemo && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">Demo</span>}
                        </p>
                      </td>
                      <td className="p-3 text-slate-700">{PROPERTY_TYPE_LABEL[p.type]}</td>
                      <td className="p-3 text-slate-700">{formatRent(p.rent)}</td>
                      <td className="p-3 text-slate-700">
                        {free} / {total}
                      </td>
                      <td className="p-3 text-xs text-slate-500">
                        {p._count.reviews} reviews · {p._count.photos} photos · {p._count.bookings} bookings
                        {p._count.reports > 0 && <span className="ml-1 font-semibold text-red-600">· {p._count.reports} reports</span>}
                      </td>
                      <td className="p-3">
                        <StatusBadge status={p.isActive ? "ACTIVE" : "INACTIVE"} />
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/admin/properties/${p.id}`}
                            className="flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            <Pencil className="h-3.5 w-3.5" /> Edit
                          </Link>
                          <Link
                            href={`/property/${p.id}`}
                            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
                          >
                            <ExternalLink className="h-3.5 w-3.5" /> View
                          </Link>
                          <button
                            disabled={busyId === p.id}
                            onClick={() => toggleActive(p)}
                            className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                          >
                            {p.isActive ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            disabled={busyId === p.id}
                            onClick={() => remove(p)}
                            aria-label={`Delete ${p.name}`}
                            className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
        </div>
      )}
    </>
  );
}

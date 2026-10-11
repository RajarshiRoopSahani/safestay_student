"use client";

import { useCallback, useEffect, useState } from "react";
import { Search } from "lucide-react";
import AdminHeader from "@/components/AdminHeader";
import EmptyState from "@/components/EmptyState";
import ErrorMessage from "@/components/ErrorMessage";
import FilterChips from "@/components/FilterChips";
import LoadingSpinner from "@/components/LoadingSpinner";
import Pagination from "@/components/Pagination";
import { useAdminData } from "@/hooks/useAdminData";
import { fetchAdminUsers } from "@/services/adminService";
import { formatDate } from "@/utils/format";

const ROLE_OPTIONS = [
  { value: "", label: "All" },
  { value: "STUDENT", label: "Students" },
  { value: "ADMIN", label: "Admins" },
];

export default function AdminUsersPage() {
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);

  const fetcher = useCallback(() => fetchAdminUsers({ q, role, page }), [q, role, page]);
  const { data, loading, error, reload } = useAdminData(fetcher);

  useEffect(() => {
    if (data && data.users.length === 0 && page > 1) setPage(data.totalPages);
  }, [data, page]);

  return (
    <>
      <AdminHeader title="Users" description="Accounts on SafeStay Student. This list is read-only." />

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
            placeholder="Search name or email"
            aria-label="Search users"
            className="w-56 bg-transparent py-2 text-sm outline-none"
          />
        </form>
        <FilterChips
          options={ROLE_OPTIONS}
          value={role}
          onChange={(v) => {
            setRole(v);
            setPage(1);
          }}
        />
      </div>

      {error ? (
        <ErrorMessage message={error} onRetry={reload} />
      ) : !data ? (
        <LoadingSpinner label="Loading users..." />
      ) : data.users.length === 0 ? (
        <EmptyState title="No users found" description="Try a different search or filter." />
      ) : (
        <div className={loading ? "opacity-60 transition" : "transition"}>
          <p className="mb-2 text-sm text-slate-500">{data.total} total</p>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="p-3 font-medium">Name</th>
                  <th className="p-3 font-medium">Email</th>
                  <th className="p-3 font-medium">Phone</th>
                  <th className="p-3 font-medium">Role</th>
                  <th className="p-3 font-medium">Joined</th>
                  <th className="p-3 font-medium">Activity</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((u) => (
                  <tr key={u.id} className="border-b border-slate-100 last:border-0">
                    <td className="p-3 font-medium text-slate-900">{u.name}</td>
                    <td className="p-3 text-slate-700">{u.email}</td>
                    <td className="p-3 text-slate-700">{u.phone || "Not provided"}</td>
                    <td className="p-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          u.role === "ADMIN" ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {u.role === "ADMIN" ? "Admin" : "Student"}
                      </span>
                    </td>
                    <td className="p-3 text-slate-700">{formatDate(u.createdAt)}</td>
                    <td className="p-3 text-xs text-slate-500">
                      {u._count.bookings} bookings · {u._count.reviews} reviews · {u._count.photos} photos
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
        </div>
      )}
    </>
  );
}

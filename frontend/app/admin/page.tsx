"use client";

import { BedDouble, CalendarCheck, Camera, Flag, MessageSquare, Users } from "lucide-react";
import AdminHeader from "@/components/AdminHeader";
import DashboardCard from "@/components/DashboardCard";
import ErrorMessage from "@/components/ErrorMessage";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useAdminData } from "@/hooks/useAdminData";
import { fetchStats } from "@/services/adminService";
import { PROPERTY_TYPE_LABEL } from "@/utils/format";

function Breakdown({ title, rows, total }: { title: string; rows: { label: string; value: number }[]; total: number }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="text-base font-bold text-slate-900">{title}</h2>
      <div className="mt-4 space-y-3">
        {rows.map((r) => {
          const pct = total > 0 ? Math.round((r.value / total) * 100) : 0;
          return (
            <div key={r.label}>
              <div className="flex justify-between text-sm text-slate-600">
                <span>{r.label}</span>
                <span className="font-medium text-slate-800">{r.value}</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function AdminDashboardPage() {
  const { data: stats, error, reload } = useAdminData(fetchStats);

  return (
    <>
      <AdminHeader title="Dashboard" description="A quick look at what needs your attention." />

      {error ? (
        <ErrorMessage message={error} onRetry={reload} />
      ) : !stats ? (
        <LoadingSpinner label="Loading dashboard..." />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <DashboardCard label="Total students" value={stats.totalStudents} icon={Users} href="/admin/users" />
            <DashboardCard label="Total properties" value={stats.totalProperties} icon={BedDouble} href="/admin/properties" />
            <DashboardCard label="Total bookings" value={stats.totalBookings} icon={CalendarCheck} href="/admin/bookings" />
            <DashboardCard label="Pending photos" value={stats.pendingPhotos} icon={Camera} href="/admin/photos" alert />
            <DashboardCard label="Pending reviews" value={stats.pendingReviews} icon={MessageSquare} href="/admin/reviews" alert />
            <DashboardCard label="Open reports" value={stats.openReports} icon={Flag} href="/admin/reports" alert />
          </div>

          {stats.pendingBookings > 0 && (
            <p className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {stats.pendingBookings} booking {stats.pendingBookings === 1 ? "request is" : "requests are"} waiting for a
              decision.{" "}
              <a href="/admin/bookings" className="font-semibold underline">
                Review now
              </a>
            </p>
          )}

          <div className="grid gap-4 lg:grid-cols-3">
            <Breakdown
              title="Bookings by status"
              total={stats.totalBookings}
              rows={["PENDING", "APPROVED", "REJECTED", "CANCELLED"].map((s) => ({
                label: s.charAt(0) + s.slice(1).toLowerCase(),
                value: stats.bookingsByStatus[s] ?? 0,
              }))}
            />
            <Breakdown
              title="Properties by type"
              total={stats.totalProperties}
              rows={["HOSTEL", "PG", "ROOM", "FLAT"].map((t) => ({
                label: PROPERTY_TYPE_LABEL[t],
                value: stats.propertiesByType[t] ?? 0,
              }))}
            />
            <Breakdown
              title="Listing status"
              total={stats.totalProperties}
              rows={[
                { label: "Active", value: stats.activeProperties },
                { label: "Inactive", value: stats.inactiveProperties },
              ]}
            />
          </div>
        </div>
      )}
    </>
  );
}

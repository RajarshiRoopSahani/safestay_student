"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export default function OwnerDashboard() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-sm text-slate-500">Loading...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-2xl font-bold text-slate-900">
          Owner Dashboard
        </h1>

        <p className="mt-2 text-slate-600">
          Please log in to continue.
        </p>

        <Link
          href="/login?next=/owner"
          className="mt-5 inline-block rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Log in
        </Link>
      </main>
    );
  }

  if (user.role !== "OWNER") {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-2xl font-bold text-slate-900">
          Access denied
        </h1>

        <p className="mt-2 text-slate-600">
          This dashboard is only available to property owners.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-indigo-600">
            Property Owner
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Owner Dashboard
          </h1>

          <p className="mt-2 text-slate-600">
            Welcome, {user.name}
          </p>
        </div>

        <button
          onClick={logout}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Log out
        </button>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            My Properties
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            0
          </p>

          <Link
            href="/owner/properties"
            className="mt-4 inline-block text-sm font-semibold text-indigo-600 hover:underline"
          >
            Manage properties →
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Booking Requests
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            0
          </p>

          <Link
            href="/owner/bookings"
            className="mt-4 inline-block text-sm font-semibold text-indigo-600 hover:underline"
          >
            View bookings →
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Feedback & Disputes
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            0
          </p>

          <Link
            href="/owner/disputes"
            className="mt-4 inline-block text-sm font-semibold text-indigo-600 hover:underline"
          >
            View disputes →
          </Link>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-indigo-100 bg-indigo-50 p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Get started
        </h2>

        <p className="mt-2 text-sm text-slate-600">
          Add your student accommodation property to start receiving
          bookings and managing student feedback.
        </p>

        <Link
          href="/owner/properties/new"
          className="mt-5 inline-block rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          + Add Property
        </Link>
      </div>
    </main>
  );
}
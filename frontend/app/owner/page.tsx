"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type Property = {
  id: string;
  name: string;
  city?: string;
  area?: string;
  rent?: number;
};

export default function OwnerDashboard() {
  const { user, loading, logout } = useAuth();

  const [properties, setProperties] = useState<Property[]>([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [propertiesError, setPropertiesError] = useState("");

  const role = user ? String(user.role).toUpperCase() : "";

  useEffect(() => {
    if (loading) return;

    if (!user || role !== "OWNER") {
      setProperties([]);
      setPropertiesLoading(false);
      return;
    }

    let cancelled = false;

    async function loadProperties() {
      try {
        setPropertiesLoading(true);
        setPropertiesError("");

        const token = localStorage.getItem("safestay_token");

        if (!token) {
          throw new Error("Session nahi mili. Dobara login karo.");
        }

        const response = await fetch(`${API_URL}/api/properties/mine`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error ||
              result.message ||
              "Properties load nahi ho paayin."
          );
        }

        if (!cancelled) {
          setProperties(
            Array.isArray(result.properties) ? result.properties : []
          );
        }
      } catch (error) {
        if (!cancelled) {
          setPropertiesError(
            error instanceof Error
              ? error.message
              : "Properties load nahi ho paayin."
          );
        }
      } finally {
        if (!cancelled) {
          setPropertiesLoading(false);
        }
      }
    }

    void loadProperties();

    return () => {
      cancelled = true;
    };
  }, [user, loading, role]);

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

  if (role !== "OWNER") {
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
      <div className="flex items-center justify-between gap-4">
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
          type="button"
          onClick={logout}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Log out
        </button>
      </div>

      {propertiesError && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {propertiesError}
        </div>
      )}

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            My Properties
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {propertiesLoading ? "..." : properties.length}
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
          <p className="mt-2 text-3xl font-bold text-slate-900">0</p>
          <Link
            href="/owner/bookings"
            className="mt-4 inline-block text-sm font-semibold text-indigo-600 hover:underline"
          >
            View bookings →
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Feedback &amp; Disputes
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-900">0</p>
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
          Add your student accommodation property to start
          receiving bookings and managing student feedback.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/owner/properties/new"
            className="inline-block rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            + Add Property
          </Link>
          <Link
            href="/owner/properties"
            className="inline-block rounded-lg border border-indigo-200 bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
          >
            View My Properties
          </Link>
        </div>
      </div>

      {!propertiesLoading && properties.length > 0 && (
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Recently Added Properties
          </h2>

          <div className="mt-4 divide-y divide-slate-100">
            {properties.slice(0, 3).map((property) => (
              <div
                key={property.id}
                className="flex flex-wrap items-center justify-between gap-3 py-4"
              >
                <div>
                  <p className="font-semibold text-slate-900">
                    {property.name}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {[property.area, property.city]
                      .filter(Boolean)
                      .join(", ") || "Location not provided"}
                  </p>
                </div>

                {typeof property.rent === "number" && (
                  <p className="text-sm font-semibold text-slate-700">
                    ₹{property.rent.toLocaleString("en-IN")}
                  </p>
                )}
              </div>
            ))}
          </div>

          <Link
            href="/owner/properties"
            className="mt-3 inline-block text-sm font-semibold text-indigo-600 hover:underline"
          >
            See all properties →
          </Link>
        </section>
      )}
    </main>
  );
}
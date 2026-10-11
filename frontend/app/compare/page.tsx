"use client";

import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";
import { GitCompare } from "lucide-react";
import CompareTable from "@/components/CompareTable";
import EmptyState from "@/components/EmptyState";
import ErrorMessage from "@/components/ErrorMessage";
import LoadingSpinner from "@/components/LoadingSpinner";
import { MAX_COMPARE, useCompare } from "@/hooks/useCompare";
import { getErrorMessage } from "@/services/api";
import { fetchProperty } from "@/services/propertyService";
import { PropertyDetail } from "@/types";

export default function ComparePage() {
  const { ids, ready, remove, clear } = useCompare();
  const [items, setItems] = useState<Record<string, PropertyDetail>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!ready) return;
    if (ids.length === 0) {
      setItems({});
      setLoading(false);
      return;
    }

    let cancelled = false;
    setError(null);
    // Only show the big spinner the first time; later changes update quietly.
    setLoading((prev) => prev || Object.keys(items).length === 0);

    Promise.allSettled(ids.map((id) => fetchProperty(id))).then((results) => {
      if (cancelled) return;
      const next: Record<string, PropertyDetail> = {};
      const gone: string[] = [];
      let failure: string | null = null;

      results.forEach((r, i) => {
        if (r.status === "fulfilled") {
          next[ids[i]] = r.value.property;
        } else if (axios.isAxiosError(r.reason) && r.reason.response?.status === 404) {
          gone.push(ids[i]); // the property was removed or deactivated
        } else {
          failure = getErrorMessage(r.reason);
        }
      });

      setItems(next);
      setError(failure);
      setLoading(false);
      gone.forEach(remove);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids, ready, reloadKey]);

  const properties = ids.map((id) => items[id]).filter((p): p is PropertyDetail => !!p);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <GitCompare className="h-6 w-6 text-indigo-600" /> Compare properties
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Compare up to {MAX_COMPARE} properties side by side. Rent, deposit and facilities come from the listings.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/search"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Add more
          </Link>
          {ids.length > 0 && (
            <button onClick={clear} className="rounded-lg px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
              Clear all
            </button>
          )}
        </div>
      </div>

      <div className="mt-6">
        {!ready || (loading && ids.length > 0) ? (
          <LoadingSpinner label="Loading comparison..." />
        ) : ids.length === 0 ? (
          <EmptyState
            title="Nothing to compare yet"
            description="Tap the Compare button on any property card to add it here."
            actionLabel="Browse properties"
            actionHref="/search"
          />
        ) : (
          <div className="space-y-4">
            {error && <ErrorMessage message={error} onRetry={() => setReloadKey((k) => k + 1)} />}
            {properties.length === 1 && (
              <p className="rounded-lg bg-indigo-50 p-3 text-sm text-indigo-800">
                Add at least one more property to see how they compare.
              </p>
            )}
            {properties.length > 0 && <CompareTable properties={properties} onRemove={remove} />}
            <p className="text-xs text-slate-500">
              Distances are straight-line estimates. Listings are not verified by SafeStay, so please visit before
              booking.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

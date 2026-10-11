"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LocateFixed, SlidersHorizontal, X } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import ErrorMessage from "@/components/ErrorMessage";
import FilterSidebar from "@/components/FilterSidebar";
import LoadingSpinner from "@/components/LoadingSpinner";
import PropertyGrid from "@/components/PropertyGrid";
import SearchBar from "@/components/SearchBar";
import { getErrorMessage } from "@/services/api";
import { fetchColleges, searchProperties } from "@/services/propertyService";
import { College, SearchResponse } from "@/types";
import { PROPERTY_TYPE_LABEL } from "@/utils/format";

const KNOWN_KEYS = [
  "q", "collegeId", "lat", "lng", "maxDistance", "maxRent", "type", "roomType", "minRating",
  "food", "wifi", "ac", "bathroom", "parking", "cctv", "available", "sort", "page",
];

const SORT_OPTIONS = [
  { value: "recommended", label: "Best match" },
  { value: "rent_asc", label: "Lowest rent" },
  { value: "rating_desc", label: "Highest rating" },
  { value: "nearest", label: "Nearest" },
  { value: "reviews_desc", label: "Most reviewed" },
];

function SearchContent() {
  const router = useRouter();
  const sp = useSearchParams();
  const queryString = sp.toString();

  const [data, setData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [colleges, setColleges] = useState<College[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const values = useMemo(() => {
    const v: Record<string, string> = {};
    KNOWN_KEYS.forEach((k) => {
      const val = new URLSearchParams(queryString).get(k);
      if (val) v[k] = val;
    });
    return v;
  }, [queryString]);

  useEffect(() => {
    fetchColleges().then(setColleges).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    searchProperties({ ...values, limit: "12" })
      .then((d) => !cancelled && setData(d))
      .catch((e) => !cancelled && setError(getErrorMessage(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [values, reloadKey]);

  const setParams = useCallback(
    (patch: Record<string, string>) => {
      const next = new URLSearchParams(queryString);
      Object.entries(patch).forEach(([k, v]) => {
        if (v) next.set(k, v);
        else next.delete(k);
      });
      if (!("page" in patch)) next.delete("page");
      const qs = next.toString();
      router.push(qs ? `/search?${qs}` : "/search", { scroll: false });
    },
    [queryString, router]
  );

  function clearAll() {
    router.push(values.q ? `/search?q=${encodeURIComponent(values.q)}` : "/search", { scroll: false });
  }

  function useMyLocation() {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError("Your browser does not support location.");
      return;
    }
    // The browser asks for permission here. We never ask automatically.
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setParams({
          lat: pos.coords.latitude.toFixed(5),
          lng: pos.coords.longitude.toFixed(5),
          collegeId: "",
        }),
      () => setGeoError("Location permission was denied. You can still search by area or college."),
      { timeout: 10000 }
    );
  }

  const hasLocation = !!(values.lat && values.lng);
  const hasReference = !!values.collegeId || hasLocation || data?.reference?.type === "college";
  const referenceLabel =
    data?.reference?.type === "college" ? data.reference.name ?? "your college" : hasLocation ? "your location" : null;

  const total = data?.total ?? 0;
  const currentPage = Number(values.page ?? "1");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <SearchBar size="md" initialValue={values.q ?? ""} onSearch={(q) => setParams({ q })} />

      <div className="mt-3 flex flex-wrap items-center gap-3">
        {hasLocation ? (
          <button
            onClick={() => setParams({ lat: "", lng: "" })}
            className="flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1.5 text-sm font-medium text-indigo-700"
          >
            <LocateFixed className="h-4 w-4" /> Using your location <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button
            onClick={useMyLocation}
            className="flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700"
          >
            <LocateFixed className="h-4 w-4" /> Use my location
          </button>
        )}
        {geoError && <p className="text-sm text-amber-700">{geoError}</p>}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[18rem_1fr]">
        {/* Filters */}
        <aside className={`${showFilters ? "block" : "hidden"} lg:block`}>
          <FilterSidebar
            values={values}
            colleges={colleges}
            hasReference={hasReference}
            onChange={setParams}
            onClear={clearAll}
          />
        </aside>

        {/* Results */}
        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {loading && !data ? "Searching..." : `${total} ${total === 1 ? "property" : "properties"} found`}
                {values.q && <span className="font-normal text-slate-500"> for “{values.q}”</span>}
              </h1>
              {referenceLabel && <p className="text-sm text-slate-500">Distances measured from {referenceLabel}</p>}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters((s) => !s)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 lg:hidden"
              >
                <SlidersHorizontal className="h-4 w-4" /> Filters
              </button>
              <select
                aria-label="Sort results"
                value={values.sort ?? data?.sort ?? "recommended"}
                onChange={(e) => setParams({ sort: e.target.value })}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-500"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error ? (
            <ErrorMessage message={error} onRetry={() => setReloadKey((k) => k + 1)} />
          ) : loading && !data ? (
            <LoadingSpinner label="Finding places..." />
          ) : data && data.results.length === 0 ? (
            <EmptyState
              title="No properties found"
              description="Try a different area, a higher budget or fewer filters."
              actionLabel="Clear filters"
              actionHref={values.q ? `/search?q=${encodeURIComponent(values.q)}` : "/search"}
            />
          ) : data ? (
            <div className={loading ? "opacity-60 transition" : "transition"}>
              <PropertyGrid properties={data.results} referenceLabel={referenceLabel} />

              {data.totalPages > 1 && (
                <nav className="mt-8 flex items-center justify-center gap-3" aria-label="Pagination">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setParams({ page: String(currentPage - 1) })}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-slate-600">
                    Page {data.page} of {data.totalPages}
                  </span>
                  <button
                    disabled={currentPage >= data.totalPages}
                    onClick={() => setParams({ page: String(currentPage + 1) })}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </nav>
              )}

              {/* Nearby summary */}
              <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-5">
                <h2 className="text-base font-semibold text-slate-900">Nearby in these results</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(Object.keys(data.nearby.countsByType) as (keyof typeof data.nearby.countsByType)[])
                    .filter((t) => data.nearby.countsByType[t] > 0)
                    .map((t) => (
                      <span key={t} className="rounded-full bg-indigo-50 px-3 py-1 text-sm text-indigo-700">
                        {data.nearby.countsByType[t]} {PROPERTY_TYPE_LABEL[t]}
                        {data.nearby.countsByType[t] > 1 && t !== "PG" ? "s" : ""}
                      </span>
                    ))}
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {data.nearby.colleges.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-slate-700">Colleges nearby</h3>
                      <ul className="mt-1 space-y-1 text-sm text-slate-600">
                        {data.nearby.colleges.map((c) => (
                          <li key={c.id}>
                            {c.name} <span className="text-slate-400">({c.distanceKm} km)</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {data.nearby.buildings.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-slate-700">Buildings</h3>
                      <ul className="mt-1 space-y-1 text-sm text-slate-600">
                        {data.nearby.buildings.map((b) => (
                          <li key={b.id}>
                            {b.name} <span className="text-slate-400">({b.area})</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <p className="mt-4 text-xs text-slate-500">{data.nearby.note}</p>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<LoadingSpinner label="Loading search..." />}>
      <SearchContent />
    </Suspense>
  );
}

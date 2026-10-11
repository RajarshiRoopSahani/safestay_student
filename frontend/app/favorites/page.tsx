"use client";

import { useCallback, useEffect, useState } from "react";
import { Heart } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import ErrorMessage from "@/components/ErrorMessage";
import LoadingSpinner from "@/components/LoadingSpinner";
import PropertyGrid from "@/components/PropertyGrid";
import RequireAuth from "@/components/RequireAuth";
import { useFavorites } from "@/hooks/useFavorites";
import { getErrorMessage } from "@/services/api";
import { fetchFavorites } from "@/services/favoriteService";
import { Property } from "@/types";

function FavoritesContent() {
  const { isFavorite, ready } = useFavorites();
  const [list, setList] = useState<Property[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setList(await fetchFavorites());
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // When you un-save a property here, it disappears right away.
  const visible = (list ?? []).filter((p) => !ready || isFavorite(p.id));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
        <Heart className="h-6 w-6 text-rose-500" /> Saved properties
      </h1>

      <div className="mt-6">
        {error ? (
          <ErrorMessage message={error} onRetry={load} />
        ) : list === null ? (
          <LoadingSpinner label="Loading your saved properties..." />
        ) : visible.length === 0 ? (
          <EmptyState
            title="No saved properties yet"
            description="Tap the heart on any property to save it here."
            actionLabel="Browse properties"
            actionHref="/search"
          />
        ) : (
          <PropertyGrid properties={visible} />
        )}
      </div>
    </div>
  );
}

export default function FavoritesPage() {
  return (
    <RequireAuth>
      <FavoritesContent />
    </RequireAuth>
  );
}

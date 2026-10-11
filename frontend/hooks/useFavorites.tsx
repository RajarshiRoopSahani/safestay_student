"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { addFavorite, fetchFavorites, removeFavorite } from "@/services/favoriteService";

type FavoritesContextValue = {
  isFavorite: (propertyId: string) => boolean;
  toggle: (propertyId: string) => Promise<void>;
  ready: boolean;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIds(new Set());
      setReady(true);
      return;
    }
    setReady(false);
    fetchFavorites()
      .then((list) => setIds(new Set(list.map((p) => p.id))))
      .catch(() => {})
      .finally(() => setReady(true));
  }, [user, authLoading]);

  const toggle = useCallback(
    async (propertyId: string) => {
      if (!user) {
        const here = window.location.pathname + window.location.search;
        router.push(`/login?next=${encodeURIComponent(here)}`);
        return;
      }
      const had = ids.has(propertyId);
      setIds((prev) => {
        const next = new Set(prev);
        if (had) next.delete(propertyId);
        else next.add(propertyId);
        return next;
      });
      try {
        if (had) await removeFavorite(propertyId);
        else await addFavorite(propertyId);
      } catch {
        // Undo the optimistic change if the server failed
        setIds((prev) => {
          const next = new Set(prev);
          if (had) next.add(propertyId);
          else next.delete(propertyId);
          return next;
        });
      }
    },
    [user, ids, router]
  );

  const value = useMemo(
    () => ({ isFavorite: (id: string) => ids.has(id), toggle, ready }),
    [ids, toggle, ready]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used inside <FavoritesProvider>");
  return ctx;
}

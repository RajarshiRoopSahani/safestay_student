"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const KEY = "safestay_compare";
export const MAX_COMPARE = 4;

type CompareContextValue = {
  ids: string[];
  ready: boolean;
  isFull: boolean;
  has: (id: string) => boolean;
  toggle: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const CompareContext = createContext<CompareContextValue | null>(null);

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  // Load the saved list after the page mounts (localStorage does not exist on the server).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setIds(parsed.filter((x): x is string => typeof x === "string").slice(0, MAX_COMPARE));
        }
      }
    } catch {
      // ignore broken saved data
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(ids));
    } catch {
      // storage may be unavailable (private mode); the list still works for this visit
    }
  }, [ids, ready]);

  const toggle = useCallback((id: string) => {
    setIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, id];
    });
  }, []);

  const remove = useCallback((id: string) => setIds((prev) => prev.filter((x) => x !== id)), []);
  const clear = useCallback(() => setIds([]), []);

  const value = useMemo(
    () => ({
      ids,
      ready,
      isFull: ids.length >= MAX_COMPARE,
      has: (id: string) => ids.includes(id),
      toggle,
      remove,
      clear,
    }),
    [ids, ready, toggle, remove, clear]
  );

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare(): CompareContextValue {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used inside <CompareProvider>");
  return ctx;
}

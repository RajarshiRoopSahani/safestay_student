"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GitCompare, X } from "lucide-react";
import { MAX_COMPARE, useCompare } from "@/hooks/useCompare";

export default function CompareBar() {
  const { ids, clear } = useCompare();
  const pathname = usePathname();

  if (ids.length === 0 || pathname.startsWith("/compare")) return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-30 flex justify-center px-4">
      <div className="flex items-center gap-3 rounded-2xl border border-indigo-200 bg-white px-4 py-3 shadow-xl">
        <GitCompare className="h-5 w-5 text-indigo-600" />
        <p className="text-sm text-slate-700">
          <span className="font-semibold">{ids.length}</span> selected
          {ids.length >= MAX_COMPARE && <span className="text-slate-500"> (maximum {MAX_COMPARE})</span>}
        </p>
        <Link
          href="/compare"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          Compare
        </Link>
        <button onClick={clear} aria-label="Clear comparison list" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

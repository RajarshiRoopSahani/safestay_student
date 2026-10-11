"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";

type Props = {
  size?: "lg" | "md";
  initialValue?: string;
  // If given, called instead of navigating (used on the search page itself)
  onSearch?: (value: string) => void;
};

export default function SearchBar({ size = "lg", initialValue = "", onSearch }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);

  useEffect(() => setValue(initialValue), [initialValue]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    if (onSearch) onSearch(q);
    else router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  }

  const big = size === "lg";

  return (
    <form
      onSubmit={submit}
      role="search"
      className={`flex w-full items-center gap-2 rounded-2xl border border-slate-200 bg-white shadow-lg ${big ? "p-2.5" : "p-1.5"}`}
    >
      <Search className={`ml-3 shrink-0 text-slate-400 ${big ? "h-6 w-6" : "h-5 w-5"}`} />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={100}
        placeholder="Search area, locality, college, hostel, PG or building..."
        aria-label="Search accommodation"
        className={`min-w-0 flex-1 bg-transparent text-slate-900 outline-none placeholder:text-slate-400 ${big ? "px-2 py-3 text-base sm:text-lg" : "px-2 py-2 text-sm"}`}
      />
      <button
        type="submit"
        className={`shrink-0 rounded-xl bg-indigo-600 font-semibold text-white transition hover:bg-indigo-700 ${big ? "px-6 py-3" : "px-4 py-2 text-sm"}`}
      >
        Search
      </button>
    </form>
  );
}

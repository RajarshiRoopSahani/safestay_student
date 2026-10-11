"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/services/api";
import { recommend, RecommendInput } from "@/services/aiService";
import { College, RecommendationItem, RoomType } from "@/types";
import { ROOM_TYPE_LABEL } from "@/utils/format";

type Props = {
  propertyId: string;
  propertyName: string;
  roomTypes: RoomType[];
  colleges: College[];
};

const FLAG_OPTIONS = [
  { key: "food", label: "Meals" },
  { key: "wifi", label: "Wi-Fi" },
  { key: "ac", label: "AC" },
  { key: "bathroom", label: "Attached bathroom" },
  { key: "parking", label: "Parking" },
  { key: "security", label: "CCTV listed" },
] as const;

type FlagKey = (typeof FLAG_OPTIONS)[number]["key"];

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

export default function AIRecommendationCard({ propertyId, propertyName, roomTypes, colleges }: Props) {
  const { user, loading: authLoading } = useAuth();

  const [budget, setBudget] = useState("");
  const [collegeId, setCollegeId] = useState("");
  const [roomType, setRoomType] = useState("");
  const [flags, setFlags] = useState<Record<FlagKey, boolean>>({
    food: false, wifi: false, ac: false, bathroom: false, parking: false, security: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ item: RecommendationItem | null } | null>(null);

  async function check(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (budget && !/^\d+$/.test(budget)) {
      setError("Enter your budget as a whole number, for example 7000.");
      return;
    }

    const input: RecommendInput = { location: propertyName, limit: 10 };
    if (budget) input.budget = Number(budget);
    if (collegeId) input.collegeId = collegeId;
    if (roomType) input.roomType = roomType as RoomType;
    for (const { key } of FLAG_OPTIONS) {
      if (flags[key]) input[key] = true;
    }

    setLoading(true);
    try {
      const res = await recommend(input);
      setResult({ item: res.recommendations.find((r) => r.property.id === propertyId) ?? null });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-indigo-200 bg-gradient-to-b from-indigo-50 to-white p-5">
      <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
        <Sparkles className="h-5 w-5 text-indigo-600" /> How well does this match you?
      </h2>

      {authLoading ? null : !user ? (
        <p className="mt-3 text-sm text-slate-600">
          <Link href={`/login?next=${encodeURIComponent(`/property/${propertyId}`)}`} className="font-medium text-indigo-600 hover:underline">
            Log in
          </Link>{" "}
          to check this property against your budget, college and must-haves.
        </p>
      ) : (
        <form onSubmit={check} className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="ai-budget" className="mb-1 block text-xs font-medium text-slate-600">Budget (₹/month)</label>
              <input id="ai-budget" inputMode="numeric" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="7000" className={inputClass} />
            </div>
            <div>
              <label htmlFor="ai-room" className="mb-1 block text-xs font-medium text-slate-600">Room type</label>
              <select id="ai-room" value={roomType} onChange={(e) => setRoomType(e.target.value)} className={inputClass}>
                <option value="">Any</option>
                {roomTypes.map((t) => (
                  <option key={t} value={t}>{ROOM_TYPE_LABEL[t]}</option>
                ))}
              </select>
            </div>
          </div>

          {colleges.length > 0 && (
            <div>
              <label htmlFor="ai-college" className="mb-1 block text-xs font-medium text-slate-600">Your college</label>
              <select id="ai-college" value={collegeId} onChange={(e) => setCollegeId(e.target.value)} className={inputClass}>
                <option value="">Not selected</option>
                {colleges.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {FLAG_OPTIONS.map(({ key, label }) => (
              <label key={key} className="flex cursor-pointer items-center gap-1.5 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={flags[key]}
                  onChange={(e) => setFlags((f) => ({ ...f, [key]: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                {label}
              </label>
            ))}
          </div>

          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />} Check my match
          </button>
        </form>
      )}

      {result && (
        <div className="mt-4 border-t border-indigo-100 pt-4">
          {result.item ? (
            <div className="space-y-3">
              <div>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-medium text-slate-700">Match score</span>
                  <span className="text-2xl font-bold text-indigo-700">{result.item.matchScore}%</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-indigo-600" style={{ width: `${result.item.matchScore}%` }} />
                </div>
              </div>
              <p className="text-sm text-slate-700">{result.item.explanation}</p>
              {result.item.caveats.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Things to check</h3>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-600">
                    {result.item.caveats.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="text-xs text-slate-500">
                Calculated from your preferences and the listing data. It is not a safety rating.
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-700">
              This property does not meet one or more of your limits (such as budget or room type). Try adjusting them.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

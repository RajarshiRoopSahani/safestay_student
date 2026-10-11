"use client";

import { College } from "@/types";

type Props = {
  values: Record<string, string>;
  colleges: College[];
  hasReference: boolean;
  onChange: (patch: Record<string, string>) => void;
  onClear: () => void;
};

const selectClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  );
}

export default function FilterSidebar({ values, colleges, hasReference, onChange, onClear }: Props) {
  const checkbox = (key: string, label: string) => (
    <label key={key} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
      <input
        type="checkbox"
        checked={values[key] === "true"}
        onChange={(e) => onChange({ [key]: e.target.checked ? "true" : "" })}
        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
      />
      {label}
    </label>
  );

  return (
    <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">Filters</h2>
        <button onClick={onClear} className="text-sm font-medium text-indigo-600 hover:underline">
          Clear all
        </button>
      </div>

      <Field label="College">
        <select
          className={selectClass}
          value={values.collegeId ?? ""}
          onChange={(e) => onChange({ collegeId: e.target.value, lat: "", lng: "" })}
        >
          <option value="">Any college</option>
          {colleges.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>

      {hasReference && (
        <Field label="Maximum distance">
          <select
            className={selectClass}
            value={values.maxDistance ?? ""}
            onChange={(e) => onChange({ maxDistance: e.target.value })}
          >
            <option value="">Default</option>
            {[1, 2, 3, 5, 10, 20].map((km) => (
              <option key={km} value={km}>
                Within {km} km
              </option>
            ))}
          </select>
        </Field>
      )}

      <Field label="Maximum rent per month">
        <select className={selectClass} value={values.maxRent ?? ""} onChange={(e) => onChange({ maxRent: e.target.value })}>
          <option value="">Any budget</option>
          {[4000, 5000, 6000, 7000, 8000, 10000, 15000].map((r) => (
            <option key={r} value={r}>
              Up to ₹{r.toLocaleString("en-IN")}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Property type">
        <select className={selectClass} value={values.type ?? ""} onChange={(e) => onChange({ type: e.target.value })}>
          <option value="">All types</option>
          <option value="HOSTEL">Hostel</option>
          <option value="PG">PG</option>
          <option value="ROOM">Room</option>
          <option value="FLAT">Flat</option>
        </select>
      </Field>

      <Field label="Room type">
        <select className={selectClass} value={values.roomType ?? ""} onChange={(e) => onChange({ roomType: e.target.value })}>
          <option value="">Any room</option>
          <option value="SINGLE">Single</option>
          <option value="DOUBLE">Double</option>
          <option value="TRIPLE">Triple</option>
          <option value="DORMITORY">Dormitory</option>
        </select>
      </Field>

      <Field label="Minimum rating">
        <select className={selectClass} value={values.minRating ?? ""} onChange={(e) => onChange({ minRating: e.target.value })}>
          <option value="">Any rating</option>
          <option value="3">3+ stars</option>
          <option value="4">4+ stars</option>
          <option value="4.5">4.5+ stars</option>
        </select>
        <p className="mt-1 text-xs text-slate-500">Hides properties without enough reviews.</p>
      </Field>

      <div>
        <p className="mb-2 text-sm font-medium text-slate-700">Facilities</p>
        <div className="space-y-2">
          {checkbox("food", "Meals included")}
          {checkbox("wifi", "Wi-Fi")}
          {checkbox("ac", "AC")}
          {checkbox("bathroom", "Attached bathroom")}
          {checkbox("parking", "Parking")}
          {checkbox("cctv", "CCTV listed")}
        </div>
      </div>

      <div className="border-t border-slate-100 pt-4">{checkbox("available", "Only with available beds")}</div>
    </div>
  );
}

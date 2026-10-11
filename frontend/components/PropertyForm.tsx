"use client";

import { useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { AdminBuilding, PropertyPayload, RoomInput } from "@/services/adminService";
import { getErrorMessage } from "@/services/api";
import { PropertyDetail, PropertyType, RoomType } from "@/types";
import { PROPERTY_TYPE_LABEL, ROOM_TYPE_LABEL } from "@/utils/format";

const FACILITIES = [
  { key: "foodIncluded", label: "Meals included" },
  { key: "wifi", label: "Wi-Fi" },
  { key: "ac", label: "AC" },
  { key: "cooler", label: "Cooler" },
  { key: "attachedBathroom", label: "Attached bathroom" },
  { key: "laundry", label: "Laundry" },
  { key: "parking", label: "Parking" },
  { key: "cctv", label: "CCTV" },
  { key: "furnished", label: "Furnished" },
  { key: "electricityIncluded", label: "Electricity included" },
] as const;

type FacilityKey = (typeof FACILITIES)[number]["key"];

type FormState = {
  name: string;
  type: PropertyType;
  description: string;
  buildingId: string;
  address: string;
  city: string;
  area: string;
  pincode: string;
  latitude: string;
  longitude: string;
  rent: string;
  deposit: string;
  amenities: string;
  waterInfo: string;
  rules: string;
  securityInfo: string;
  nearbyPlaces: string;
  isActive: boolean;
};

type RoomDraft = { type: RoomType; rent: string; totalBeds: string; availableBeds: string };

type Props = {
  mode: "create" | "edit";
  initial?: PropertyDetail;
  buildings: AdminBuilding[];
  submitLabel: string;
  onSubmit: (payload: PropertyPayload) => Promise<void>;
};

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

function toInt(s: string): number | null {
  return /^\d+$/.test(s.trim()) ? Number(s.trim()) : null;
}

function toNum(s: string): number | null {
  const t = s.trim();
  const n = Number(t);
  return t !== "" && Number.isFinite(n) ? n : null;
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="text-base font-bold text-slate-900">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, htmlFor, hint, children }: { label: string; htmlFor: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export default function PropertyForm({ mode, initial, buildings, submitLabel, onSubmit }: Props) {
  const [f, setF] = useState<FormState>({
    name: initial?.name ?? "",
    type: initial?.type ?? "HOSTEL",
    description: initial?.description ?? "",
    buildingId: initial?.buildingId ?? "",
    address: initial?.address ?? "",
    city: initial?.city ?? "",
    area: initial?.area ?? "",
    pincode: initial?.pincode ?? "",
    latitude: initial ? String(initial.latitude) : "",
    longitude: initial ? String(initial.longitude) : "",
    rent: initial ? String(initial.rent) : "",
    deposit: initial ? String(initial.deposit) : "",
    amenities: initial?.amenities.join(", ") ?? "",
    waterInfo: initial?.waterInfo ?? "",
    rules: initial?.rules ?? "",
    securityInfo: initial?.securityInfo ?? "",
    nearbyPlaces: initial?.nearbyPlaces ?? "",
    isActive: initial?.isActive ?? true,
  });

  const [flags, setFlags] = useState<Record<FacilityKey, boolean>>({
    foodIncluded: initial?.foodIncluded ?? false,
    wifi: initial?.wifi ?? false,
    ac: initial?.ac ?? false,
    cooler: initial?.cooler ?? false,
    attachedBathroom: initial?.attachedBathroom ?? false,
    laundry: initial?.laundry ?? false,
    parking: initial?.parking ?? false,
    cctv: initial?.cctv ?? false,
    furnished: initial?.furnished ?? false,
    electricityIncluded: initial?.electricityIncluded ?? false,
  });

  const [rooms, setRooms] = useState<RoomDraft[]>([{ type: "DOUBLE", rent: "", totalBeds: "", availableBeds: "" }]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setF((prev) => ({ ...prev, [key]: value }));
  }

  function updateRoomDraft(index: number, patch: Partial<RoomDraft>) {
    setRooms((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function buildPayload(): PropertyPayload | string {
    const name = f.name.trim();
    const description = f.description.trim();
    const address = f.address.trim();
    const city = f.city.trim();
    const area = f.area.trim();

    if (name.length < 2) return "Name must be at least 2 characters.";
    if (description.length < 10) return "Description must be at least 10 characters.";
    if (address.length < 5) return "Address must be at least 5 characters.";
    if (city.length < 2) return "Please enter the city.";
    if (area.length < 2) return "Please enter the area.";
    if (f.pincode.trim().length > 10) return "Pincode is too long.";

    const latitude = toNum(f.latitude);
    const longitude = toNum(f.longitude);
    if (latitude === null || latitude < -90 || latitude > 90) return "Latitude must be a number between -90 and 90.";
    if (longitude === null || longitude < -180 || longitude > 180) return "Longitude must be a number between -180 and 180.";

    const rent = toInt(f.rent);
    const deposit = toInt(f.deposit);
    if (rent === null || rent > 1000000) return "Rent must be a whole number (up to 1,000,000).";
    if (deposit === null || deposit > 1000000) return "Deposit must be a whole number (up to 1,000,000).";

    const amenities = Array.from(
      new Set(f.amenities.split(",").map((a) => a.trim()).filter(Boolean))
    );
    if (amenities.length > 30) return "Please list at most 30 amenities.";
    if (amenities.some((a) => a.length > 40)) return "Each amenity must be 40 characters or fewer.";

    let roomInputs: RoomInput[] | undefined;
    if (mode === "create") {
      roomInputs = [];
      for (let i = 0; i < rooms.length; i++) {
        const r = rooms[i];
        const roomRent = toInt(r.rent);
        const total = toInt(r.totalBeds);
        const available = toInt(r.availableBeds);
        if (roomRent === null || total === null || available === null || total < 1) {
          return `Room ${i + 1}: enter whole numbers (total beds must be at least 1).`;
        }
        if (available > total) return `Room ${i + 1}: available beds cannot exceed total beds.`;
        roomInputs.push({ type: r.type, rent: roomRent, totalBeds: total, availableBeds: available });
      }
    }

    return {
      name,
      type: f.type,
      description,
      buildingId: f.buildingId || null,
      address,
      city,
      area,
      pincode: f.pincode.trim(),
      latitude,
      longitude,
      rent,
      deposit,
      ...flags,
      waterInfo: f.waterInfo.trim(),
      rules: f.rules.trim(),
      securityInfo: f.securityInfo.trim(),
      nearbyPlaces: f.nearbyPlaces.trim(),
      isActive: f.isActive,
      amenities,
      ...(roomInputs ? { rooms: roomInputs } : {}),
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const result = buildPayload();
    if (typeof result === "string") {
      setError(result);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(result);
    } catch (err) {
      setError(getErrorMessage(err));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <Card title="Basic information">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Property name" htmlFor="p-name">
            <input id="p-name" maxLength={100} value={f.name} onChange={(e) => set("name", e.target.value)} className={inputClass} />
          </Field>
          <Field label="Type" htmlFor="p-type">
            <select id="p-type" value={f.type} onChange={(e) => set("type", e.target.value as PropertyType)} className={inputClass}>
              {(Object.keys(PROPERTY_TYPE_LABEL) as PropertyType[]).map((t) => (
                <option key={t} value={t}>
                  {PROPERTY_TYPE_LABEL[t]}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Description" htmlFor="p-desc">
          <textarea id="p-desc" rows={4} maxLength={3000} value={f.description} onChange={(e) => set("description", e.target.value)} className={inputClass} />
        </Field>
        <Field label="Building (optional)" htmlFor="p-building" hint="Add buildings from the Buildings screen first.">
          <select id="p-building" value={f.buildingId} onChange={(e) => set("buildingId", e.target.value)} className={inputClass}>
            <option value="">No building</option>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.area})
              </option>
            ))}
          </select>
        </Field>
      </Card>

      <Card title="Location">
        <Field label="Address" htmlFor="p-address">
          <input id="p-address" maxLength={250} value={f.address} onChange={(e) => set("address", e.target.value)} className={inputClass} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="City" htmlFor="p-city">
            <input id="p-city" maxLength={60} value={f.city} onChange={(e) => set("city", e.target.value)} className={inputClass} />
          </Field>
          <Field label="Area" htmlFor="p-area">
            <input id="p-area" maxLength={60} value={f.area} onChange={(e) => set("area", e.target.value)} className={inputClass} />
          </Field>
          <Field label="Pincode" htmlFor="p-pin">
            <input id="p-pin" maxLength={10} value={f.pincode} onChange={(e) => set("pincode", e.target.value)} className={inputClass} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Latitude" htmlFor="p-lat">
            <input id="p-lat" inputMode="decimal" value={f.latitude} onChange={(e) => set("latitude", e.target.value)} placeholder="26.8883" className={inputClass} />
          </Field>
          <Field label="Longitude" htmlFor="p-lng">
            <input id="p-lng" inputMode="decimal" value={f.longitude} onChange={(e) => set("longitude", e.target.value)} placeholder="80.9440" className={inputClass} />
          </Field>
        </div>
        <p className="text-xs text-slate-500">
          Tip: in Google Maps, right-click the exact spot and click the coordinates at the top of the menu to copy them
          (latitude first, then longitude).
        </p>
      </Card>

      <Card title="Pricing">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Monthly rent (₹)" htmlFor="p-rent" hint="The starting or typical rent shown on cards.">
            <input id="p-rent" inputMode="numeric" value={f.rent} onChange={(e) => set("rent", e.target.value)} className={inputClass} />
          </Field>
          <Field label="Security deposit (₹)" htmlFor="p-deposit">
            <input id="p-deposit" inputMode="numeric" value={f.deposit} onChange={(e) => set("deposit", e.target.value)} className={inputClass} />
          </Field>
        </div>
      </Card>

      <Card title="Facilities">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {FACILITIES.map(({ key, label }) => (
            <label key={key} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={flags[key]}
                onChange={(e) => setFlags((prev) => ({ ...prev, [key]: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              {label}
            </label>
          ))}
        </div>
        <Field label="Other amenities" htmlFor="p-amenities" hint="Separate with commas, for example: Study Room, Gym, RO Water">
          <input id="p-amenities" value={f.amenities} onChange={(e) => set("amenities", e.target.value)} className={inputClass} />
        </Field>
      </Card>

      <Card title="Details shown to students">
        <Field label="Water" htmlFor="p-water">
          <input id="p-water" maxLength={500} value={f.waterInfo} onChange={(e) => set("waterInfo", e.target.value)} className={inputClass} />
        </Field>
        <Field label="Rules" htmlFor="p-rules">
          <textarea id="p-rules" rows={3} maxLength={2000} value={f.rules} onChange={(e) => set("rules", e.target.value)} className={inputClass} />
        </Field>
        <Field label="Security information" htmlFor="p-security">
          <textarea id="p-security" rows={2} maxLength={1000} value={f.securityInfo} onChange={(e) => set("securityInfo", e.target.value)} className={inputClass} />
        </Field>
        <Field label="Nearby places" htmlFor="p-nearby">
          <textarea id="p-nearby" rows={2} maxLength={1000} value={f.nearbyPlaces} onChange={(e) => set("nearbyPlaces", e.target.value)} className={inputClass} />
        </Field>
        <p className="text-xs text-slate-500">
          Only enter information you have verified. Avoid claims like safe or 100% safe. Say what is actually present,
          such as CCTV in common areas.
        </p>
      </Card>

      {mode === "create" ? (
        <Card title="Rooms">
          <div className="space-y-3">
            {rooms.map((r, i) => (
              <div key={i} className="grid grid-cols-2 gap-3 sm:grid-cols-5 sm:items-end">
                <Field label="Room type" htmlFor={`r-type-${i}`}>
                  <select id={`r-type-${i}`} value={r.type} onChange={(e) => updateRoomDraft(i, { type: e.target.value as RoomType })} className={inputClass}>
                    {(Object.keys(ROOM_TYPE_LABEL) as RoomType[]).map((t) => (
                      <option key={t} value={t}>
                        {ROOM_TYPE_LABEL[t]}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Rent (₹)" htmlFor={`r-rent-${i}`}>
                  <input id={`r-rent-${i}`} inputMode="numeric" value={r.rent} onChange={(e) => updateRoomDraft(i, { rent: e.target.value })} className={inputClass} />
                </Field>
                <Field label="Total beds" htmlFor={`r-total-${i}`}>
                  <input id={`r-total-${i}`} inputMode="numeric" value={r.totalBeds} onChange={(e) => updateRoomDraft(i, { totalBeds: e.target.value })} className={inputClass} />
                </Field>
                <Field label="Available beds" htmlFor={`r-avail-${i}`}>
                  <input id={`r-avail-${i}`} inputMode="numeric" value={r.availableBeds} onChange={(e) => updateRoomDraft(i, { availableBeds: e.target.value })} className={inputClass} />
                </Field>
                <button
                  type="button"
                  onClick={() => setRooms((prev) => prev.filter((_, idx) => idx !== i))}
                  className="flex items-center justify-center gap-1 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" /> Remove
                </button>
              </div>
            ))}
          </div>
          {rooms.length < 20 && (
            <button
              type="button"
              onClick={() => setRooms((prev) => [...prev, { type: "DOUBLE", rent: "", totalBeds: "", availableBeds: "" }])}
              className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Plus className="h-4 w-4" /> Add another room type
            </button>
          )}
          <p className="text-xs text-slate-500">Students can only request a booking for room types listed here.</p>
        </Card>
      ) : (
        <p className="rounded-lg bg-indigo-50 p-3 text-sm text-indigo-800">
          Rooms and photos are managed in their own sections below this form.
        </p>
      )}

      <Card title="Visibility">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={f.isActive}
            onChange={(e) => set("isActive", e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          Active (visible to students in search and on its page)
        </label>
      </Card>

      <button
        type="submit"
        disabled={submitting}
        className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />} {submitLabel}
      </button>
    </form>
  );
}

"use client";

import { useState } from "react";
import { Loader2, Pencil, Plus } from "lucide-react";
import AdminHeader from "@/components/AdminHeader";
import EmptyState from "@/components/EmptyState";
import ErrorMessage from "@/components/ErrorMessage";
import LoadingSpinner from "@/components/LoadingSpinner";
import Modal from "@/components/Modal";
import { useAdminData } from "@/hooks/useAdminData";
import { AdminBuilding, createBuilding, fetchBuildings, updateBuilding } from "@/services/adminService";
import { getErrorMessage } from "@/services/api";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

function toNum(s: string): number | null {
  const t = s.trim();
  const n = Number(t);
  return t !== "" && Number.isFinite(n) ? n : null;
}

function BuildingModal({ building, onClose, onSaved }: { building: AdminBuilding | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(building?.name ?? "");
  const [address, setAddress] = useState(building?.address ?? "");
  const [city, setCity] = useState(building?.city ?? "");
  const [area, setArea] = useState(building?.area ?? "");
  const [pincode, setPincode] = useState(building?.pincode ?? "");
  const [lat, setLat] = useState(building ? String(building.latitude) : "");
  const [lng, setLng] = useState(building ? String(building.longitude) : "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const latitude = toNum(lat);
    const longitude = toNum(lng);
    if (name.trim().length < 2) return setError("Name must be at least 2 characters.");
    if (address.trim().length < 5) return setError("Address must be at least 5 characters.");
    if (city.trim().length < 2 || area.trim().length < 2) return setError("Please enter the city and area.");
    if (latitude === null || latitude < -90 || latitude > 90) return setError("Latitude must be between -90 and 90.");
    if (longitude === null || longitude < -180 || longitude > 180) return setError("Longitude must be between -180 and 180.");

    const input = {
      name: name.trim(),
      address: address.trim(),
      city: city.trim(),
      area: area.trim(),
      pincode: pincode.trim(),
      latitude,
      longitude,
    };

    setSaving(true);
    try {
      if (building) await updateBuilding(building.id, input);
      else await createBuilding(input);
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err));
      setSaving(false);
    }
  }

  return (
    <Modal title={building ? "Edit building" : "Add building"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <div>
          <label htmlFor="bd-name" className="mb-1.5 block text-sm font-medium text-slate-700">Building name</label>
          <input id="bd-name" maxLength={100} value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="bd-address" className="mb-1.5 block text-sm font-medium text-slate-700">Address</label>
          <input id="bd-address" maxLength={250} value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="bd-city" className="mb-1.5 block text-sm font-medium text-slate-700">City</label>
            <input id="bd-city" maxLength={60} value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="bd-area" className="mb-1.5 block text-sm font-medium text-slate-700">Area</label>
            <input id="bd-area" maxLength={60} value={area} onChange={(e) => setArea(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="bd-pin" className="mb-1.5 block text-sm font-medium text-slate-700">Pincode</label>
            <input id="bd-pin" maxLength={10} value={pincode} onChange={(e) => setPincode(e.target.value)} className={inputClass} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="bd-lat" className="mb-1.5 block text-sm font-medium text-slate-700">Latitude</label>
            <input id="bd-lat" inputMode="decimal" value={lat} onChange={(e) => setLat(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="bd-lng" className="mb-1.5 block text-sm font-medium text-slate-700">Longitude</label>
            <input id="bd-lng" inputMode="decimal" value={lng} onChange={(e) => setLng(e.target.value)} className={inputClass} />
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} {building ? "Save building" : "Create building"}
        </button>
      </form>
    </Modal>
  );
}

export default function AdminBuildingsPage() {
  const { data, error, reload } = useAdminData(fetchBuildings);
  const [editing, setEditing] = useState<AdminBuilding | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <>
      <AdminHeader
        title="Buildings"
        description="A building can contain several properties, for example a hostel and a PG in the same block."
        action={
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" /> Add building
          </button>
        }
      />

      {error ? (
        <ErrorMessage message={error} onRetry={reload} />
      ) : !data ? (
        <LoadingSpinner label="Loading buildings..." />
      ) : data.length === 0 ? (
        <EmptyState title="No buildings yet" description="Add one, then assign properties to it." />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {data.map((b) => (
            <li key={b.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-slate-900">{b.name}</h2>
                  <p className="text-sm text-slate-500">
                    {b.address}
                    {b.pincode ? ` - ${b.pincode}` : ""}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {b.area}, {b.city}
                  </p>
                </div>
                <button
                  onClick={() => setEditing(b)}
                  aria-label={`Edit ${b.name}`}
                  className="rounded-lg border border-slate-300 p-2 text-slate-600 hover:bg-slate-50"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                {b._count.properties} {b._count.properties === 1 ? "property" : "properties"} · {b.latitude}, {b.longitude}
              </p>
            </li>
          ))}
        </ul>
      )}

      {(creating || editing) && (
        <BuildingModal
          building={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            void reload();
          }}
        />
      )}
    </>
  );
}

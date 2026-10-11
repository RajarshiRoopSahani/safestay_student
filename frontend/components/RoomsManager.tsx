"use client";

import { useState } from "react";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { addRoom, deleteRoom, RoomInput, updateRoom } from "@/services/adminService";
import { getErrorMessage } from "@/services/api";
import { Room, RoomType } from "@/types";
import { ROOM_TYPE_LABEL } from "@/utils/format";

type Props = { propertyId: string; rooms: Room[]; onChanged: () => void | Promise<void> };

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

function toInt(s: string): number | null {
  return /^\d+$/.test(s.trim()) ? Number(s.trim()) : null;
}

type EditorProps = {
  initial: Room | null;
  busy: boolean;
  saveLabel: string;
  onSubmit: (values: RoomInput) => void;
  onDelete?: () => void;
  onCancel?: () => void;
};

function RoomEditor({ initial, busy, saveLabel, onSubmit, onDelete, onCancel }: EditorProps) {
  const [type, setType] = useState<RoomType>(initial?.type ?? "DOUBLE");
  const [rent, setRent] = useState(initial ? String(initial.rent) : "");
  const [total, setTotal] = useState(initial ? String(initial.totalBeds) : "");
  const [available, setAvailable] = useState(initial ? String(initial.availableBeds) : "");
  const [localError, setLocalError] = useState<string | null>(null);

  function submit() {
    setLocalError(null);
    const r = toInt(rent);
    const t = toInt(total);
    const a = toInt(available);
    if (r === null || t === null || a === null || t < 1) {
      setLocalError("Enter whole numbers (total beds must be at least 1).");
      return;
    }
    if (a > t) {
      setLocalError("Available beds cannot exceed total beds.");
      return;
    }
    onSubmit({ type, rent: r, totalBeds: t, availableBeds: a });
  }

  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Room type</label>
          <select value={type} onChange={(e) => setType(e.target.value as RoomType)} className={inputClass}>
            {(Object.keys(ROOM_TYPE_LABEL) as RoomType[]).map((t) => (
              <option key={t} value={t}>
                {ROOM_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Rent (₹)</label>
          <input inputMode="numeric" value={rent} onChange={(e) => setRent(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Total beds</label>
          <input inputMode="numeric" value={total} onChange={(e) => setTotal(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Available beds</label>
          <input inputMode="numeric" value={available} onChange={(e) => setAvailable(e.target.value)} className={inputClass} />
        </div>
      </div>
      {localError && <p className="mt-2 text-sm text-red-600">{localError}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={submit}
          className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {saveLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100">
            Cancel
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            disabled={busy}
            onClick={onDelete}
            className="ml-auto flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        )}
      </div>
    </div>
  );
}

export default function RoomsManager({ propertyId, rooms, onChanged }: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  async function run(key: string, action: () => Promise<void>): Promise<boolean> {
    setBusy(key);
    setError(null);
    try {
      await action();
      await onChanged();
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="text-base font-bold text-slate-900">Rooms</h2>
      <p className="mt-1 text-sm text-slate-500">
        Approving a booking lowers the available beds automatically, and cancelling an approved booking adds them back.
      </p>

      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-4 space-y-3">
        {rooms.length === 0 && !adding && <p className="text-sm text-slate-500">No rooms yet. Students cannot request a booking until you add one.</p>}

        {rooms.map((r) => (
          <RoomEditor
            key={`${r.id}-${r.type}-${r.rent}-${r.totalBeds}-${r.availableBeds}`}
            initial={r}
            busy={busy === r.id}
            saveLabel="Save changes"
            onSubmit={(values) => void run(r.id, () => updateRoom(r.id, values))}
            onDelete={() => {
              if (window.confirm("Delete this room type?")) void run(r.id, () => deleteRoom(r.id));
            }}
          />
        ))}

        {adding && (
          <RoomEditor
            initial={null}
            busy={busy === "new"}
            saveLabel="Add room"
            onSubmit={(values) =>
              void run("new", () => addRoom(propertyId, values)).then((ok) => {
                if (ok) setAdding(false);
              })
            }
            onCancel={() => setAdding(false)}
          />
        )}
      </div>

      {!adding && rooms.length < 20 && (
        <button
          onClick={() => setAdding(true)}
          className="mt-4 flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <Plus className="h-4 w-4" /> Add room type
        </button>
      )}
    </section>
  );
}

"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import Modal from "@/components/Modal";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/services/api";
import { createBooking } from "@/services/bookingService";
import { Room, RoomType } from "@/types";
import { formatRent, ROOM_TYPE_LABEL } from "@/utils/format";

type Props = { property: { id: string; name: string; rooms: Room[] }; onClose: () => void };

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

export default function BookingModal({ property, onClose }: Props) {
  const { user } = useAuth();

  // One option per room type, with the lowest rent and total free beds.
  const options = useMemo(() => {
    const map = new Map<RoomType, { rent: number; beds: number }>();
    for (const r of property.rooms) {
      const cur = map.get(r.type);
      map.set(r.type, {
        rent: cur ? Math.min(cur.rent, r.rent) : r.rent,
        beds: (cur?.beds ?? 0) + r.availableBeds,
      });
    }
    return Array.from(map, ([type, v]) => ({ type, ...v }));
  }, [property.rooms]);

  const [roomType, setRoomType] = useState<RoomType | "">(options.find((o) => o.beds > 0)?.type ?? "");
  const [moveInDate, setMoveInDate] = useState("");
  const [occupants, setOccupants] = useState(1);
  const [contactName, setContactName] = useState(user?.name ?? "");
  const [contactPhone, setContactPhone] = useState(user?.phone ?? "");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [doneMessage, setDoneMessage] = useState<string | null>(null);

  const selected = options.find((o) => o.type === roomType);
  const maxOccupants = Math.max(1, Math.min(10, selected?.beds ?? 1));
  const hasBeds = options.some((o) => o.beds > 0);

  const today = new Date().toISOString().slice(0, 10);
  const maxDate = new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!roomType) {
      setError("Please choose a room type.");
      return;
    }
    if (!/^[0-9+\-\s]{7,15}$/.test(contactPhone.trim())) {
      setError("Please enter a valid phone number (7 to 15 digits).");
      return;
    }

    setSubmitting(true);
    try {
      const res = await createBooking({
        propertyId: property.id,
        roomType,
        moveInDate,
        occupants,
        contactName: contactName.trim(),
        contactPhone: contactPhone.trim(),
        ...(note.trim() ? { note: note.trim() } : {}),
      });
      setDoneMessage(res.message);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title={`Request booking: ${property.name}`} onClose={onClose}>
      {doneMessage ? (
        <div className="space-y-4 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
          <p className="text-sm text-slate-700">{doneMessage}</p>
          <div className="flex justify-center gap-3">
            <Link
              href="/bookings"
              onClick={onClose}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              View my bookings
            </Link>
            <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
              Close
            </button>
          </div>
        </div>
      ) : !hasBeds ? (
        <p className="rounded-lg bg-slate-100 p-4 text-sm text-slate-700">
          No beds are currently listed as available at this property. Please check back later.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
            No payment is taken here. Your request is not a reservation until it is approved. Visit the property before
            paying anything.
          </p>

          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div>
            <label htmlFor="b-room" className="mb-1.5 block text-sm font-medium text-slate-700">Room type</label>
            <select
              id="b-room"
              value={roomType}
              onChange={(e) => {
                setRoomType(e.target.value as RoomType);
                setOccupants(1);
              }}
              className={inputClass}
            >
              {options.map((o) => (
                <option key={o.type} value={o.type} disabled={o.beds === 0}>
                  {ROOM_TYPE_LABEL[o.type]} · from {formatRent(o.rent)}/month ·{" "}
                  {o.beds > 0 ? `${o.beds} bed${o.beds > 1 ? "s" : ""} available` : "full"}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="b-date" className="mb-1.5 block text-sm font-medium text-slate-700">Move-in date</label>
              <input id="b-date" type="date" required min={today} max={maxDate} value={moveInDate} onChange={(e) => setMoveInDate(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label htmlFor="b-occ" className="mb-1.5 block text-sm font-medium text-slate-700">Occupants</label>
              <select id="b-occ" value={occupants} onChange={(e) => setOccupants(Number(e.target.value))} className={inputClass}>
                {Array.from({ length: maxOccupants }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="b-name" className="mb-1.5 block text-sm font-medium text-slate-700">Contact name</label>
              <input id="b-name" required minLength={2} maxLength={60} value={contactName} onChange={(e) => setContactName(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label htmlFor="b-phone" className="mb-1.5 block text-sm font-medium text-slate-700">Contact phone</label>
              <input id="b-phone" type="tel" required value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className={inputClass} />
            </div>
          </div>

          <div>
            <label htmlFor="b-note" className="mb-1.5 block text-sm font-medium text-slate-700">Note (optional)</label>
            <textarea id="b-note" rows={2} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />} Send request
          </button>
        </form>
      )}
    </Modal>
  );
}

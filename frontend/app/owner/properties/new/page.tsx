"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import RequireAuth from "@/components/RequireAuth";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/services/api";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

function NewPropertyContent() {
  const { user } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    type: "PG",
    description: "",
    address: "",
    city: "",
    area: "",
    pincode: "",
    latitude: "26.8467",
    longitude: "80.9462",
    rent: "",
    deposit: "",
  });

  const [wifi, setWifi] = useState(false);
  const [ac, setAc] = useState(false);
  const [cooler, setCooler] = useState(false);
  const [attachedBathroom, setAttachedBathroom] = useState(false);
  const [laundry, setLaundry] = useState(false);
  const [parking, setParking] = useState(false);
  const [cctv, setCctv] = useState(false);
  const [furnished, setFurnished] = useState(false);
  const [foodIncluded, setFoodIncluded] = useState(false);
  const [electricityIncluded, setElectricityIncluded] = useState(false);

  const [waterInfo, setWaterInfo] = useState("");
  const [rules, setRules] = useState("");
  const [securityInfo, setSecurityInfo] = useState("");
  const [nearbyPlaces, setNearbyPlaces] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  if (user.role !== "OWNER") {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-bold text-slate-900">
          Access denied
        </h1>
        <p className="mt-2 text-slate-600">
          Only property owners can add properties.
        </p>
      </main>
    );
  }

  function updateField(
    field: keyof typeof form,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.description.trim().length < 10) {
      setError("Description must be at least 10 characters.");
      return;
    }

    if (!form.rent || Number(form.rent) < 0) {
      setError("Please enter a valid rent.");
      return;
    }

    if (!form.deposit || Number(form.deposit) < 0) {
      setError("Please enter a valid security deposit.");
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem("safestay_token");

      if (!token) {
        throw new Error("Please log in again.");
      }

      const response = await fetch(`${API_URL}/api/properties`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name.trim(),
          type: form.type,
          description: form.description.trim(),
          address: form.address.trim(),
          city: form.city.trim(),
          area: form.area.trim(),
          ...(form.pincode.trim()
            ? { pincode: form.pincode.trim() }
            : {}),
          latitude: Number(form.latitude),
          longitude: Number(form.longitude),
          rent: Number(form.rent),
          deposit: Number(form.deposit),

          foodIncluded,
          wifi,
          ac,
          cooler,
          attachedBathroom,
          laundry,
          parking,
          cctv,
          furnished,
          electricityIncluded,

          ...(waterInfo.trim()
            ? { waterInfo: waterInfo.trim() }
            : {}),
          ...(rules.trim() ? { rules: rules.trim() } : {}),
          ...(securityInfo.trim()
            ? { securityInfo: securityInfo.trim() }
            : {}),
          ...(nearbyPlaces.trim()
            ? { nearbyPlaces: nearbyPlaces.trim() }
            : {}),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error || "Failed to create property."
        );
      }

      router.push("/owner");
    } catch (err) {
      setError(getErrorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <button
          type="button"
          onClick={() => router.push("/owner")}
          className="text-sm font-medium text-indigo-600 hover:underline"
        >
          ← Back to Owner Dashboard
        </button>

        <h1 className="mt-4 text-3xl font-bold text-slate-900">
          Add Property
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          Add your student accommodation details.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {error && (
          <div
            role="alert"
            className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Basic information
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Property name
              </label>
              <input
                required
                minLength={2}
                maxLength={100}
                value={form.name}
                onChange={(e) =>
                  updateField("name", e.target.value)
                }
                placeholder="Example: Scholar Stay"
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Property type
              </label>
              <select
                value={form.type}
                onChange={(e) =>
                  updateField("type", e.target.value)
                }
                className={inputClass}
              >
                <option value="PG">PG</option>
                <option value="HOSTEL">Hostel</option>
                <option value="ROOM">Room</option>
                <option value="FLAT">Flat</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Area
              </label>
              <input
                required
                value={form.area}
                onChange={(e) =>
                  updateField("area", e.target.value)
                }
                placeholder="Example: Gomti Nagar"
                className={inputClass}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Description
              </label>
              <textarea
                required
                minLength={10}
                maxLength={3000}
                rows={5}
                value={form.description}
                onChange={(e) =>
                  updateField(
                    "description",
                    e.target.value
                  )
                }
                placeholder="Describe your property..."
                className={inputClass}
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Location
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Full address
              </label>
              <input
                required
                value={form.address}
                onChange={(e) =>
                  updateField("address", e.target.value)
                }
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                City
              </label>
              <input
                required
                value={form.city}
                onChange={(e) =>
                  updateField("city", e.target.value)
                }
                placeholder="Lucknow"
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Pincode
              </label>
              <input
                value={form.pincode}
                onChange={(e) =>
                  updateField("pincode", e.target.value)
                }
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Latitude
              </label>
              <input
                required
                type="number"
                step="any"
                value={form.latitude}
                onChange={(e) =>
                  updateField(
                    "latitude",
                    e.target.value
                  )
                }
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Longitude
              </label>
              <input
                required
                type="number"
                step="any"
                value={form.longitude}
                onChange={(e) =>
                  updateField(
                    "longitude",
                    e.target.value
                  )
                }
                className={inputClass}
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Rent
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Monthly rent (₹)
              </label>
              <input
                required
                type="number"
                min="0"
                value={form.rent}
                onChange={(e) =>
                  updateField("rent", e.target.value)
                }
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Security deposit (₹)
              </label>
              <input
                required
                type="number"
                min="0"
                value={form.deposit}
                onChange={(e) =>
                  updateField(
                    "deposit",
                    e.target.value
                  )
                }
                className={inputClass}
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Amenities
          </h2>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              ["Wi-Fi", wifi, setWifi],
              ["AC", ac, setAc],
              ["Cooler", cooler, setCooler],
              [
                "Attached Bathroom",
                attachedBathroom,
                setAttachedBathroom,
              ],
              ["Laundry", laundry, setLaundry],
              ["Parking", parking, setParking],
              ["CCTV", cctv, setCctv],
              ["Furnished", furnished, setFurnished],
              [
                "Food Included",
                foodIncluded,
                setFoodIncluded,
              ],
              [
                "Electricity Included",
                electricityIncluded,
                setElectricityIncluded,
              ],
            ].map(([label, checked, setter]) => (
              <label
                key={label as string}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={checked as boolean}
                  onChange={(e) =>
                    (setter as React.Dispatch<
                      React.SetStateAction<boolean>
                    >)(e.target.checked)
                  }
                  className="h-4 w-4"
                />
                <span className="text-sm text-slate-700">
                  {label as string}
                </span>
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Additional information
          </h2>

          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Water information
              </label>
              <textarea
                rows={3}
                value={waterInfo}
                onChange={(e) =>
                  setWaterInfo(e.target.value)
                }
                className={inputClass}
                placeholder="Example: 24-hour water supply"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Property rules
              </label>
              <textarea
                rows={3}
                value={rules}
                onChange={(e) =>
                  setRules(e.target.value)
                }
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Security information
              </label>
              <textarea
                rows={3}
                value={securityInfo}
                onChange={(e) =>
                  setSecurityInfo(e.target.value)
                }
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Nearby places
              </label>
              <textarea
                rows={3}
                value={nearbyPlaces}
                onChange={(e) =>
                  setNearbyPlaces(e.target.value)
                }
                className={inputClass}
                placeholder="College, metro station, market, etc."
              />
            </div>
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push("/owner")}
            className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {submitting
              ? "Creating..."
              : "Create Property"}
          </button>
        </div>
      </form>
    </main>
  );
}

export default function NewPropertyPage() {
  return (
    <RequireAuth>
      <NewPropertyContent />
    </RequireAuth>
  );
}
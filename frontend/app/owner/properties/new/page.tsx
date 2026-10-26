"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RequireAuth from "@/components/RequireAuth";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/services/api";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

type ApiResult = {
  id?: string;
  propertyId?: string;
  property?: { id?: string; propertyId?: string };
  data?: {
    id?: string;
    propertyId?: string;
    property?: { id?: string; propertyId?: string };
  };
  message?: string;
  error?: string;
};

function getPropertyId(result: ApiResult): string | null {
  const ids = [
    result.property?.id,
    result.property?.propertyId,
    result.id,
    result.propertyId,
    result.data?.property?.id,
    result.data?.property?.propertyId,
    result.data?.id,
    result.data?.propertyId,
  ];

  return ids.find((id) => typeof id === "string" && id.trim()) ?? null;
}

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

  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!selectedPhoto) {
      setPhotoPreview(null);
      return;
    }

    const url = URL.createObjectURL(selectedPhoto);
    setPhotoPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [selectedPhoto]);

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handlePhotoChange(file: File | null) {
    setError("");
    setSelectedPhoto(null);

    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Sirf JPG, PNG ya WebP photo select karein.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Photo ka size 5 MB se kam hona chahiye.");
      return;
    }

    setSelectedPhoto(file);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setNotice("");

    if (form.name.trim().length < 2) {
      setError("Property name kam se kam 2 characters ka hona chahiye.");
      return;
    }

    if (form.description.trim().length < 10) {
      setError("Description kam se kam 10 characters ka likhein.");
      return;
    }

    if (!form.rent || Number(form.rent) < 0) {
      setError("Valid monthly rent enter karein.");
      return;
    }

    if (form.deposit === "" || Number(form.deposit) < 0) {
      setError("Valid security deposit enter karein.");
      return;
    }

    const token = localStorage.getItem("safestay_token");

    if (!token) {
      setError("Login session nahi mila. Dobara login karein.");
      return;
    }

    setSubmitting(true);

    try {
      // Property pehle create hogi.
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
          wifi,
          ac,
          cooler,
          attachedBathroom,
          laundry,
          parking,
          cctv,
          furnished,
          foodIncluded,
          electricityIncluded,
          ...(waterInfo.trim() ? { waterInfo: waterInfo.trim() } : {}),
          ...(rules.trim() ? { rules: rules.trim() } : {}),
          ...(securityInfo.trim()
            ? { securityInfo: securityInfo.trim() }
            : {}),
          ...(nearbyPlaces.trim()
            ? { nearbyPlaces: nearbyPlaces.trim() }
            : {}),
        }),
      });

      const result = (await response.json().catch(() => ({}))) as ApiResult;

      if (!response.ok) {
        throw new Error(
          result.error || result.message || "Property create nahi hui."
        );
      }

      const propertyId = getPropertyId(result);

      if (!propertyId) {
        setNotice(
          "Property response mein ID nahi mili. Owner dashboard check karein. Dobara form submit na karein."
        );
        return;
      }

      // Property create hone ke baad photo upload hogi.
      if (selectedPhoto) {
        const photoForm = new FormData();
        photoForm.append("photo", selectedPhoto);
        photoForm.append("category", "BUILDING");
        photoForm.append("official", "false");

        const photoResponse = await fetch(
          `${API_URL}/api/properties/${encodeURIComponent(propertyId)}/photos`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: photoForm,
          }
        );

        const photoResult = (await photoResponse
          .json()
          .catch(() => ({}))) as ApiResult;

        if (!photoResponse.ok) {
          setNotice(
            `Property create ho gayi, lekin photo upload fail hua: ${
              photoResult.error ||
              photoResult.message ||
              `HTTP ${photoResponse.status}`
            }. Property dobara create na karein.`
          );
          return;
        }

        setNotice(
          photoResult.message ||
            "Photo upload ho gayi. Approval ke baad public page par dikhegi."
        );
      } else {
        setNotice("Property successfully create ho gayi.");
      }

      router.push("/owner");
      router.refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) return null;

  const role = String(user.role).toUpperCase();

if (role !== "OWNER" && role !== "ADMIN") {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-bold text-slate-900">Access denied</h1>
        <p className="mt-2 text-slate-600">
          Only property owners or admins can add properties.
        </p>
      </main>
    );
  }

  const amenities = [
    { label: "Wi-Fi", checked: wifi, change: setWifi },
    { label: "AC", checked: ac, change: setAc },
    { label: "Cooler", checked: cooler, change: setCooler },
    {
      label: "Attached bathroom",
      checked: attachedBathroom,
      change: setAttachedBathroom,
    },
    { label: "Laundry", checked: laundry, change: setLaundry },
    { label: "Parking", checked: parking, change: setParking },
    { label: "CCTV", checked: cctv, change: setCctv },
    { label: "Furnished", checked: furnished, change: setFurnished },
    {
      label: "Food included",
      checked: foodIncluded,
      change: setFoodIncluded,
    },
    {
      label: "Electricity included",
      checked: electricityIncluded,
      change: setElectricityIncluded,
    },
  ];

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
          Property details aur photo add karein.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div
            role="alert"
            className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900"
          >
            {notice}
          </div>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Basic information
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label
                htmlFor="property-name"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Property name
              </label>
              <input
                id="property-name"
                required
                minLength={2}
                maxLength={100}
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Example: Scholar Stay"
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="property-type"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Property type
              </label>
              <select
                id="property-type"
                value={form.type}
                onChange={(e) => updateField("type", e.target.value)}
                className={inputClass}
              >
                <option value="PG">PG</option>
                <option value="HOSTEL">Hostel</option>
                <option value="ROOM">Room</option>
                <option value="FLAT">Flat</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="property-area"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Area
              </label>
              <input
                id="property-area"
                required
                value={form.area}
                onChange={(e) => updateField("area", e.target.value)}
                placeholder="Example: Gomti Nagar"
                className={inputClass}
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="property-description"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Description
              </label>
              <textarea
                id="property-description"
                required
                minLength={10}
                maxLength={3000}
                rows={5}
                value={form.description}
                onChange={(e) =>
                  updateField("description", e.target.value)
                }
                placeholder="Describe your property..."
                className={inputClass}
              />
            </div>

            {/* Property photo upload */}
            <div className="sm:col-span-2">
              <label
                htmlFor="property-photo"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Property photo (optional)
              </label>

              <input
                id="property-photo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) =>
                  handlePhotoChange(e.target.files?.[0] ?? null)
                }
                className={inputClass}
              />

              <p className="mt-1 text-xs text-slate-500">
                JPG, PNG ya WebP; maximum 5 MB. Photo review ke baad public
                page par dikhegi.
              </p>

              {photoPreview && (
                <img
                  src={photoPreview}
                  alt="Selected property preview"
                  className="mt-3 h-56 w-full rounded-xl border border-slate-200 object-cover"
                />
              )}

              {selectedPhoto && (
                <p className="mt-2 text-sm text-slate-600">
                  Selected: {selectedPhoto.name}
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Location</h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label
                htmlFor="property-address"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Full address
              </label>
              <input
                id="property-address"
                required
                value={form.address}
                onChange={(e) => updateField("address", e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="property-city"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                City
              </label>
              <input
                id="property-city"
                required
                value={form.city}
                onChange={(e) => updateField("city", e.target.value)}
                placeholder="Lucknow"
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="property-pincode"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Pincode
              </label>
              <input
                id="property-pincode"
                value={form.pincode}
                onChange={(e) => updateField("pincode", e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="property-latitude"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Latitude
              </label>
              <input
                id="property-latitude"
                required
                type="number"
                step="any"
                value={form.latitude}
                onChange={(e) => updateField("latitude", e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="property-longitude"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Longitude
              </label>
              <input
                id="property-longitude"
                required
                type="number"
                step="any"
                value={form.longitude}
                onChange={(e) => updateField("longitude", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Rent</h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="property-rent"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Monthly rent (₹)
              </label>
              <input
                id="property-rent"
                required
                type="number"
                min="0"
                value={form.rent}
                onChange={(e) => updateField("rent", e.target.value)}
                placeholder="6000"
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="property-deposit"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Security deposit (₹)
              </label>
              <input
                id="property-deposit"
                required
                type="number"
                min="0"
                value={form.deposit}
                onChange={(e) => updateField("deposit", e.target.value)}
                placeholder="6000"
                className={inputClass}
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Amenities</h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {amenities.map((amenity) => (
              <label
                key={amenity.label}
                className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm text-slate-700"
              >
                <input
                  type="checkbox"
                  checked={amenity.checked}
                  onChange={(e) => amenity.change(e.target.checked)}
                  className="h-4 w-4"
                />
                {amenity.label}
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Additional information
          </h2>

          <div className="mt-5 grid gap-4">
            <div>
              <label
                htmlFor="water-info"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Water information
              </label>
              <textarea
                id="water-info"
                rows={2}
                value={waterInfo}
                onChange={(e) => setWaterInfo(e.target.value)}
                className={inputClass}
                placeholder="Water supply details"
              />
            </div>

            <div>
              <label
                htmlFor="property-rules"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Property rules
              </label>
              <textarea
                id="property-rules"
                rows={2}
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                className={inputClass}
                placeholder="Mention property rules"
              />
            </div>

            <div>
              <label
                htmlFor="security-info"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Security information
              </label>
              <textarea
                id="security-info"
                rows={2}
                value={securityInfo}
                onChange={(e) => setSecurityInfo(e.target.value)}
                className={inputClass}
                placeholder="Security arrangements"
              />
            </div>

            <div>
              <label
                htmlFor="nearby-places"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Nearby places
              </label>
              <textarea
                id="nearby-places"
                rows={2}
                value={nearbyPlaces}
                onChange={(e) => setNearbyPlaces(e.target.value)}
                className={inputClass}
                placeholder="College, market, bus stop, etc."
              />
            </div>
          </div>
        </section>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => router.push("/owner")}
            className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Saving property..." : "Save Property"}
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
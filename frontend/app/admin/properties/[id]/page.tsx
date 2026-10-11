"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { ArrowLeft, ExternalLink, Trash2 } from "lucide-react";
import AdminHeader from "@/components/AdminHeader";
import ErrorMessage from "@/components/ErrorMessage";
import LoadingSpinner from "@/components/LoadingSpinner";
import OfficialPhotosManager from "@/components/OfficialPhotosManager";
import PropertyForm from "@/components/PropertyForm";
import RoomsManager from "@/components/RoomsManager";
import StatusBadge from "@/components/StatusBadge";
import { useAdminData } from "@/hooks/useAdminData";
import { deleteProperty, fetchBuildings, PropertyPayload, updateProperty } from "@/services/adminService";
import { getErrorMessage } from "@/services/api";
import { fetchProperty } from "@/services/propertyService";

export default function EditPropertyPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetcher = useCallback(async () => {
    const [detail, buildings] = await Promise.all([fetchProperty(id), fetchBuildings()]);
    return { property: detail.property, buildings };
  }, [id]);
  const { data, error, reload } = useAdminData(fetcher);

  async function handleSubmit(payload: PropertyPayload) {
    setSaved(false);
    await updateProperty(id, payload);
    setSaved(true);
    await reload();
  }

  async function handleDelete() {
    if (!data) return;
    const msg = `Permanently delete "${data.property.name}"?\n\nThis also deletes its rooms, reviews, photos, bookings and reports. This cannot be undone.`;
    if (!window.confirm(msg)) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteProperty(id);
      router.push("/admin/properties");
    } catch (err) {
      setDeleteError(getErrorMessage(err));
      setDeleting(false);
    }
  }

  return (
    <>
      <Link href="/admin/properties" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-indigo-600">
        <ArrowLeft className="h-4 w-4" /> Back to properties
      </Link>

      {error ? (
        <ErrorMessage message={error} onRetry={reload} />
      ) : !data ? (
        <LoadingSpinner label="Loading property..." />
      ) : (
        <div className="space-y-6">
          <AdminHeader
            title={data.property.name}
            description="Edit the listing, rooms and official photos."
            action={
              <div className="flex items-center gap-3">
                <StatusBadge status={data.property.isActive ? "ACTIVE" : "INACTIVE"} />
                <Link
                  href={`/property/${id}`}
                  className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <ExternalLink className="h-4 w-4" /> View public page
                </Link>
              </div>
            }
          />

          {saved && (
            <p role="status" className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Changes saved.
            </p>
          )}

          <PropertyForm
            key={data.property.id}
            mode="edit"
            initial={data.property}
            buildings={data.buildings}
            submitLabel="Save changes"
            onSubmit={handleSubmit}
          />

          <RoomsManager propertyId={id} rooms={data.property.rooms} onChanged={reload} />
          <OfficialPhotosManager propertyId={id} photos={data.property.officialPhotos} onChanged={reload} />

          <section className="rounded-2xl border border-red-200 bg-white p-5 sm:p-6">
            <h2 className="text-base font-bold text-red-700">Danger zone</h2>
            <p className="mt-1 text-sm text-slate-600">
              Deleting removes this property and everything attached to it. To hide it without losing data, untick
              Active above and save instead.
            </p>
            {deleteError && (
              <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {deleteError}
              </p>
            )}
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="mt-4 flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" /> Delete property
            </button>
          </section>
        </div>
      )}
    </>
  );
}

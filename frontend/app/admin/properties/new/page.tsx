"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import AdminHeader from "@/components/AdminHeader";
import ErrorMessage from "@/components/ErrorMessage";
import LoadingSpinner from "@/components/LoadingSpinner";
import PropertyForm from "@/components/PropertyForm";
import { useAdminData } from "@/hooks/useAdminData";
import { createProperty, fetchBuildings, PropertyPayload } from "@/services/adminService";

export default function NewPropertyPage() {
  const router = useRouter();
  const { data: buildings, error, reload } = useAdminData(fetchBuildings);

  async function handleSubmit(payload: PropertyPayload) {
    const { id } = await createProperty(payload);
    router.push(`/admin/properties/${id}`);
  }

  return (
    <>
      <Link href="/admin/properties" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-indigo-600">
        <ArrowLeft className="h-4 w-4" /> Back to properties
      </Link>
      <AdminHeader title="Add property" description="Fill in the details. You can add official photos after saving." />

      {error ? (
        <ErrorMessage message={error} onRetry={reload} />
      ) : !buildings ? (
        <LoadingSpinner />
      ) : (
        <PropertyForm mode="create" buildings={buildings} submitLabel="Create property" onSubmit={handleSubmit} />
      )}
    </>
  );
}

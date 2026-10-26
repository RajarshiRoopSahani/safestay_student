"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CalendarCheck,
  Camera,
  Heart,
  LogOut,
  ShieldCheck,
} from "lucide-react";

import RequireAuth from "@/components/RequireAuth";
import StatusBadge from "@/components/StatusBadge";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/services/api";
import { fetchMyPhotos } from "@/services/photoService";
import { MyPhoto } from "@/types";
import { formatDate, PHOTO_CATEGORY_LABEL } from "@/utils/format";

function ProfileContent() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [photos, setPhotos] = useState<MyPhoto[] | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  useEffect(() => {
    fetchMyPhotos()
      .then(setPhotos)
      .catch((err) => setPhotoError(getErrorMessage(err)));
  }, []);

  if (!user) return null;

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900">
        Your profile
      </h1>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <dl className="grid gap-4 sm:grid-cols-2">
          {/* Name */}
          <div>
            <dt className="text-sm text-slate-500">Name</dt>
            <dd className="font-medium text-slate-900">
              {user.name}
            </dd>
          </div>

          {/* Email */}
          <div>
            <dt className="text-sm text-slate-500">Email</dt>
            <dd className="font-medium text-slate-900">
              {user.email}
            </dd>
          </div>

          {/* Phone */}
          <div>
            <dt className="text-sm text-slate-500">Phone</dt>
            <dd className="font-medium text-slate-900">
              {user.phone || "Not provided"}
            </dd>
          </div>

          {/* Account Type */}
          <div>
            <dt className="text-sm text-slate-500">Account type</dt>
            <dd className="font-medium text-slate-900">
             {String(user.role).toUpperCase() === "OWNER"
  ? "Property Owner"
  : String(user.role).toUpperCase() === "ADMIN"
    ? "Admin"
    : "Student"}
            </dd>
          </div>

          {/* Member Since */}
          <div>
            <dt className="text-sm text-slate-500">Member since</dt>
            <dd className="font-medium text-slate-900">
              {formatDate(user.createdAt)}
            </dd>
          </div>
        </dl>

        <p className="mt-4 rounded-lg bg-indigo-50 p-3 text-sm text-indigo-800">
          Your name, email and phone are never shown on reviews or community
          photos.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          {/* My Bookings */}
          <Link
            href="/bookings"
            className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <CalendarCheck className="h-4 w-4" />
            My bookings
          </Link>

          {/* Saved Properties */}
          <Link
            href="/favorites"
            className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Heart className="h-4 w-4" />
            Saved properties
          </Link>

          {/* Admin Panel */}
          {user.role === "ADMIN" && (
            <Link
              href="/admin"
              className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
            >
              <ShieldCheck className="h-4 w-4" />
              Admin panel
            </Link>
          )}

          {/* Owner Dashboard */}
          {String(user.role).toUpperCase() === "OWNER" && (
            <Link
              href="/owner"
              className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
            >
              <ShieldCheck className="h-4 w-4" />
              Owner Dashboard
            </Link>
          )}

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </section>

      {/* Photo Uploads */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <Camera className="h-5 w-5 text-indigo-600" />
          Your photo uploads
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Only you can see this list. Pending photos are visible to others
          only after a moderator approves them.
        </p>

        {photoError ? (
          <p
            role="alert"
            className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {photoError}
          </p>
        ) : photos === null ? (
          <p className="mt-4 text-sm text-slate-500">
            Loading...
          </p>
        ) : photos.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-slate-300 py-8 text-center text-sm text-slate-500">
            You have not uploaded any photos yet.
          </p>
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {photos.map((p) => (
              <li
                key={p.id}
                className="overflow-hidden rounded-xl border border-slate-200"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.url}
                  alt={`${PHOTO_CATEGORY_LABEL[p.category]} upload`}
                  className="aspect-[16/10] w-full object-cover"
                  loading="lazy"
                />

                <div className="flex items-center justify-between gap-2 p-3">
                  <div className="min-w-0">
                    <Link
                      href={`/property/${p.property.id}`}
                      className="block truncate text-sm font-medium text-slate-900 hover:text-indigo-600"
                    >
                      {p.property.name}
                    </Link>

                    <p className="text-xs text-slate-500">
                      {PHOTO_CATEGORY_LABEL[p.category]} ·{" "}
                      {formatDate(p.createdAt)}
                    </p>
                  </div>

                  <StatusBadge status={p.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <RequireAuth>
      <ProfileContent />
    </RequireAuth>
  );
}
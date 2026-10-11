"use client";

import Link from "next/link";
import axios from "axios";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarCheck,
  ExternalLink,
  Flag,
  Heart,
  MapPin,
  Navigation,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

import AIRecommendationCard from "@/components/AIRecommendationCard";
import AmenityList from "@/components/AmenityList";
import BookingModal from "@/components/BookingModal";
import CommunityPhotoGallery from "@/components/CommunityPhotoGallery";
import EmptyState from "@/components/EmptyState";
import ErrorMessage from "@/components/ErrorMessage";
import LoadingSpinner from "@/components/LoadingSpinner";
import PhotoGallery from "@/components/PhotoGallery";
import PropertyGrid from "@/components/PropertyGrid";
import RatingStars from "@/components/RatingStars";
import ReportModal from "@/components/ReportModal";
import ReviewsSection from "@/components/ReviewsSection";
import { useFavorites } from "@/hooks/useFavorites";
import { useRequireLogin } from "@/hooks/useRequireLogin";
import { getErrorMessage } from "@/services/api";
import { fetchProperty } from "@/services/propertyService";
import { PropertyDetailResponse } from "@/types";
import {
  formatRent,
  PROPERTY_TYPE_LABEL,
  ROOM_TYPE_LABEL,
} from "@/utils/format";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6">
      <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

const secondaryButton =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800";

export default function PropertyPage() {
  const { id } = useParams<{ id: string }>();
  const requireLogin = useRequireLogin();
  const { isFavorite, toggle } = useFavorites();

  const [data, setData] = useState<PropertyDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{
    message: string;
    notFound: boolean;
  } | null>(null);
  const [booking, setBooking] = useState(false);
  const [reporting, setReporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setData(await fetchProperty(id));
    } catch (err) {
      setError({
        message: getErrorMessage(err),
        notFound:
          axios.isAxiosError(err) && err.response?.status === 404,
      });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !data) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <LoadingSpinner label="Loading property..." />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        {error?.notFound ? (
          <EmptyState
            title="Property not found"
            description="It may have been removed or is no longer listed."
            actionLabel="Back to search"
            actionHref="/search"
          />
        ) : (
          <ErrorMessage
            message={error?.message ?? "Something went wrong."}
            onRetry={load}
          />
        )}
      </div>
    );
  }

  const p = data.property;
  const fav = isFavorite(p.id);
  const full = p.availableBeds === 0;

  const info = [
    { label: "Water", value: p.waterInfo },
    {
      label: "Electricity",
      value: p.electricityIncluded
        ? "Included in the rent"
        : "Not listed as included",
    },
    { label: "Rules", value: p.rules },
    { label: "Security information", value: p.securityInfo },
    { label: "Nearby places", value: p.nearbyPlaces },
  ];

  return (
    <main className="min-h-screen bg-slate-50/70">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-9 lg:px-8">
        {/* Back navigation */}
        <Link
          href="/search"
          className="inline-flex items-center gap-2 rounded-lg py-2 text-sm font-semibold text-slate-600 transition hover:text-teal-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to search
        </Link>

        {!p.isActive && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <p>
              This property is deactivated and hidden from students. You can
              see it because you are an admin.
            </p>
          </div>
        )}

        {/* Property heading */}
        <header className="mt-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-800">
                  {PROPERTY_TYPE_LABEL[p.type]}
                </span>

                {p.isDemo && (
                  <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
                    Demo listing
                  </span>
                )}

                {p.isActive && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Active listing
                  </span>
                )}
              </div>

              <h1 className="mt-4 break-words text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                {p.name}
              </h1>

              <p className="mt-3 flex items-start gap-2 text-sm leading-6 text-slate-600 sm:text-base">
                <MapPin className="mt-1 h-5 w-5 shrink-0 text-teal-700" />
                <span>
                  {p.address}
                  {p.pincode ? ` - ${p.pincode}` : ""}
                </span>
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <RatingStars
                  rating={p.rating}
                  reviewCount={p.reviewCount}
                  size="md"
                />
                <a
                  href="#reviews"
                  className="text-sm font-semibold text-teal-800 underline-offset-4 hover:underline"
                >
                  Read reviews
                </a>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              <button
                type="button"
                onClick={() => toggle(p.id)}
                aria-label={
                  fav ? "Remove from favorites" : "Save to favorites"
                }
                aria-pressed={fav}
                className={secondaryButton}
              >
                <Heart
                  className={`h-4 w-4 ${
                    fav ? "fill-rose-500 text-rose-500" : ""
                  }`}
                />
                {fav ? "Saved" : "Save"}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (requireLogin()) setReporting(true);
                }}
                className={secondaryButton}
              >
                <Flag className="h-4 w-4" />
                Report
              </button>
            </div>
          </div>
        </header>

        {/* Main property content */}
        <div className="mt-6 grid items-start gap-6 lg:grid-cols-3">
          <div className="min-w-0 space-y-6 lg:col-span-2">
            {/* Official property photos */}
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-2 shadow-sm sm:p-3">
              <PhotoGallery photos={p.officialPhotos} name={p.name} />
            </div>

            <Section title="About this property">
              <p className="whitespace-pre-line text-sm leading-7 text-slate-600 sm:text-base">
                {p.description || "No description has been added yet."}
              </p>

              {p.building && (
                <div className="mt-5 rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Building
                  </p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {p.building.name}
                  </p>
                </div>
              )}
            </Section>

            <Section title="Facilities and amenities">
              <AmenityList property={p} />
            </Section>

            <Section title="Rooms and availability">
              {p.rooms.length === 0 ? (
                <p className="text-sm leading-6 text-slate-500">
                  No room details have been listed yet.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full min-w-[420px] text-left text-sm">
                    <thead className="bg-slate-50">
                      <tr className="border-b border-slate-200 text-slate-600">
                        <th className="px-4 py-3 font-semibold">
                          Room type
                        </th>
                        <th className="px-4 py-3 font-semibold">
                          Rent / month
                        </th>
                        <th className="px-4 py-3 font-semibold">
                          Available beds
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {p.rooms.map((r) => (
                        <tr
                          key={r.id}
                          className="border-b border-slate-100 last:border-0"
                        >
                          <td className="px-4 py-4 font-semibold text-slate-800">
                            {ROOM_TYPE_LABEL[r.type]}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-800">
                            {formatRent(r.rent)}
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${
                                r.availableBeds > 0
                                  ? "bg-emerald-50 text-emerald-800"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {r.availableBeds > 0
                                ? `${r.availableBeds} of ${r.totalBeds}`
                                : "Full"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="mt-3 text-xs text-slate-500">
                Confirm room availability and rent with the property team
                before making a decision.
              </p>
            </Section>

            <Section title="Good to know">
              <dl className="divide-y divide-slate-100">
                {info.map(({ label, value }) => (
                  <div
                    key={label}
                    className="grid gap-1 py-4 first:pt-0 last:pb-0 sm:grid-cols-[180px_1fr] sm:gap-4"
                  >
                    <dt className="text-sm font-semibold text-slate-800">
                      {label}
                    </dt>
                    <dd className="whitespace-pre-line text-sm leading-6 text-slate-600">
                      {value || "Not provided"}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="mt-5 rounded-xl border border-amber-100 bg-amber-50 p-4">
                <p className="text-xs leading-5 text-amber-900">
                  These details are provided by the listing and are not
                  verified by SafeStay. Visit the property and confirm the
                  details before paying.
                </p>
              </div>
            </Section>

            {/* Community-submitted photos */}
            <CommunityPhotoGallery
              propertyId={p.id}
              photos={p.communityPhotos}
              notice={data.notice}
            />

            {/* Reviews */}
            <div id="reviews" className="scroll-mt-24">
              <ReviewsSection propertyId={p.id} />
            </div>
          </div>

          {/* Booking and location sidebar */}
          <aside className="min-w-0 space-y-5 lg:sticky lg:top-24">
            <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
              <div className="bg-gradient-to-br from-teal-800 to-slate-900 p-5 text-white sm:p-6">
                <p className="text-sm font-medium text-teal-100">
                  Monthly rent starting at
                </p>

                <p className="mt-2 break-words text-3xl font-extrabold tracking-tight sm:text-4xl">
                  {formatRent(p.rent)}
                  <span className="text-sm font-medium text-teal-100">
                    {" "}/ month
                  </span>
                </p>

                <div className="mt-4 flex items-center gap-2 text-sm text-teal-50">
                  <CalendarCheck className="h-4 w-4 shrink-0" />
                  <span>
                    {full
                      ? "Currently full"
                      : `${p.availableBeds} bed${
                          p.availableBeds === 1 ? "" : "s"
                        } available`}
                  </span>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <span className="text-sm text-slate-500">
                    Security deposit
                  </span>
                  <span className="text-right text-sm font-bold text-slate-800">
                    {formatRent(p.deposit)}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={full || !p.isActive}
                  onClick={() => {
                    if (requireLogin()) setBooking(true);
                  }}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <CalendarCheck className="h-4 w-4" />
                  {!p.isActive
                    ? "Listing unavailable"
                    : full
                      ? "No beds available"
                      : "Request booking"}
                </button>

                <div className="mt-4 flex items-start gap-2 rounded-xl bg-slate-50 p-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
                  <p className="text-xs leading-5 text-slate-600">
                    No online payment is collected here. Your booking request
                    goes to the team for review. Always visit and verify
                    before paying.
                  </p>
                </div>
              </div>
            </section>

            <AIRecommendationCard
              propertyId={p.id}
              propertyName={p.name}
              roomTypes={p.roomTypes}
              colleges={data.nearbyColleges}
            />

            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-teal-700" />
                <h2 className="text-lg font-bold text-slate-900">
                  Location
                </h2>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                {p.area}, {p.city}
              </p>

              <a
                href={`https://www.google.com/maps/search/?api=1&query=${p.latitude},${p.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-800 transition hover:bg-teal-100"
              >
                Open in Google Maps
                <ExternalLink className="h-4 w-4" />
              </a>

              {data.nearbyColleges.length > 0 && (
                <div className="mt-5 border-t border-slate-100 pt-5">
                  <h3 className="text-sm font-bold text-slate-800">
                    Nearby colleges
                  </h3>

                  <ul className="mt-3 space-y-3">
                    {data.nearbyColleges.map((c) => (
                      <li
                        key={c.id}
                        className="flex items-start gap-2.5"
                      >
                        <Navigation className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium leading-5 text-slate-700">
                            {c.name}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {c.distanceKm} km away
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <p className="mt-3 text-xs leading-5 text-slate-400">
                    Distances are straight-line estimates, not road distances.
                  </p>
                </div>
              )}
            </section>
          </aside>
        </div>

        {/* More properties */}
        {data.sameBuilding.length > 0 && (
          <section className="mt-12">
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-widest text-teal-700">
                Explore more
              </p>
              <h2 className="mt-1 text-xl font-extrabold text-slate-900 sm:text-2xl">
                Also in {p.building?.name ?? "this building"}
              </h2>
            </div>
            <PropertyGrid properties={data.sameBuilding} />
          </section>
        )}

        {data.similarNearby.length > 0 && (
          <section className="mt-12">
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-widest text-teal-700">
                More places to stay
              </p>
              <h2 className="mt-1 text-xl font-extrabold text-slate-900 sm:text-2xl">
                More properties in {p.area}
              </h2>
            </div>
            <PropertyGrid properties={data.similarNearby} />
          </section>
        )}
      </div>

      {/* Booking modal */}
      {booking && (
        <BookingModal
          property={{
            id: p.id,
            name: p.name,
            rooms: p.rooms,
          }}
          onClose={() => setBooking(false)}
        />
      )}

      {/* Report modal */}
      {reporting && (
        <ReportModal
          title="Report this property"
          target={{ propertyId: p.id }}
          defaultType="INCORRECT_INFO"
          onClose={() => setReporting(false)}
        />
      )}
    </main>
  );
}
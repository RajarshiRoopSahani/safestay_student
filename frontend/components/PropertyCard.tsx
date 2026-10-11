"use client";

import Link from "next/link";
import {
  Building2,
  Camera,
  GitCompare,
  Heart,
  MapPin,
  Navigation,
  Utensils,
  Wifi,
  Wind,
  ShowerHead,
  Car,
  Video,
} from "lucide-react";
import RatingStars from "@/components/RatingStars";
import { useCompare } from "@/hooks/useCompare";
import { useFavorites } from "@/hooks/useFavorites";
import { Property } from "@/types";
import {
  formatRent,
  PROPERTY_TYPE_LABEL,
  ROOM_TYPE_LABEL,
} from "@/utils/format";

type Props = {
  property: Property;
  referenceLabel?: string | null;
};

export default function PropertyCard({
  property: p,
  referenceLabel,
}: Props) {
  const { isFavorite, toggle } = useFavorites();
  const fav = isFavorite(p.id);
  const compare = useCompare();
  const inCompare = compare.has(p.id);
  const photo = p.photos[0];

  let distanceText: string | null = null;

  if (p.distanceKm !== null) {
    distanceText = `${p.distanceKm} km from ${
      referenceLabel ?? "your selected point"
    }`;
  } else if (p.nearestCollege) {
    distanceText = `${p.nearestCollege.distanceKm} km from ${p.nearestCollege.name}`;
  }

  const chips = [
    p.wifi && { label: "Wi-Fi", Icon: Wifi },
    p.foodIncluded && { label: "Meals", Icon: Utensils },
    p.ac && { label: "AC", Icon: Wind },
    p.attachedBathroom && { label: "Attached bath", Icon: ShowerHead },
    p.parking && { label: "Parking", Icon: Car },
    p.cctv && { label: "CCTV", Icon: Video },
  ].filter(Boolean) as { label: string; Icon: typeof Wifi }[];

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-teal-200 hover:shadow-xl">
      {/* Property photo */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo.url}
            alt={`${p.name} photo`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-teal-50 via-slate-50 to-blue-50 text-slate-400">
            <Building2 className="h-12 w-12 text-teal-700/50" />
            <span className="text-sm font-medium">Photos coming soon</span>
          </div>
        )}

        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <div className="flex flex-col items-start gap-2">
            <span className="rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-teal-800 shadow-sm backdrop-blur">
              {PROPERTY_TYPE_LABEL[p.type]}
            </span>
            {p.isDemo && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 shadow-sm">
                Demo listing
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => toggle(p.id)}
            aria-label={fav ? "Remove from favorites" : "Save to favorites"}
            aria-pressed={fav}
            className="rounded-full bg-white/95 p-2.5 text-slate-600 shadow-sm transition hover:scale-110 hover:text-rose-500"
          >
            <Heart
              className={`h-5 w-5 ${
                fav ? "fill-rose-500 text-rose-500" : ""
              }`}
            />
          </button>
        </div>

        {photo && (
          <span className="absolute bottom-3 left-3 flex max-w-[85%] items-center gap-1.5 truncate rounded-lg bg-slate-950/70 px-2.5 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
            <Camera className="h-3.5 w-3.5 shrink-0" />
            {photo.label}
          </span>
        )}
      </div>

      {/* Property details */}
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <h3 className="line-clamp-1 text-lg font-bold tracking-tight text-slate-900 transition-colors group-hover:text-teal-800">
            {p.name}
          </h3>
          <p className="mt-1.5 flex items-start gap-1.5 text-sm text-slate-500">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
            <span className="line-clamp-2">
              {p.area}, {p.city}
            </span>
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Monthly rent
              </p>
              <p className="mt-0.5 text-xl font-extrabold text-slate-900">
                {formatRent(p.rent)}
                <span className="text-sm font-normal text-slate-500">
                  /month
                </span>
              </p>
            </div>

            <span
              className={`rounded-full px-2.5 py-1.5 text-xs font-semibold ${
                p.availability === "Available"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {p.availability === "Available"
                ? `${p.availableBeds} beds available`
                : "Currently full"}
            </span>
          </div>
          <p className="mt-2 border-t border-slate-200 pt-2 text-xs text-slate-500">
            Security deposit:{" "}
            <span className="font-semibold text-slate-700">
              {formatRent(p.deposit)}
            </span>
          </p>
        </div>

        <div className="min-h-5">
          <RatingStars rating={p.rating} reviewCount={p.reviewCount} />
        </div>

        {distanceText && (
          <p className="flex items-start gap-1.5 text-sm text-slate-600">
            <Navigation className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
            <span>{distanceText}</span>
          </p>
        )}

        {p.roomTypes.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Room options
            </p>
            <div className="flex flex-wrap gap-1.5">
              {p.roomTypes.map((t) => (
                <span
                  key={t}
                  className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600"
                >
                  {ROOM_TYPE_LABEL[t]}
                </span>
              ))}
            </div>
          </div>
        )}

        {chips.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {chips.slice(0, 4).map(({ label, Icon }) => (
              <li
                key={label}
                className="flex items-center gap-1.5 rounded-lg bg-teal-50 px-2.5 py-1.5 text-xs font-medium text-teal-800"
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </li>
            ))}
            {chips.length > 4 && (
              <li className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600">
                +{chips.length - 4} more
              </li>
            )}
          </ul>
        )}

        {/* Actions */}
        <div className="mt-auto grid grid-cols-[1fr_auto] gap-2 border-t border-slate-100 pt-4">
          <Link
            href={`/property/${p.id}`}
            className="flex items-center justify-center rounded-xl bg-teal-700 px-3 py-3 text-sm font-bold text-white transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          >
            View Details
          </Link>

          <button
            type="button"
            onClick={() => compare.toggle(p.id)}
            disabled={!inCompare && compare.isFull}
            aria-pressed={inCompare}
            title={
              !inCompare && compare.isFull
                ? "You can compare up to 4 properties"
                : "Add to comparison"
            }
            className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
              inCompare
                ? "border-teal-700 bg-teal-50 text-teal-800"
                : "border-slate-200 bg-white text-slate-700 hover:border-teal-300 hover:bg-teal-50"
            }`}
          >
            <GitCompare className="h-4 w-4" />
            {inCompare ? "Added" : "Compare"}
          </button>
        </div>
      </div>
    </article>
  );
}
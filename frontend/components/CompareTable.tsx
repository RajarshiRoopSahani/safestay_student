import Link from "next/link";
import { Building2, Check, X } from "lucide-react";
import { PropertyDetail } from "@/types";
import { formatRent, PROPERTY_TYPE_LABEL, ROOM_TYPE_LABEL } from "@/utils/format";

type Props = { properties: PropertyDetail[]; onRemove: (id: string) => void };

function Best({ children = "Best" }: { children?: string }) {
  return (
    <span className="ml-2 whitespace-nowrap rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
      {children}
    </span>
  );
}

function Bool({ on }: { on: boolean }) {
  return on ? (
    <span className="inline-flex items-center gap-1 text-emerald-700">
      <Check className="h-4 w-4" /> Yes
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-slate-400">
      <X className="h-4 w-4" /> Not listed
    </span>
  );
}

export default function CompareTable({ properties, onRemove }: Props) {
  const many = properties.length > 1;
  const minRent = Math.min(...properties.map((p) => p.rent));
  const minDeposit = Math.min(...properties.map((p) => p.deposit));

  const rated = properties.filter((p) => p.rating !== null);
  const maxRating = rated.length > 1 ? Math.max(...rated.map((p) => p.rating as number)) : null;

  const withDistance = properties.filter((p) => p.nearestCollege);
  const minDistance = withDistance.length > 1 ? Math.min(...withDistance.map((p) => p.nearestCollege!.distanceKm)) : null;

  const rows: { label: string; render: (p: PropertyDetail) => React.ReactNode }[] = [
    {
      label: "Monthly rent",
      render: (p) => (
        <div>
          <span className="text-base font-bold text-slate-900">{formatRent(p.rent)}</span>
          {many && p.rent === minRent && <Best>Lowest</Best>}
          {many && p.rent > minRent && (
            <p className="text-xs text-slate-500">+{formatRent(p.rent - minRent)} vs lowest</p>
          )}
        </div>
      ),
    },
    {
      label: "Security deposit",
      render: (p) => (
        <span>
          {formatRent(p.deposit)}
          {many && p.deposit === minDeposit && <Best>Lowest</Best>}
        </span>
      ),
    },
    {
      label: "Rating",
      render: (p) =>
        p.rating === null ? (
          <span className="text-slate-500">Not enough reviews yet.</span>
        ) : (
          <span>
            {p.rating} / 5 {maxRating !== null && p.rating === maxRating && <Best>Highest</Best>}
          </span>
        ),
    },
    { label: "Approved reviews", render: (p) => p.reviewCount },
    {
      label: "Nearest college",
      render: (p) =>
        p.nearestCollege ? (
          <div>
            <p>{p.nearestCollege.name}</p>
            <p className="text-slate-500">
              {p.nearestCollege.distanceKm} km
              {minDistance !== null && p.nearestCollege.distanceKm === minDistance && <Best>Closest</Best>}
            </p>
          </div>
        ) : (
          <span className="text-slate-400">Not available</span>
        ),
    },
    {
      label: "Room types",
      render: (p) =>
        p.rooms.length === 0 ? (
          <span className="text-slate-400">Not listed</span>
        ) : (
          <ul className="space-y-1">
            {p.rooms.map((r) => (
              <li key={r.id}>
                {ROOM_TYPE_LABEL[r.type]} · {formatRent(r.rent)}
              </li>
            ))}
          </ul>
        ),
    },
    {
      label: "Availability",
      render: (p) =>
        p.availableBeds > 0 ? (
          <span className="text-emerald-700">{p.availableBeds} beds available</span>
        ) : (
          <span className="text-slate-500">Currently full</span>
        ),
    },
    { label: "Meals included", render: (p) => <Bool on={p.foodIncluded} /> },
    { label: "Wi-Fi", render: (p) => <Bool on={p.wifi} /> },
    { label: "AC", render: (p) => <Bool on={p.ac} /> },
    { label: "Cooler", render: (p) => <Bool on={p.cooler} /> },
    { label: "Attached bathroom", render: (p) => <Bool on={p.attachedBathroom} /> },
    { label: "Laundry", render: (p) => <Bool on={p.laundry} /> },
    { label: "Parking", render: (p) => <Bool on={p.parking} /> },
    { label: "CCTV (as listed)", render: (p) => <Bool on={p.cctv} /> },
    { label: "Furnished", render: (p) => <Bool on={p.furnished} /> },
    {
      label: "Other amenities",
      render: (p) =>
        p.amenities.length === 0 ? (
          <span className="text-slate-400">None listed</span>
        ) : (
          <span className="text-slate-600">{p.amenities.join(", ")}</span>
        ),
    },
  ];

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 align-top">
            <th className="sticky left-0 z-10 w-36 bg-white p-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Property
            </th>
            {properties.map((p) => (
              <th key={p.id} className="min-w-[210px] p-4 font-normal">
                <div className="mb-3 aspect-[16/10] overflow-hidden rounded-lg bg-slate-100">
                  {p.officialPhotos[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.officialPhotos[0].url} alt={`${p.name} photo`} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-300">
                      <Building2 className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <Link href={`/property/${p.id}`} className="font-semibold text-slate-900 hover:text-indigo-600">
                  {p.name}
                </Link>
                <p className="text-xs text-slate-500">
                  {PROPERTY_TYPE_LABEL[p.type]} · {p.area}
                </p>
                {p.isDemo && <p className="mt-1 text-xs text-amber-700">Demo data</p>}
                <button onClick={() => onRemove(p.id)} className="mt-2 text-xs font-medium text-red-600 hover:underline">
                  Remove
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-slate-100 last:border-0">
              <th scope="row" className="sticky left-0 z-10 bg-white p-4 text-left text-sm font-medium text-slate-600">
                {row.label}
              </th>
              {properties.map((p) => (
                <td key={p.id} className="p-4 align-top text-slate-700">
                  {row.render(p)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

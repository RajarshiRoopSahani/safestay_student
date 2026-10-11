import { Check, X } from "lucide-react";
import { Property } from "@/types";

type Props = {
  property: Pick<
    Property,
    | "foodIncluded" | "wifi" | "ac" | "cooler" | "attachedBathroom" | "laundry"
    | "parking" | "cctv" | "furnished" | "electricityIncluded" | "amenities"
  >;
};

export default function AmenityList({ property: p }: Props) {
  const rows = [
    { label: "Meals included", on: p.foodIncluded },
    { label: "Wi-Fi", on: p.wifi },
    { label: "AC", on: p.ac },
    { label: "Cooler", on: p.cooler },
    { label: "Attached bathroom", on: p.attachedBathroom },
    { label: "Laundry", on: p.laundry },
    { label: "Parking", on: p.parking },
    { label: "CCTV (as listed)", on: p.cctv },
    { label: "Furnished", on: p.furnished },
    { label: "Electricity included", on: p.electricityIncluded },
  ];

  return (
    <div>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {rows.map(({ label, on }) => (
          <li key={label} className={`flex items-center gap-2 text-sm ${on ? "text-slate-800" : "text-slate-400"}`}>
            {on ? (
              <Check className="h-4 w-4 text-emerald-600" aria-label="Available" />
            ) : (
              <X className="h-4 w-4 text-slate-300" aria-label="Not listed" />
            )}
            {label}
          </li>
        ))}
      </ul>

      {p.amenities.length > 0 && (
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-slate-800">Other listed amenities</h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {p.amenities.map((a) => (
              <li key={a} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                {a}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

import PropertyCard from "@/components/PropertyCard";
import { Property } from "@/types";

type Props = { properties: Property[]; referenceLabel?: string | null };

export default function PropertyGrid({ properties, referenceLabel }: Props) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {properties.map((p) => (
        <PropertyCard key={p.id} property={p} referenceLabel={referenceLabel} />
      ))}
    </div>
  );
}

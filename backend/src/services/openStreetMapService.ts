
type OSMElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

export async function searchOSMPlaces(
  query: string,
  city = "Lucknow"
) {
  const searchText = [query.trim(), city].filter(Boolean).join(", ");

  if (!query.trim()) return [];

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", searchText);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "10");

  const response = await fetch(url, {
    headers: {
      "User-Agent": "SafeStayStudentHousing/1.0",
    },
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new Error(`OpenStreetMap search failed: ${response.status}`);
  }

  const data = (await response.json()) as Array<{
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
    type: string;
    address?: Record<string, string>;
  }>;

  return data.map((place) => ({
    externalId: `nominatim:${place.place_id}`,
    name: place.display_name.split(",")[0],
    address: place.display_name,
    latitude: Number(place.lat),
    longitude: Number(place.lon),
    category: place.type,
    source: "OPENSTREETMAP",
  }));
}

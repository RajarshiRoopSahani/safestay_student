import { api } from "./api";
import { Property } from "@/types";

export async function fetchFavorites(): Promise<Property[]> {
  const { data } = await api.get<{ favorites: Property[] }>("/favorites");
  return data.favorites;
}

export async function addFavorite(propertyId: string): Promise<void> {
  await api.post("/favorites", { propertyId });
}

export async function removeFavorite(propertyId: string): Promise<void> {
  await api.delete(`/favorites/${propertyId}`);
}

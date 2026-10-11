import { api } from "./api";
import { College, PropertyDetailResponse, SearchResponse } from "@/types";

export async function searchProperties(params: Record<string, string>): Promise<SearchResponse> {
  const { data } = await api.get<SearchResponse>("/search", { params });
  return data;
}

export async function fetchColleges(): Promise<College[]> {
  const { data } = await api.get<{ colleges: College[] }>("/colleges");
  return data.colleges;
}

export async function fetchProperty(id: string): Promise<PropertyDetailResponse> {
  const { data } = await api.get<PropertyDetailResponse>(`/properties/${id}`);
  return data;
}

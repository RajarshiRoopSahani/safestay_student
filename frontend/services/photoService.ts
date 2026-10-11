import { api } from "./api";
import { MyPhoto, Photo, PhotoCategory } from "@/types";

export async function uploadPhoto(
  propertyId: string,
  file: File,
  category: PhotoCategory
): Promise<{ photo: Photo; message: string }> {
  const form = new FormData();
  form.append("category", category);
  form.append("photo", file); // the backend expects the field name "photo"
  const { data } = await api.post<{ photo: Photo; message: string }>(`/properties/${propertyId}/photos`, form);
  return data;
}

export async function fetchMyPhotos(): Promise<MyPhoto[]> {
  const { data } = await api.get<{ photos: MyPhoto[] }>("/photos/mine");
  return data.photos;
}

export async function uploadOfficialPhoto(
  propertyId: string,
  file: File,
  category: PhotoCategory
): Promise<{ photo: Photo; message: string }> {
  const form = new FormData();
  form.append("category", category);
  form.append("official", "true"); // the backend only honors this for admins
  form.append("photo", file);
  const { data } = await api.post<{ photo: Photo; message: string }>(`/properties/${propertyId}/photos`, form);
  return data;
}

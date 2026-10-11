import { api } from "./api";
import { ModerationStatus, PhotoCategory, PropertyType, ReportType, Role, Room, RoomType } from "@/types";

export type ReportStatus = "OPEN" | "IN_REVIEW" | "RESOLVED" | "REJECTED";

type Paged = { total: number; page: number; totalPages: number };

// Removes empty values so they are not sent as ?q=&status=
function clean(params: Record<string, string | number | undefined>) {
  return Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ""));
}

/* ---------------- Types ---------------- */

export interface AdminStats {
  totalStudents: number;
  totalProperties: number;
  activeProperties: number;
  inactiveProperties: number;
  totalBookings: number;
  pendingBookings: number;
  pendingPhotos: number;
  pendingReviews: number;
  openReports: number;
  bookingsByStatus: Record<string, number>;
  propertiesByType: Record<string, number>;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  createdAt: string;
  _count: { bookings: number; reviews: number; photos: number };
}

export interface AdminPropertyRow {
  id: string;
  name: string;
  type: PropertyType;
  area: string;
  city: string;
  rent: number;
  isActive: boolean;
  isDemo: boolean;
  createdAt: string;
  rooms: Room[];
  _count: { reviews: number; photos: number; bookings: number; reports: number };
}

export interface AdminPhoto {
  id: string;
  url: string;
  category: PhotoCategory;
  isOfficial: boolean;
  status: ModerationStatus;
  createdAt: string;
  uploaderId: string;
  aiObservation: string | null;
  property: { id: string; name: string; area: string };
  _count: { reports: number };
}

export interface AdminReview {
  id: string;
  rating: number;
  text: string;
  verified: boolean;
  status: ModerationStatus;
  createdAt: string;
  userId: string;
  property: { id: string; name: string; area: string };
  _count: { reports: number };
}

export interface AdminReport {
  id: string;
  type: ReportType;
  details: string;
  status: ReportStatus;
  createdAt: string;
  reporter: { id: string; name: string; email: string };
  property: { id: string; name: string; area: string; isActive: boolean } | null;
  photo: { id: string; url: string; status: ModerationStatus; category: PhotoCategory } | null;
  review: { id: string; text: string; rating: number; status: ModerationStatus } | null;
}

export interface AdminBuilding {
  id: string;
  name: string;
  address: string;
  city: string;
  area: string;
  pincode: string | null;
  latitude: number;
  longitude: number;
  _count: { properties: number };
}

export interface BuildingInput {
  name: string;
  address: string;
  city: string;
  area: string;
  pincode?: string;
  latitude: number;
  longitude: number;
}

export interface RoomInput {
  type: RoomType;
  rent: number;
  totalBeds: number;
  availableBeds: number;
}

export interface PropertyPayload {
  name: string;
  type: PropertyType;
  description: string;
  buildingId: string | null;
  address: string;
  city: string;
  area: string;
  pincode: string;
  latitude: number;
  longitude: number;
  rent: number;
  deposit: number;
  foodIncluded: boolean;
  wifi: boolean;
  ac: boolean;
  cooler: boolean;
  attachedBathroom: boolean;
  laundry: boolean;
  parking: boolean;
  cctv: boolean;
  furnished: boolean;
  electricityIncluded: boolean;
  waterInfo: string;
  rules: string;
  securityInfo: string;
  nearbyPlaces: string;
  isActive: boolean;
  amenities: string[];
  rooms?: RoomInput[]; // only used when creating
}

/* ---------------- Dashboard, users ---------------- */

export async function fetchStats(): Promise<AdminStats> {
  const { data } = await api.get<AdminStats>("/admin/stats");
  return data;
}

export async function fetchAdminUsers(params: { q?: string; role?: string; page?: number }) {
  const { data } = await api.get<Paged & { users: AdminUser[] }>("/admin/users", { params: clean(params) });
  return data;
}

/* ---------------- Properties ---------------- */

export async function fetchAdminProperties(params: { q?: string; status?: string; page?: number }) {
  const { data } = await api.get<Paged & { properties: AdminPropertyRow[] }>("/admin/properties", {
    params: clean(params),
  });
  return data;
}

export async function createProperty(payload: PropertyPayload): Promise<{ id: string }> {
  const { data } = await api.post<{ id: string }>("/properties", payload);
  return data;
}

export async function updateProperty(id: string, payload: Partial<PropertyPayload>): Promise<void> {
  await api.put(`/properties/${id}`, payload);
}

export async function deleteProperty(id: string): Promise<void> {
  await api.delete(`/properties/${id}`);
}

/* ---------------- Rooms ---------------- */

export async function addRoom(propertyId: string, room: RoomInput): Promise<void> {
  await api.post(`/admin/properties/${propertyId}/rooms`, room);
}

export async function updateRoom(id: string, room: Partial<RoomInput>): Promise<void> {
  await api.put(`/admin/rooms/${id}`, room);
}

export async function deleteRoom(id: string): Promise<void> {
  await api.delete(`/admin/rooms/${id}`);
}

/* ---------------- Buildings ---------------- */

export async function fetchBuildings(): Promise<AdminBuilding[]> {
  const { data } = await api.get<{ buildings: AdminBuilding[] }>("/admin/buildings");
  return data.buildings;
}

export async function createBuilding(input: BuildingInput): Promise<void> {
  await api.post("/admin/buildings", input);
}

export async function updateBuilding(id: string, input: BuildingInput): Promise<void> {
  await api.put(`/admin/buildings/${id}`, input);
}

/* ---------------- Photos ---------------- */

export async function fetchAdminPhotos(params: { status: string; page?: number }) {
  const { data } = await api.get<Paged & { photos: AdminPhoto[] }>("/admin/photos", { params: clean(params) });
  return data;
}

export async function moderatePhoto(id: string, status: ModerationStatus): Promise<void> {
  await api.put(`/admin/photos/${id}`, { status });
}

export async function deleteAdminPhoto(id: string): Promise<void> {
  await api.delete(`/admin/photos/${id}`);
}

export async function analyzePhoto(id: string): Promise<{ aiObservation: string; privacyConcern: boolean }> {
  const { data } = await api.post<{ aiObservation: string; privacyConcern: boolean }>(`/admin/photos/${id}/analyze`);
  return data;
}

export async function clearPhotoAnalysis(id: string): Promise<void> {
  await api.delete(`/admin/photos/${id}/analysis`);
}

/* ---------------- Reviews ---------------- */

export async function fetchAdminReviews(params: { status: string; page?: number }) {
  const { data } = await api.get<Paged & { reviews: AdminReview[] }>("/admin/reviews", { params: clean(params) });
  return data;
}

export async function moderateReview(id: string, status: ModerationStatus): Promise<void> {
  await api.put(`/admin/reviews/${id}`, { status });
}

export async function deleteAdminReview(id: string): Promise<void> {
  await api.delete(`/admin/reviews/${id}`);
}

/* ---------------- Reports ---------------- */

export async function fetchAdminReports(params: { status?: string; type?: string; page?: number }) {
  const { data } = await api.get<Paged & { reports: AdminReport[] }>("/admin/reports", { params: clean(params) });
  return data;
}

export async function updateReport(id: string, status: ReportStatus): Promise<void> {
  await api.put(`/admin/reports/${id}`, { status });
}

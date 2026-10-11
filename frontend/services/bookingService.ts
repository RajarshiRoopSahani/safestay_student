import { api } from "./api";
import { Booking, BookingStatus, RoomType } from "@/types";

export interface CreateBookingInput {
  propertyId: string;
  roomType: RoomType;
  moveInDate: string; // YYYY-MM-DD
  occupants: number;
  contactName: string;
  contactPhone: string;
  note?: string;
}

export interface BookingsResponse {
  total: number;
  page: number;
  totalPages: number;
  bookings: Booking[];
}

export async function createBooking(
  input: CreateBookingInput
): Promise<{ booking: { id: string; status: BookingStatus }; message: string }> {
  const { data } = await api.post("/bookings", input);
  return data;
}

export async function fetchBookings(params: { status?: string; page?: number }): Promise<BookingsResponse> {
  const { data } = await api.get<BookingsResponse>("/bookings", { params });
  return data;
}

export async function cancelBooking(id: string): Promise<void> {
  await api.put(`/bookings/${id}`, { status: "CANCELLED" });
}

export async function updateBookingStatus(id: string, status: "APPROVED" | "REJECTED"): Promise<void> {
  await api.put(`/bookings/${id}`, { status });
}

import { api } from "./api";
import { Review, ReviewsResponse } from "@/types";

export async function fetchReviews(propertyId: string, page = 1): Promise<ReviewsResponse> {
  const { data } = await api.get<ReviewsResponse>(`/properties/${propertyId}/reviews`, {
    params: { page, limit: 5 },
  });
  return data;
}

export async function submitReview(
  propertyId: string,
  rating: number,
  text: string
): Promise<{ review: Review; message: string }> {
  const { data } = await api.post<{ review: Review; message: string }>(`/properties/${propertyId}/reviews`, {
    rating,
    text,
  });
  return data;
}

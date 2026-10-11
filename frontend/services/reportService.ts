import { api } from "./api";
import { ReportType } from "@/types";

export interface CreateReportInput {
  type: ReportType;
  details: string;
  propertyId?: string;
  photoId?: string;
  reviewId?: string;
}

export async function createReport(input: CreateReportInput): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>("/reports", input);
  return data;
}

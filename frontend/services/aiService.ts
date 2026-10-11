import { api } from "./api";
import { ChatMessage, ChatProperty, RecommendationResponse, RoomType } from "@/types";

export interface RecommendInput {
  budget?: number;
  location?: string;
  collegeId?: string;
  lat?: number;
  lng?: number;
  maxDistance?: number;
  roomType?: RoomType;
  food?: boolean;
  wifi?: boolean;
  ac?: boolean;
  bathroom?: boolean;
  parking?: boolean;
  security?: boolean;
  furnished?: boolean;
  limit?: number;
}

export async function recommend(input: RecommendInput): Promise<RecommendationResponse> {
  const { data } = await api.post<RecommendationResponse>("/ai/recommend", input);
  return data;
}

export async function sendChat(message: string): Promise<{ reply: string; properties: ChatProperty[]; disclaimer: string }> {
  const { data } = await api.post("/ai/chat", { message });
  return data;
}

export async function fetchChatHistory(): Promise<ChatMessage[]> {
  const { data } = await api.get<{ messages: { id: string; role: "user" | "assistant"; content: string }[] }>("/ai/history");
  return data.messages.map((m) => ({ id: m.id, role: m.role, content: m.content }));
}

export async function clearChatHistory(): Promise<void> {
  await api.delete("/ai/history");
}

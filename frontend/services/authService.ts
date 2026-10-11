import { api } from "./api";
import { User } from "@/types";

type AuthResponse = { token: string; user: User };

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/register", input);
  return data;
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/login", { email, password });
  return data;
}

export async function fetchMe(): Promise<User> {
  const { data } = await api.get<{ user: User }>("/auth/me");
  return data.user;
}

export async function requestPasswordReset(email: string): Promise<string> {
  const { data } = await api.post<{ message: string }>("/auth/forgot-password", { email });
  return data.message;
}

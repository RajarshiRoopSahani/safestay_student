import axios from "axios";

export const TOKEN_KEY = "safestay_token";

const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const api = axios.create({
  baseURL: `${baseURL}/api`,
  timeout: 60000,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (err.code === "ERR_NETWORK") {
      return "Cannot reach the server. Please check your connection and try again.";
    }
    const data = err.response?.data as
      | { error?: string; details?: Record<string, string[]> }
      | undefined;
    if (data?.details) {
      const first = Object.values(data.details).flat()[0];
      if (first) return first;
    }
    if (data?.error) return data.error;
    return err.message;
  }
  return "Something went wrong. Please try again.";
}

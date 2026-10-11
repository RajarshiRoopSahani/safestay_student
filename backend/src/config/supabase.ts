
import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

export const supabase = createClient(
  env.supabase.url,
  env.supabase.secretKey
);

export const PHOTO_BUCKET = "hotel-photos";

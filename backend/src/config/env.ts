
import dotenv from "dotenv";
dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export const env = {
  port: Number(process.env.PORT) || 5000,
  databaseUrl: required("DATABASE_URL"),
  jwtSecret: required("JWT_SECRET"),
  frontendUrl: required("FRONTEND_URL"),
   aiApiKey: process.env.AI_API_KEY || "",
  aiModel: process.env.AI_MODEL || "gemma4:31b",

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
    apiKey: process.env.CLOUDINARY_API_KEY || "",
    apiSecret: process.env.CLOUDINARY_API_SECRET || "",
  },

  supabase: {
    url: required("SUPABASE_URL"),
    secretKey: required("SUPABASE_SECRET_KEY"),
  },
};

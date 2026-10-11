import { v2 as cloudinary } from "cloudinary";
import { env } from "./env";

const isReal = (v: string) => v !== "" && !v.startsWith("your-") && !v.startsWith("replace-");

export const cloudinaryConfigured =
  isReal(env.cloudinary.cloudName) && isReal(env.cloudinary.apiKey) && isReal(env.cloudinary.apiSecret);

if (cloudinaryConfigured) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true,
  });
}

export { cloudinary };
